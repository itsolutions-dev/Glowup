import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "@its/glowup-ui";
import { fitLabel, labelWidth } from "./ChartAxes";
import { ChartFrame } from "./ChartFrame";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip } from "./ChartTooltip";
import { resolveSeriesColors, themeSeriesColors } from "./core/palette";
import { formatMoment, timeScale, toTime, type TimeValue } from "./core/time";
import type { ChartSeries } from "./core/types";

/** An interval on a lane, from `start` to `end`; without `end` (or with `end` equal to `start`) a moment. */
export type TimelineItem = {
  id: string;
  /** The row it is drawn on. */
  lane: string;
  start: TimeValue;
  end?: TimeValue | null;
  /** Its name in the tooltip and the text for a screen reader; default the lane. */
  label?: string;
  /** The key of the series it belongs to, for its colour and the legend; without it, the first series. */
  series?: string;
  color?: string;
};

export type TimelineChartProps = {
  items: TimelineItem[];
  /** The lanes, top to bottom. Default: in the order the items name them. */
  lanes?: string[];
  /** What the items are, for their colours and the legend. Default: one kind. */
  series?: ChartSeries[];
  /** Height of one lane. Default 32; the chart is as tall as its lanes plus the time axis. */
  laneHeight?: number;
  /** Fixed ends of the time axis instead of the items'. */
  domain?: [TimeValue, TimeValue];
  /** A vertical marker at this moment (now, a deadline). */
  marker?: TimeValue;
  colors?: string[];
  /** A key under the chart; a tap on a series switches its items off. */
  legend?: boolean;
  title?: string;
  /** BCP 47 tag for the dates. Default "en-US". */
  locale?: string;
  /** Replaces the formatting of a moment in the tooltip. */
  formatTime?: (value: Date) => string;
  loading?: boolean;
  emptyLabel?: string;
  /** An item was tapped (its id) or the same one tapped again (null). */
  onSelect?: (id: string | null) => void;
  testID?: string;
};

const DEFAULT_SERIES: ChartSeries[] = [{ key: "" }];
const LABEL_MAX = 160;
const MIN_BAR = 4;

/**
 * Intervals of time on lanes, a Gantt in its simplest form: who was busy when, how long each step of a
 * process lasted. A moment (no end) is a dot on its lane. Each item is a button: a tap or a hover shows
 * its start and end.
 */
const TimelineChart = ({
  items,
  lanes,
  series = DEFAULT_SERIES,
  laneHeight = 32,
  domain,
  marker,
  colors,
  legend,
  title,
  locale = "en-US",
  formatTime,
  loading,
  emptyLabel = "No data",
  onSelect,
  testID,
}: TimelineChartProps) => {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const fontSize = theme.typography.labelMedium.fontSize ?? 12;
  const allColors = resolveSeriesColors(
    series,
    colors ?? themeSeriesColors(theme),
  );
  const groupOf = (item: TimelineItem) =>
    Math.max(
      0,
      series.findIndex((s) => s.key === (item.series ?? series[0].key)),
    );
  const moment = (v: TimeValue) =>
    formatTime ? formatTime(new Date(toTime(v) ?? 0)) : formatMoment(v, locale);
  const shown = items.filter(
    (item) =>
      toTime(item.start) !== null &&
      !hidden.includes(series[groupOf(item)].key),
  );
  const laneNames =
    lanes ?? [...new Set(items.map((item) => item.lane))].filter(Boolean);
  const height = laneNames.length * laneHeight + fontSize + 22;
  const active = hovered ?? selected;
  const toggle = (id: string) => {
    const next = selected === id ? null : id;
    setSelected(next);
    onSelect?.(next);
  };
  const span = (item: TimelineItem) => {
    const end = toTime(item.end);
    return end !== null && end !== toTime(item.start)
      ? `${moment(item.start)} – ${moment(end)}`
      : moment(item.start);
  };
  const summary = shown.length
    ? `${title ? `${title}: ` : ""}${shown
        .map((item) => `${item.label ?? item.lane}, ${span(item)}`)
        .join("; ")}`
    : emptyLabel;

  const frame = (
    <ChartFrame
      height={height}
      loading={loading}
      empty={shown.length === 0 || laneNames.length === 0}
      emptyLabel={emptyLabel}
      summary={summary}
      testID={testID}
    >
      {({ width }) => {
        const left =
          Math.min(
            LABEL_MAX,
            Math.ceil(
              Math.max(...laneNames.map((l) => labelWidth(l, fontSize))),
            ),
          ) + 16;
        const plotWidth = Math.max(0, width - left - 12);
        const plotHeight = laneNames.length * laneHeight;
        const x = timeScale({
          values: shown.flatMap((item) => [item.start, item.end ?? null]),
          range: [left, left + plotWidth],
          domain,
          tickCount: Math.max(2, Math.floor(plotWidth / 90)),
          locale,
        });
        const label = {
          fontSize,
          fontFamily: theme.typography.labelSmall.fontFamily,
          fill: theme.colors.onSurfaceVariant,
        };
        const bars = shown.map((item) => {
          const row = laneNames.indexOf(item.lane);
          const x0 = x.at(item.start);
          const end = toTime(item.end);
          const point = end === null || end === toTime(item.start);
          return {
            item,
            row,
            point,
            x0,
            w: point ? 0 : Math.max(MIN_BAR, x.at(end) - x0),
            color: item.color ?? allColors[groupOf(item)],
          };
        });
        const barHeight = Math.max(6, laneHeight * 0.55);
        const at = bars.find((b) => b.item.id === active && b.row >= 0);
        return (
          <>
            <Svg
              width={width}
              height={height}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              {laneNames.map((lane, i) => (
                <G key={lane}>
                  {i > 0 && (
                    <Line
                      x1={left}
                      x2={left + plotWidth}
                      y1={i * laneHeight}
                      y2={i * laneHeight}
                      stroke={theme.colors.outlineVariant}
                      strokeWidth={1}
                    />
                  )}
                  <SvgText
                    {...label}
                    x={left - 8}
                    y={i * laneHeight + laneHeight / 2 + fontSize / 3}
                    textAnchor="end"
                  >
                    {fitLabel(lane, fontSize, LABEL_MAX)}
                  </SvgText>
                </G>
              ))}
              {x.ticks.map((t, i) => (
                <G key={`t${i}`}>
                  <Line
                    x1={x.at(t)}
                    x2={x.at(t)}
                    y1={0}
                    y2={plotHeight}
                    stroke={theme.colors.outlineVariant}
                    strokeWidth={1}
                  />
                  <SvgText
                    {...label}
                    x={x.at(t)}
                    y={plotHeight + fontSize + 6}
                    textAnchor="middle"
                  >
                    {x.format(t)}
                  </SvgText>
                </G>
              ))}
              {bars.map((b) =>
                b.row < 0 ? null : b.point ? (
                  <Rect
                    key={b.item.id}
                    testID={
                      testID ? `${testID}-moment-${b.item.id}` : undefined
                    }
                    x={b.x0 - barHeight / 2}
                    y={b.row * laneHeight + (laneHeight - barHeight) / 2}
                    width={barHeight}
                    height={barHeight}
                    rx={barHeight / 2}
                    fill={b.color}
                    stroke={
                      active === b.item.id ? theme.colors.onSurface : "none"
                    }
                    strokeWidth={2}
                  />
                ) : (
                  <Rect
                    key={b.item.id}
                    testID={testID ? `${testID}-bar-${b.item.id}` : undefined}
                    x={b.x0}
                    y={b.row * laneHeight + (laneHeight - barHeight) / 2}
                    width={b.w}
                    height={barHeight}
                    rx={Math.min(theme.shape.small, barHeight / 2)}
                    fill={b.color}
                    fillOpacity={
                      active === null || active === b.item.id ? 1 : 0.5
                    }
                  />
                ),
              )}
              {marker !== undefined && toTime(marker) !== null && (
                <Line
                  testID={testID ? `${testID}-marker` : undefined}
                  x1={x.at(marker)}
                  x2={x.at(marker)}
                  y1={0}
                  y2={plotHeight}
                  stroke={theme.colors.error}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
              )}
            </Svg>
            {bars.map((b) =>
              b.row < 0 ? null : (
                <Pressable
                  key={b.item.id}
                  testID={testID ? `${testID}-item-${b.item.id}` : undefined}
                  accessible={false}
                  onPress={() => toggle(b.item.id)}
                  onHoverIn={() => setHovered(b.item.id)}
                  onHoverOut={() => setHovered(null)}
                  style={{
                    position: "absolute",
                    left: b.point ? b.x0 - laneHeight / 2 : b.x0,
                    width: b.point ? laneHeight : Math.max(b.w, MIN_BAR * 2),
                    top: b.row * laneHeight,
                    height: laneHeight,
                  }}
                />
              ),
            )}
            {at && (
              <ChartTooltip
                x={at.point ? at.x0 : at.x0 + at.w / 2}
                y={at.row * laneHeight + (laneHeight - barHeight) / 2}
                containerWidth={width}
                clampTop={false}
                title={at.item.label ?? at.item.lane}
                rows={[{ color: at.color, value: span(at.item) }]}
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

export default TimelineChart;
export { TimelineChart };
