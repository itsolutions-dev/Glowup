import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "@its/glowup-ui";
import { ChartAxes, labelWidth, type Plot } from "./ChartAxes";
import { ChartFrame } from "./ChartFrame";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip } from "./ChartTooltip";
import { makeValueFormatter } from "./core/format";
import { resolveSeriesColors, themeSeriesColors } from "./core/palette";
import { linePath } from "./core/paths";
import { valueScale } from "./core/scales";
import { formatMoment, timeScale, toTime } from "./core/time";
import type { ChartSeries, CurveName } from "./core/types";

/** One point: where it sits, and optionally its name, its group (a series key), its own colour and radius. */
export type ScatterDatum = {
  x: number | Date;
  y: number;
  label?: string;
  /** The key of the series it belongs to; without it, the first series. */
  series?: string;
  color?: string;
  /** Radius in pixels. Default: the chart's `radius`. */
  r?: number;
};

export type ScatterChartProps = {
  data: ScatterDatum[];
  /** The groups the points belong to: colours, legend names. Default: one group. */
  series?: ChartSeries[];
  height?: number;
  colors?: string[];
  /** A key under the chart; a tap on a group switches it off and the axes follow. */
  legend?: boolean;
  /** Join each group's points in the order of x. A `stepAfter` line holds each value until the next point. */
  line?: CurveName;
  /** Fixed ends of the value axis (0–100 for a percentage, say) instead of the data's. */
  yDomain?: [number, number];
  /** Keep 0 on the value axis. Default false: points rarely need it. */
  zero?: boolean;
  /** Default radius of a point. Default 5. */
  radius?: number;
  title?: string;
  /** BCP 47 tag for the numbers and dates. Default "en-US". */
  locale?: string;
  numberFormat?: Intl.NumberFormatOptions;
  /** Replaces the formatting of the values (y). */
  formatValue?: (value: number) => string;
  /** Replaces the formatting of x: a number, or a date when the points' x are dates. */
  formatX?: (x: number | Date) => string;
  loading?: boolean;
  emptyLabel?: string;
  /** A point was tapped (its index in `data`) or the same one tapped again (null). */
  onSelect?: (index: number | null) => void;
  testID?: string;
};

const INSET = 12;
const HIT = 24;
const DEFAULT_SERIES: ChartSeries[] = [{ key: "" }];

/**
 * Points on two value axes, or on time and a value when x is a `Date`: a dispersion, or events along
 * a time line (with `line="stepAfter"`, a level held from one event to the next). A point is a
 * button: a tap or a hover shows its tooltip.
 */
const ScatterChart = ({
  data,
  series = DEFAULT_SERIES,
  height = 240,
  colors,
  legend,
  line,
  yDomain,
  zero = false,
  radius = 5,
  title,
  locale = "en-US",
  numberFormat,
  formatValue,
  formatX,
  loading,
  emptyLabel = "No data",
  onSelect,
  testID,
}: ScatterChartProps) => {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const fontSize = theme.typography.labelMedium.fontSize ?? 12;
  const allColors = resolveSeriesColors(
    series,
    colors ?? themeSeriesColors(theme),
  );
  const groupOf = (d: ScatterDatum) =>
    Math.max(
      0,
      series.findIndex((s) => s.key === (d.series ?? series[0].key)),
    );
  const isTime = data.some((d) => d.x instanceof Date);
  const format = useMemo(() => {
    const f = makeValueFormatter({ locale, options: numberFormat });
    return (v: number) => (formatValue ? formatValue(v) : f(v));
  }, [locale, numberFormat, formatValue]);
  const writeX = (x: number | Date) =>
    formatX
      ? formatX(x)
      : isTime
        ? formatMoment(x, locale)
        : makeValueFormatter({ locale, options: numberFormat })(toTime(x));
  // Points of a group switched off are left out, by their index in `data`.
  const shown = data
    .map((d, i) => ({ d, i, g: groupOf(d) }))
    .filter(
      ({ d, g }) =>
        !hidden.includes(series[g].key) &&
        toTime(d.x) !== null &&
        Number.isFinite(d.y),
    );
  const active = hovered ?? selected;
  const toggle = (i: number) => {
    const next = selected === i ? null : i;
    setSelected(next);
    onSelect?.(next);
  };
  const xs = shown.map(({ d }) => toTime(d.x) as number);
  const ys = shown.map(({ d }) => d.y);
  const summary = shown.length
    ? `${title ? `${title}: ` : ""}${shown.length} points, x from ${writeX(
        isTime ? new Date(Math.min(...xs)) : Math.min(...xs),
      )} to ${writeX(
        isTime ? new Date(Math.max(...xs)) : Math.max(...xs),
      )}, values from ${format(Math.min(...ys))} to ${format(Math.max(...ys))}`
    : emptyLabel;

  const frame = (
    <ChartFrame
      height={height}
      loading={loading}
      empty={shown.length === 0}
      emptyLabel={emptyLabel}
      summary={summary}
      testID={testID}
    >
      {({ width }) => {
        const yValues = yDomain ? [...yDomain] : ys;
        const rough = valueScale({ values: yValues, range: [1, 0], zero });
        const left =
          Math.ceil(
            Math.max(
              ...rough.ticks.map((t) => labelWidth(format(t), fontSize)),
            ),
          ) + 12;
        const plot: Plot = {
          left,
          top: 12,
          width: Math.max(0, width - left - 8),
          height: Math.max(0, height - 12 - fontSize - 14),
        };
        const v = valueScale({
          values: yValues,
          range: [plot.top + plot.height, plot.top],
          zero,
        });
        const xRange: [number, number] = [
          plot.left + INSET,
          plot.left + plot.width - INSET,
        ];
        const tickCount = Math.max(2, Math.floor(plot.width / 90));
        const x = isTime
          ? timeScale({ values: xs, range: xRange, tickCount, locale })
          : (() => {
              const s = valueScale({
                values: xs,
                range: xRange,
                zero: false,
                tickCount,
              });
              return { ...s, format: (t: number | Date) => writeX(t) };
            })();
        const xAt = (value: number | Date) =>
          isTime
            ? (x as ReturnType<typeof timeScale>).at(value)
            : (x as { at: (n: number) => number }).at(toTime(value) ?? 0);
        const points = shown.map(({ d, i, g }) => ({
          i,
          g,
          cx: xAt(d.x),
          cy: v.at(d.y),
          r: d.r ?? radius,
          color: d.color ?? allColors[g],
        }));
        const lines = line
          ? series.map((s, g) => {
              const own = points
                .filter((p) => p.g === g)
                .sort((a, b) => a.cx - b.cx)
                .map((p) => ({ x: p.cx, y: p.cy }));
              return { key: s.key || `g${g}`, d: linePath(own, line), g };
            })
          : [];
        const at = points.find((p) => p.i === active);
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
                categories={x.ticks.map((t) => ({
                  at: xAt(t),
                  label: x.format(t),
                }))}
                valueTicks={v.ticks.map((t) => ({
                  at: v.at(t),
                  label: format(t),
                }))}
              />
              {lines.map((l) =>
                l.d ? (
                  <Path
                    key={l.key}
                    testID={testID ? `${testID}-line-${l.key}` : undefined}
                    d={l.d}
                    fill="none"
                    stroke={allColors[l.g]}
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                ) : null,
              )}
              <G>
                {points.map((p) => (
                  <Circle
                    key={p.i}
                    testID={testID ? `${testID}-point-${p.i}` : undefined}
                    cx={p.cx}
                    cy={p.cy}
                    r={active === p.i ? p.r + 2 : p.r}
                    fill={p.color}
                    fillOpacity={0.85}
                    stroke={theme.colors.surface}
                    strokeWidth={active === p.i ? 2 : 1}
                  />
                ))}
              </G>
            </Svg>
            {points.map((p) => (
              <Pressable
                key={p.i}
                testID={testID ? `${testID}-hit-${p.i}` : undefined}
                accessible={false}
                onPress={() => toggle(p.i)}
                onHoverIn={() => setHovered(p.i)}
                onHoverOut={() => setHovered(null)}
                style={{
                  position: "absolute",
                  left: p.cx - Math.max(HIT, p.r * 2) / 2,
                  top: p.cy - Math.max(HIT, p.r * 2) / 2,
                  width: Math.max(HIT, p.r * 2),
                  height: Math.max(HIT, p.r * 2),
                  borderRadius: Math.max(HIT, p.r * 2) / 2,
                }}
              />
            ))}
            {at && (
              <ChartTooltip
                x={at.cx}
                y={at.cy - at.r}
                containerWidth={width}
                title={data[at.i].label ?? writeX(data[at.i].x)}
                rows={[
                  {
                    color: at.color,
                    name:
                      data[at.i].label !== undefined
                        ? writeX(data[at.i].x)
                        : series[at.g].label,
                    value: format(data[at.i].y),
                  },
                ]}
                testID={testID ? `${testID}-tooltip` : undefined}
              />
            )}
          </>
        );
      }}
    </ChartFrame>
  );
  return legend ? (
    <View>
      {frame}
      <ChartLegend
        items={series.map((s, i) => ({
          key: s.key,
          label: s.label ?? s.key,
          color: allColors[i],
        }))}
        hidden={hidden}
        onToggle={(key) =>
          setHidden((h) =>
            h.includes(key) ? h.filter((k) => k !== key) : [...h, key],
          )
        }
        testID={testID ? `${testID}-legend` : undefined}
      />
    </View>
  ) : (
    frame
  );
};

export default ScatterChart;
export { ScatterChart };
