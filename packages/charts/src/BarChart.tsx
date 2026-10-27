import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
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
import { DENSE_BARS, DenseHit } from "./DenseHit";
import { aggregate } from "./core/aggregate";
import { Icon, type IconSource } from "@its/glowup-ui";
import {
  barColumns,
  columnSpans,
  columnTotal,
  type ColumnMode,
} from "./core/columns";
import { bandScale, valueScale } from "./core/scales";
import type { ChartNote } from "./core/summary";
import type { ChartDatum } from "./core/types";
import { num, useChartBase, type ChartCommonProps } from "./hooks/useChartBase";

/** An outcome mark for a category: an icon (a MaterialCommunityIcons name, or any source `Icon` takes), its colour, and what it says. */
export type BarMarker = { icon: IconSource; color: string; label: string };

/** Size of an outcome mark, in dp. */
const MARKER = 20;

export type BarChartProps = ChartCommonProps & {
  /** Pile the series up in one bar per category instead of side by side. Wins over the series' `column`. */
  stacked?: boolean;
  /**
   * How the series of a column (series with the same `column`) share its bar: `"stack"` piles them up, `"overlap"` starts each
   * from zero with the longest behind. One mode for every column, or one per column id. Default `"stack"`.
   */
  columnMode?: ColumnMode | Record<string, ColumnMode>;
  /** Bars run left to right, one row per category (long labels read better). */
  horizontal?: boolean;
  /**
   * A number: a reference line across the chart at that value. A function: a short line across each category at the value it
   * returns for that category (none for null), also in the tooltip, the table and the text for a screen reader; not drawn when dense.
   */
  target?:
    number | ((datum: ChartDatum, index: number) => number | null | undefined);
  /**
   * An outcome icon past the longest bar of a category, or null for none. `totals` has one entry per column of all the series, shown or not (its `column`
   * id, the series key for a series without one, `"all"` when `stacked`): the sum when stacked, the highest when overlapping.
   * `label` is read in the tooltip, the table and the text for a screen reader. Not drawn when dense.
   */
  marker?: (
    datum: ChartDatum,
    info: {
      index: number;
      totals: Record<string, number>;
      target: number | null;
    },
  ) => BarMarker | null;
  /** Categories drawn in the theme's outline colour, faded (below a minimum, say); their values still read as they are. Not when dense. */
  dimmed?: (datum: ChartDatum, index: number) => boolean;
  /**
   * One path per series and one touch layer instead of a node and a Pressable per bar, for thousands of bars. A bar can no longer be
   * dimmed on its own: a band behind the active category marks it. Past about one bar per two pixels the bars are drawn as the mean of
   * the categories that share a column, with a faint peak behind each up to their highest (grouped bars only); the tooltip still reads
   * the exact category. Default: on from 400 bars.
   */
  dense?: boolean;
};

const BarChart = (props: BarChartProps) => {
  const {
    data,
    series,
    height = 240,
    stacked = false,
    columnMode,
    horizontal = false,
    target,
    dense,
    loading,
    emptyLabel = "No data",
    marker,
    dimmed,
    testID,
  } = props;
  // A number is one line across the chart; a function gives each category its own.
  const line = typeof target === "number" ? target : undefined;
  const targets = data.map((d, i) =>
    typeof target === "function" ? num(target(d, i)) : null,
  );
  // The bars of a category: one column per `column` id of the series still shown.
  const columnsOf = (shown: string[]) =>
    barColumns(
      shown.map((k) => ({
        key: k,
        column: series.find((s) => s.key === k)?.column,
      })),
      { stacked, columnMode },
    );
  // The totals come from every series, not the ones the legend left on: hiding a series is a view, not a verdict.
  const allColumns = columnsOf(series.map((s) => s.key));
  const markers = data.map((d, i) =>
    marker
      ? marker(d, {
          index: i,
          totals: Object.fromEntries(
            allColumns.map((c) => [c.id, columnTotal(d, c)]),
          ),
          target: targets[i],
        })
      : null,
  );
  const notes: ChartNote[] = [
    ...(typeof target === "function"
      ? [{ name: "Target", values: targets }]
      : []),
    ...(marker
      ? [{ name: "Status", values: markers.map((m) => m?.label) }]
      : []),
  ];
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
    belowNode,
  } = useChartBase(props, notes);
  const columns = columnsOf(keys);
  const colOf = keys.map((k) => columns.findIndex((c) => c.keys.includes(k)));
  const rowOf = keys.map((k, s) => columns[colOf[s]].keys.indexOf(k));
  const spans = columns.map((c) => columnSpans(data, c));
  // Span of one bar along the value axis, as [low, high] values.
  const spanOf = (i: number, s: number) => spans[colOf[s]][rowOf[s]][i];
  const lengthOf = (i: number, s: number) => {
    const span = spanOf(i, s);
    return span ? span[1] - span[0] : 0;
  };
  // Drawing order in a category: column by column, and in an overlapping column the longest first, so the shorter stay in front.
  // Drawing order: column by column, and in an overlapping column the longest first, so the shorter stay in front.
  const orderBy = (length: (s: number) => number) =>
    keys
      .map((_, s) => s)
      .sort(
        (a, b) =>
          colOf[a] - colOf[b] ||
          (columns[colOf[a]].mode === "overlap" ? length(b) - length(a) : 0),
      );
  const drawOrder = (i: number) => orderBy((s) => lengthOf(i, s));
  // A dense chart draws one path per series: the longest overall goes first.
  const denseOrder = orderBy((s) =>
    data.reduce((sum, d) => sum + Math.abs(num(d[keys[s]]) ?? 0), 0),
  );
  // Past a few hundred bars one native node per bar is too much: each
  // series is then a single path of rectangles, and the active category is
  // marked by a band behind the bars (no bar can be dimmed on its own).
  const isDense = dense ?? data.length * keys.length > DENSE_BARS;
  // What is drawn per category; dense charts leave it out.
  const drawnTargets = isDense ? [] : targets;
  const drawnMarkers = isDense ? [] : markers;
  const faded = data.map((d, i) => !isDense && !!dimmed?.(d, i));
  const markerRoom = drawnMarkers.some(Boolean) ? MARKER + 4 : 0;

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
        const values = spans.flatMap((c) =>
          c.flatMap((row) => row.flatMap((span) => span ?? [])),
        );
        const allValues = [
          ...values,
          ...(line != null ? [line] : []),
          ...drawnTargets.filter((t): t is number => t !== null),
        ];
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
          // Room for the outcome marks past the longest bar: above, or on the right of a horizontal chart.
          top: 12 + (horizontal ? 0 : markerRoom),
          width: Math.max(0, width - left - (horizontal ? 16 + markerRoom : 8)),
          height: Math.max(
            0,
            height - 12 - below - (horizontal ? 0 : markerRoom),
          ),
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
        const thickness = band.width / columns.length;
        const inset = columns.length === 1 ? 0 : 1;

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

        // Where one bar is, or null when it has no length (no value, or zero).
        const barRect = (i: number, s: number) => {
          const span = spanOf(i, s);
          if (!span) return null;
          const a = v.at(span[0]);
          const b = v.at(span[1]);
          const start = Math.min(a, b);
          const length = Math.abs(a - b);
          if (length <= 0) return null;
          const cross = crossStart(i) + colOf[s] * thickness + inset;
          const size = Math.max(0, thickness - 2 * inset);
          return horizontal
            ? { x: start, y: cross, width: length, height: size }
            : { x: cross, y: start, width: size, height: length };
        };

        const folded = isDense
          ? aggregate(
              data,
              keys,
              Math.floor(
                (horizontal ? plot.height : plot.width) / (2 * columns.length),
              ),
            )
          : null;
        // A faint peak up to the highest only where a series starts from zero: not inside a pile.
        const peaked = columns.map(
          (c) => c.mode === "overlap" || c.keys.length === 1,
        );
        const foldedSpans = folded
          ? columns.map((c) => columnSpans(folded.mean, c))
          : null;
        const peakSpans = folded
          ? columns.map((c, n) =>
              peaked[n]
                ? columnSpans(folded.max, { ...c, mode: "overlap" })
                : null,
            )
          : null;
        // The same bar as barRect, for a run of categories folded into one: the mean, or (peak) the highest.
        const foldedRect = (c: number, s: number, peak: boolean) => {
          if (!folded || !foldedSpans || !peakSpans) return null;
          const span = (peak ? peakSpans : foldedSpans)[colOf[s]]?.[rowOf[s]][
            c
          ];
          if (!span) return null;
          const a = v.at(span[0]);
          const b = v.at(span[1]);
          const start = Math.min(a, b);
          const length = Math.abs(a - b);
          if (length <= 0) return null;
          const run = folded.runs[c];
          const size = ((run.to - run.from) * band.step) / columns.length;
          const cross =
            crossStart(run.from) -
            (band.step - band.width) / 2 +
            colOf[s] * size;
          return horizontal
            ? { x: start, y: cross, width: length, height: size }
            : { x: cross, y: start, width: size, height: length };
        };
        const pathOf = (
          count: number,
          rectOf: (i: number) => ReturnType<typeof barRect>,
        ) => {
          let d = "";
          for (let i = 0; i < count; i++) {
            const r = rectOf(i);
            if (r) d += `M${r.x},${r.y}h${r.width}v${r.height}h${-r.width}Z`;
          }
          return d;
        };
        const bars = isDense
          ? denseOrder.map((s) => {
              const k = keys[s];
              const main = folded
                ? pathOf(folded.runs.length, (c) => foldedRect(c, s, false))
                : pathOf(data.length, (i) => barRect(i, s));
              const peak =
                folded && peaked[colOf[s]]
                  ? pathOf(folded.runs.length, (c) => foldedRect(c, s, true))
                  : "";
              return main === "" ? null : (
                <G key={k}>
                  {peak !== "" && (
                    <Path
                      testID={testID ? `${testID}-peak-${k}` : undefined}
                      d={peak}
                      fill={seriesColors[s]}
                      fillOpacity={0.3}
                    />
                  )}
                  <Path
                    testID={testID ? `${testID}-dense-${k}` : undefined}
                    d={main}
                    fill={seriesColors[s]}
                  />
                </G>
              );
            })
          : data.flatMap((_, i) =>
              drawOrder(i).map((s) => {
                const k = keys[s];
                const r = barRect(i, s);
                return r ? (
                  <Rect
                    key={`${i}-${k}`}
                    testID={testID ? `${testID}-bar-${i}-${k}` : undefined}
                    {...r}
                    rx={2}
                    fill={faded[i] ? theme.colors.outline : seriesColors[s]}
                    opacity={
                      (active === null || active === i ? 1 : 0.45) *
                      (faded[i] ? 0.5 : 1)
                    }
                  />
                ) : null;
              }),
            );
        const activeBand =
          isDense && active !== null && active < data.length ? (
            <Rect
              x={
                horizontal
                  ? plot.left
                  : crossStart(active) - (band.step - band.width) / 2
              }
              y={
                horizontal
                  ? crossStart(active) - (band.step - band.width) / 2
                  : plot.top
              }
              width={horizontal ? plot.width : band.step}
              height={horizontal ? band.step : plot.height}
              fill={theme.colors.surfaceVariant}
              opacity={0.6}
            />
          ) : null;

        // How far a category reaches along the value axis, in pixels: its longest bar, or its target line.
        const farOf = (i: number) => {
          const ends = keys
            .map((_, s) => v.at(spanOf(i, s)?.[1] ?? 0))
            .concat(v.at(0));
          const t = drawnTargets[i];
          if (t != null) ends.push(v.at(t));
          return horizontal ? Math.max(...ends) : Math.min(...ends);
        };

        const tooltip = (() => {
          if (active === null || active >= data.length) return null;
          const d = data[active];
          const rows: TooltipRow[] = keys.map((k, s) => ({
            color: seriesColors[s],
            name: names[s],
            value: format(num(d[k])),
          }));
          const t = targets[active];
          if (t !== null)
            rows.push({
              color: theme.colors.tertiary,
              name: "Target",
              value: format(t),
            });
          const m = markers[active];
          if (m) rows.push({ color: m.color, value: m.label });
          return (
            <ChartTooltip
              x={horizontal ? farOf(active) : crossMid(active)}
              y={horizontal ? crossStart(active) : farOf(active)}
              containerWidth={width}
              title={d.label}
              rows={rows}
              testID={testID ? `${testID}-tooltip` : undefined}
            />
          );
        })();

        const targetAt = line != null ? v.at(line) : 0;
        const targetFlips =
          line != null &&
          targetAt + 4 + labelWidth(format(line), fontSize) > width;
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
              <G>
                {activeBand}
                {bars}
              </G>
              {drawnTargets.map((t, i) => {
                if (t === null) return null;
                const at = v.at(t);
                const from = crossStart(i);
                const to = from + band.width;
                return (
                  <Line
                    key={i}
                    testID={testID ? `${testID}-target-${i}` : undefined}
                    x1={horizontal ? at : from}
                    x2={horizontal ? at : to}
                    y1={horizontal ? from : at}
                    y2={horizontal ? to : at}
                    stroke={theme.colors.tertiary}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                  />
                );
              })}
              {line != null && (
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
                      {format(line)}
                    </SvgText>
                  ) : (
                    <SvgText
                      {...textStyle}
                      x={plot.left + plot.width}
                      y={targetAt - 4}
                      textAnchor="end"
                    >
                      {format(line)}
                    </SvgText>
                  )}
                </G>
              )}
            </Svg>
            {isDense ? (
              <DenseHit
                testID={testID ? `${testID}-hit` : undefined}
                plot={plot}
                indexAt={(x, y) => {
                  const along = horizontal ? y : x;
                  const i = Math.floor(along / band.step);
                  return i < 0 || i >= data.length ? null : i;
                }}
                onPress={toggle}
                onHover={setHovered}
              />
            ) : (
              data.map((_, i) => {
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
              })
            )}
            {drawnMarkers.map((m, i) => {
              if (!m) return null;
              const far = farOf(i);
              // Never wider than its category: a chart with many categories would pile them up.
              const size = Math.min(MARKER, band.step);
              return (
                <View
                  key={`marker-${i}`}
                  testID={testID ? `${testID}-marker-${i}` : undefined}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    width: size,
                    height: size,
                    left: horizontal ? far + 4 : crossMid(i) - size / 2,
                    top: horizontal ? crossMid(i) - size / 2 : far - 4 - size,
                  }}
                >
                  <Icon source={m.icon} size={size} color={m.color} />
                </View>
              );
            })}
            {tooltip}
          </>
        );
      }}
    </ChartFrame>
  );
  return belowNode ? (
    <View>
      {frame}
      {belowNode}
    </View>
  ) : (
    frame
  );
};

export default BarChart;
export { BarChart };
