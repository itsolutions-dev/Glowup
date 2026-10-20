import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import {
  ChartAxes,
  fitLabel,
  labelStride,
  labelWidth,
  type AxisMark,
  type Plot,
} from "./ChartAxes";
import { ChartFrame } from "./ChartFrame";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";
import { stackValues } from "./core/paths";
import { bandScale, valueScale } from "./core/scales";
import { num, useChartBase, type ChartCommonProps } from "./hooks/useChartBase";

export type BarChartProps = ChartCommonProps & {
  /** Pile the series up in one bar per category instead of side by side. */
  stacked?: boolean;
  /** Bars run left to right, one row per category (long labels read better). */
  horizontal?: boolean;
  /** A reference line at this value. */
  target?: number;
};

const BarChart = (props: BarChartProps) => {
  const {
    data,
    series,
    height = 240,
    stacked = false,
    horizontal = false,
    target,
    loading,
    emptyLabel = "No data",
    testID,
  } = props;
  const {
    theme,
    seriesColors,
    format,
    keys,
    names,
    labels,
    summary,
    fontSize,
    empty,
    active,
    setHovered,
    toggle,
  } = useChartBase(props);
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
        const values = stacks
          ? stacks.flatMap((s) => s.flatMap((p) => [p.start, p.end]))
          : data.flatMap((d) => keys.map((k) => num(d[k])));
        const allValues = target != null ? [...values, target] : values;
        const below = fontSize + 14;

        // Room for the labels on the left: the values of a vertical chart, the
        // categories of a horizontal one. The value scale is built twice because
        // its ticks (and so the label widths) do not depend on the pixel range.
        let categoryWidth = 0;
        let left: number;
        if (horizontal) {
          const cap = Math.floor(width * 0.4);
          categoryWidth = Math.min(
            cap,
            Math.ceil(Math.max(...labels.map((l) => labelWidth(l, fontSize)))),
          );
          left = categoryWidth + 12;
        } else {
          const rough = valueScale({ values: allValues, range: [1, 0] });
          left =
            Math.ceil(
              Math.max(
                ...rough.ticks.map((t) => labelWidth(format(t), fontSize)),
              ),
            ) + 12;
        }
        const plot: Plot = {
          left,
          top: 12,
          width: Math.max(0, width - left - (horizontal ? 16 : 8)),
          height: Math.max(0, height - 12 - below),
        };
        const v = valueScale({
          values: allValues,
          range: horizontal
            ? [plot.left, plot.left + plot.width]
            : [plot.top + plot.height, plot.top],
          tickCount: horizontal ? Math.max(2, Math.floor(plot.width / 70)) : 5,
        });
        const band = bandScale(
          data.length,
          horizontal ? [0, plot.height] : [0, plot.width],
        );
        const crossStart = (i: number) =>
          (horizontal ? plot.top : plot.left) + band.start(i);
        const crossMid = (i: number) => crossStart(i) + band.width / 2;
        const thickness = stacked ? band.width : band.width / keys.length;
        const inset = stacked || keys.length === 1 ? 0 : 1;

        const stride = horizontal
          ? Math.max(1, Math.ceil((fontSize + 6) / band.step))
          : labelStride(labels, fontSize, band.step);
        const categories: AxisMark[] = labels
          .map((label, i) => ({
            at: crossMid(i),
            label: horizontal
              ? fitLabel(label, fontSize, categoryWidth)
              : label,
          }))
          .filter((_, i) => i % stride === 0);

        // Span of one bar along the value axis, as [low, high] values.
        const spanOf = (i: number, s: number): [number, number] | null => {
          if (stacks) {
            const p = stacks[s][i];
            return [Math.min(p.start, p.end), Math.max(p.start, p.end)];
          }
          const x = num(data[i][keys[s]]);
          return x === null ? null : [Math.min(x, 0), Math.max(x, 0)];
        };

        const bars = data.flatMap((_, i) =>
          keys.map((k, s) => {
            const span = spanOf(i, s);
            if (!span) return null;
            const a = v.at(span[0]);
            const b = v.at(span[1]);
            const start = Math.min(a, b);
            const length = Math.abs(a - b);
            if (length <= 0) return null;
            const cross = crossStart(i) + (stacked ? 0 : s * thickness) + inset;
            const size = Math.max(0, thickness - 2 * inset);
            return (
              <Rect
                key={`${i}-${k}`}
                testID={testID ? `${testID}-bar-${i}-${k}` : undefined}
                x={horizontal ? start : cross}
                y={horizontal ? cross : start}
                width={horizontal ? length : size}
                height={horizontal ? size : length}
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
          const ends = keys
            .map((_, s) => spanOf(active, s))
            .map((span) => v.at(span ? span[1] : 0))
            .concat(v.at(0));
          return (
            <ChartTooltip
              x={horizontal ? Math.max(...ends) : crossMid(active)}
              y={horizontal ? crossStart(active) : Math.min(...ends)}
              containerWidth={width}
              title={d.label}
              rows={rows}
              testID={testID ? `${testID}-tooltip` : undefined}
            />
          );
        })();

        const targetAt = target != null ? v.at(target) : 0;
        const targetFlips =
          target != null &&
          targetAt + 4 + labelWidth(format(target), fontSize) > width;
        const textStyle = {
          fontSize,
          fontFamily: theme.typography.labelSmall.fontFamily,
          fill: theme.colors.tertiary,
        };

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
                horizontal={horizontal}
                fontSize={fontSize}
                categories={categories}
                valueTicks={v.ticks.map((t) => ({
                  at: v.at(t),
                  label: format(t),
                }))}
              />
              <G>{bars}</G>
              {target != null && (
                <G>
                  <Line
                    x1={horizontal ? targetAt : plot.left}
                    x2={horizontal ? targetAt : plot.left + plot.width}
                    y1={horizontal ? plot.top : targetAt}
                    y2={horizontal ? plot.top + plot.height : targetAt}
                    stroke={theme.colors.tertiary}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                  />
                  {horizontal ? (
                    <SvgText
                      {...textStyle}
                      // On the right edge of the chart the label goes to the line's left.
                      x={targetFlips ? targetAt - 4 : targetAt + 4}
                      y={plot.top + fontSize}
                      textAnchor={targetFlips ? "end" : "start"}
                    >
                      {format(target)}
                    </SvgText>
                  ) : (
                    <SvgText
                      {...textStyle}
                      x={plot.left + plot.width}
                      y={targetAt - 4}
                      textAnchor="end"
                    >
                      {format(target)}
                    </SvgText>
                  )}
                </G>
              )}
            </Svg>
            {data.map((_, i) => {
              const pad = (band.step - band.width) / 2;
              return (
                <Pressable
                  key={i}
                  testID={testID ? `${testID}-category-${i}` : undefined}
                  accessible={false}
                  onPress={() => toggle(i)}
                  onHoverIn={() => setHovered(i)}
                  onHoverOut={() => setHovered(null)}
                  style={
                    horizontal
                      ? {
                          position: "absolute",
                          left: 0,
                          width,
                          top: crossStart(i) - pad,
                          height: band.step,
                        }
                      : {
                          position: "absolute",
                          left: crossStart(i) - pad,
                          width: band.step,
                          top: plot.top,
                          height: plot.height,
                        }
                  }
                />
              );
            })}
            {tooltip}
          </>
        );
      }}
    </ChartFrame>
  );
};

export default BarChart;
export { BarChart };
