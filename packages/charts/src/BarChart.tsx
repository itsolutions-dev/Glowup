import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "@its/glowup-ui";
import {
  ChartAxes,
  labelStride,
  labelWidth,
  type Plot,
  type XLabel,
} from "./ChartAxes";
import { ChartFrame } from "./ChartFrame";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";
import { makeValueFormatter } from "./core/format";
import { resolveSeriesColors, themeSeriesColors } from "./core/palette";
import { stackValues } from "./core/paths";
import { bandScale, valueScale } from "./core/scales";
import { describeChart } from "./core/summary";
import type { ChartDatum, ChartSeries } from "./core/types";

export type BarChartProps = {
  /** One object per category: its `label` and one number per series key. */
  data: ChartDatum[];
  series: ChartSeries[];
  height?: number;
  /** Pile the series up in one bar per category instead of side by side. */
  stacked?: boolean;
  /** A horizontal reference line at this value. */
  target?: number;
  /** One colour per series, in order; a series' own `color` wins. Default: roles of the theme. */
  colors?: string[];
  title?: string;
  /** BCP 47 tag for the numbers. Default "en-US". */
  locale?: string;
  numberFormat?: Intl.NumberFormatOptions;
  /** Replaces the number formatting altogether. */
  formatValue?: (value: number) => string;
  loading?: boolean;
  emptyLabel?: string;
  /** A category was tapped (its index) or the same one tapped again (null). */
  onSelect?: (index: number | null) => void;
  testID?: string;
};

const num = (v: ChartDatum[string]): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const BarChart = ({
  data,
  series,
  height = 240,
  stacked = false,
  target,
  colors,
  title,
  locale,
  numberFormat,
  formatValue,
  loading,
  emptyLabel = "No data",
  onSelect,
  testID,
}: BarChartProps) => {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const seriesColors = resolveSeriesColors(
    series,
    colors ?? themeSeriesColors(theme.colors),
  );
  const format = useMemo(() => {
    const f = makeValueFormatter({ locale, options: numberFormat });
    return formatValue
      ? (v: number | null | undefined) => (v == null ? f(v) : formatValue(v))
      : f;
  }, [locale, numberFormat, formatValue]);
  const keys = series.map((s) => s.key);
  const names = series.map((s) => s.label ?? s.key);
  const fontSize = theme.typography.labelSmall.fontSize ?? 11;
  const labels = data.map((d) => d.label);
  const stacks = useMemo(
    () =>
      stacked
        ? stackValues(
            data,
            series.map((s) => s.key),
          )
        : null,
    [stacked, data, series],
  );
  const empty = data.length === 0 || series.length === 0;
  const active = hovered ?? selected;

  const summary = describeChart({
    title,
    labels,
    series: series.map((s, i) => ({
      name: names[i],
      values: data.map((d) => num(d[s.key])),
    })),
    format,
  });

  const toggle = (index: number) => {
    const next = selected === index ? null : index;
    setSelected(next);
    onSelect?.(next);
  };

  return (
    <ChartFrame
      height={height}
      loading={loading}
      empty={empty}
      emptyLabel={emptyLabel}
      summary={summary}
      testID={testID}
    >
      {({ width }) => {
        // The value scale first, with a dummy range, only to know how wide the labels are.
        const values = stacks
          ? stacks.flatMap((s) => s.flatMap((p) => [p.start, p.end]))
          : data.flatMap((d) => keys.map((k) => num(d[k])));
        const allValues = target != null ? [...values, target] : values;
        const rough = valueScale({ values: allValues, range: [1, 0] });
        const widest = Math.max(
          ...rough.ticks.map((t) => labelWidth(format(t), fontSize)),
        );
        const plot: Plot = {
          left: Math.ceil(widest) + 12,
          top: 12,
          width: Math.max(0, width - Math.ceil(widest) - 12 - 8),
          height: Math.max(0, height - 12 - fontSize - 14),
        };
        const y = valueScale({
          values: allValues,
          range: [plot.height + plot.top, plot.top],
        });
        const band = bandScale(data.length, [0, plot.width]);
        const stride = labelStride(labels, fontSize, band.step);
        const xLabels: XLabel[] = labels
          .map((label, i) => ({
            label,
            x: plot.left + band.start(i) + band.width / 2,
          }))
          .filter((_, i) => i % stride === 0);
        const zeroY = y.at(0);
        const barWidth = stacked ? band.width : band.width / keys.length;

        const bars = data.flatMap((d, i) =>
          keys.map((k, s) => {
            const x = plot.left + band.start(i) + (stacked ? 0 : s * barWidth);
            let top: number;
            let bottom: number;
            if (stacks) {
              const span = stacks[s][i];
              top = y.at(Math.max(span.start, span.end));
              bottom = y.at(Math.min(span.start, span.end));
            } else {
              const v = num(d[k]);
              if (v === null) return null;
              top = y.at(Math.max(v, 0));
              bottom = y.at(Math.min(v, 0));
            }
            if (bottom - top <= 0) return null;
            return (
              <Rect
                key={`${i}-${k}`}
                testID={testID ? `${testID}-bar-${i}-${k}` : undefined}
                x={x + (stacked || keys.length === 1 ? 0 : 1)}
                y={top}
                width={Math.max(
                  0,
                  barWidth - (stacked || keys.length === 1 ? 0 : 2),
                )}
                height={bottom - top}
                rx={2}
                fill={seriesColors[s]}
                opacity={active === null || active === i ? 1 : 0.45}
              />
            );
          }),
        );

        const tooltip = (() => {
          if (active === null || active >= data.length) return null;
          const d = data[active];
          const rows: TooltipRow[] = keys.map((k, s) => ({
            color: seriesColors[s],
            name: names[s],
            value: format(num(d[k])),
          }));
          const tops = keys
            .map((k, s) => {
              const span = stacks?.[s][active];
              const v = span ? Math.max(span.start, span.end) : num(d[k]);
              return v === null ? zeroY : y.at(v);
            })
            .concat(zeroY);
          return (
            <ChartTooltip
              x={plot.left + band.start(active) + band.width / 2}
              y={Math.min(...tops)}
              containerWidth={width}
              title={d.label}
              rows={rows}
            />
          );
        })();

        return (
          <>
            <Svg
              width={width}
              height={height}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <ChartAxes
                plot={plot}
                fontSize={fontSize}
                xLabels={xLabels}
                yTicks={y.ticks.map((t) => ({ y: y.at(t), label: format(t) }))}
              />
              <G>{bars}</G>
              {target != null && (
                <G>
                  <Line
                    x1={plot.left}
                    x2={plot.left + plot.width}
                    y1={y.at(target)}
                    y2={y.at(target)}
                    stroke={theme.colors.tertiary}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                  />
                  <SvgText
                    x={plot.left + plot.width}
                    y={y.at(target) - 4}
                    fontSize={fontSize}
                    fontFamily={theme.typography.labelSmall.fontFamily}
                    fill={theme.colors.tertiary}
                    textAnchor="end"
                  >
                    {format(target)}
                  </SvgText>
                </G>
              )}
            </Svg>
            {data.map((_, i) => (
              <Pressable
                key={i}
                testID={testID ? `${testID}-category-${i}` : undefined}
                accessible={false}
                onPress={() => toggle(i)}
                onHoverIn={() => setHovered(i)}
                onHoverOut={() => setHovered(null)}
                style={{
                  position: "absolute",
                  left:
                    plot.left + band.start(i) - (band.step - band.width) / 2,
                  width: band.step,
                  top: plot.top,
                  height: plot.height,
                }}
              />
            ))}
            {tooltip}
          </>
        );
      }}
    </ChartFrame>
  );
};

export default BarChart;
export { BarChart };
