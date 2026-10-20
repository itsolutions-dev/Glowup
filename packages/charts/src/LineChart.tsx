import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { ChartAxes, labelStride, labelWidth, type Plot } from "./ChartAxes";
import { ChartFrame } from "./ChartFrame";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";
import { areaPath, linePath } from "./core/paths";
import { pointPositions, valueScale } from "./core/scales";
import type { CurveName } from "./core/types";
import { num, useChartBase, type ChartCommonProps } from "./hooks/useChartBase";

export type LineChartProps = ChartCommonProps & {
  /** Fill under each line (this is what `AreaChart` sets). */
  area?: boolean;
  /** How the line runs between points. Default "linear". */
  curve?: CurveName;
  /** A reference line at this value. */
  target?: number;
  /** Keep 0 on the value axis. Default true; a line that stays in a narrow band reads better without it. */
  zero?: boolean;
  /** A dot on every point. Default: up to 24 categories. */
  showDots?: boolean;
};

/** The room left and right of the first and last point, so their dots and labels are not cut. */
const INSET = 12;

/**
 * Lines over categories in order: the x axis is the position of the point (a
 * series of days, say), not a time scale, and a missing value leaves a gap.
 */
const LineChart = (props: LineChartProps) => {
  const {
    data,
    height = 240,
    area = false,
    curve = "linear",
    target,
    zero = true,
    showDots,
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
    legendNode,
  } = useChartBase(props);

  const frame = (
    <ChartFrame
      height={height}
      loading={loading}
      empty={empty}
      emptyLabel={emptyLabel}
      summary={summary}
      testID={testID}
    >
      {({ width }) => {
        const values = data.flatMap((d) => keys.map((k) => num(d[k])));
        const allValues = target != null ? [...values, target] : values;
        // Built twice: the ticks, and so the width of their labels, do not depend on the pixel range.
        const rough = valueScale({ values: allValues, range: [1, 0], zero });
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
          values: allValues,
          range: [plot.top + plot.height, plot.top],
          zero,
        });
        const xs = pointPositions(data.length, [
          plot.left + INSET,
          plot.left + plot.width - INSET,
        ]);
        const step = xs.length > 1 ? xs[1] - xs[0] : plot.width;
        const stride = labelStride(labels, fontSize, step);
        const categories = labels
          .map((label, i) => ({ at: xs[i], label }))
          .filter((_, i) => i % stride === 0);
        const baseline = v.at(v.domain[0] <= 0 ? 0 : v.domain[0]);

        const drawn = keys.map((k) => {
          const points = data.map((d, i) => {
            const x = num(d[k]);
            return { x: xs[i], y: x === null ? null : v.at(x) };
          });
          return {
            points,
            line: linePath(points, curve),
            fill: area ? areaPath(points, baseline, curve) : "",
          };
        });
        const dots = showDots ?? data.length <= 24;

        const tooltip = (() => {
          if (active === null || active >= data.length) return null;
          const d = data[active];
          const rows: TooltipRow[] = keys.map((k, s) => ({
            color: seriesColors[s],
            name: names[s],
            value: format(num(d[k])),
          }));
          const ys = drawn
            .map((s) => s.points[active].y)
            .filter((y): y is number => y !== null);
          return (
            <ChartTooltip
              x={xs[active]}
              y={ys.length ? Math.min(...ys) : baseline}
              containerWidth={width}
              title={d.label}
              rows={rows}
              testID={testID ? `${testID}-tooltip` : undefined}
            />
          );
        })();

        const targetAt = target != null ? v.at(target) : 0;
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
                categories={categories}
                valueTicks={v.ticks.map((t) => ({
                  at: v.at(t),
                  label: format(t),
                }))}
              />
              {target != null && (
                <G>
                  <Line
                    x1={plot.left}
                    x2={plot.left + plot.width}
                    y1={targetAt}
                    y2={targetAt}
                    stroke={theme.colors.tertiary}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                  />
                  <SvgText
                    x={plot.left + plot.width}
                    y={targetAt - 4}
                    fontSize={fontSize}
                    fontFamily={theme.typography.labelSmall.fontFamily}
                    fill={theme.colors.tertiary}
                    textAnchor="end"
                  >
                    {format(target)}
                  </SvgText>
                </G>
              )}
              {active !== null && active < data.length && (
                <Line
                  x1={xs[active]}
                  x2={xs[active]}
                  y1={plot.top}
                  y2={plot.top + plot.height}
                  stroke={theme.colors.outline}
                  strokeWidth={1}
                />
              )}
              {drawn.map((s, i) => (
                <G key={keys[i]}>
                  {s.fill !== "" && (
                    <Path
                      testID={testID ? `${testID}-area-${keys[i]}` : undefined}
                      d={s.fill}
                      fill={seriesColors[i]}
                      fillOpacity={0.16}
                    />
                  )}
                  {s.line !== "" && (
                    <Path
                      testID={testID ? `${testID}-line-${keys[i]}` : undefined}
                      d={s.line}
                      fill="none"
                      stroke={seriesColors[i]}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  )}
                  {s.points.map((p, j) =>
                    p.y !== null && (dots || active === j) ? (
                      <Circle
                        key={j}
                        testID={
                          testID ? `${testID}-dot-${j}-${keys[i]}` : undefined
                        }
                        cx={p.x}
                        cy={p.y}
                        r={active === j ? 5 : 3}
                        fill={seriesColors[i]}
                        stroke={active === j ? theme.colors.surface : "none"}
                        strokeWidth={active === j ? 2 : 0}
                      />
                    ) : null,
                  )}
                </G>
              ))}
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
                  left: xs[i] - (data.length > 1 ? step / 2 : plot.width / 2),
                  width: data.length > 1 ? step : plot.width,
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
  return legendNode ? (
    <View>
      {frame}
      {legendNode}
    </View>
  ) : (
    frame
  );
};

/** `LineChart` with the area under each line filled. */
const AreaChart = (props: Omit<LineChartProps, "area">) => (
  <LineChart {...props} area />
);

export default LineChart;
export { LineChart, AreaChart };
