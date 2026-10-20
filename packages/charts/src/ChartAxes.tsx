import React from "react";
import { G, Line, Text as SvgText } from "react-native-svg";
import { useTheme } from "@its/glowup-ui";

export type Plot = { left: number; top: number; width: number; height: number };
/** A label at a position along one axis, in pixels of the chart. */
export type AxisMark = { at: number; label: string };

type ChartAxesProps = {
  plot: Plot;
  /** Values run left to right and the categories top to bottom, instead of the other way round. */
  horizontal?: boolean;
  /** Where the value labels and grid lines go. */
  valueTicks: AxisMark[];
  /** Where the category labels go. */
  categories: AxisMark[];
  fontSize: number;
};

/**
 * Grid lines with the value labels, and the category labels. Vertical charts have
 * horizontal grid lines, values on the left and categories under the plot; with
 * `horizontal` it is the other way round.
 */
export const ChartAxes = ({
  plot,
  horizontal = false,
  valueTicks,
  categories,
  fontSize,
}: ChartAxesProps) => {
  const { theme } = useTheme();
  const text = theme.colors.onSurfaceVariant;
  const fontFamily = theme.typography.labelSmall.fontFamily;
  const label = {
    fontSize,
    fontFamily,
    fill: text,
  };
  const bottom = plot.top + plot.height;
  return (
    <G>
      {valueTicks.map((t, i) => (
        <G key={`v${i}`}>
          {horizontal ? (
            <>
              <Line
                x1={t.at}
                x2={t.at}
                y1={plot.top}
                y2={bottom}
                stroke={theme.colors.outlineVariant}
                strokeWidth={1}
              />
              <SvgText
                {...label}
                x={t.at}
                y={bottom + fontSize + 6}
                textAnchor="middle"
              >
                {t.label}
              </SvgText>
            </>
          ) : (
            <>
              <Line
                x1={plot.left}
                x2={plot.left + plot.width}
                y1={t.at}
                y2={t.at}
                stroke={theme.colors.outlineVariant}
                strokeWidth={1}
              />
              <SvgText
                {...label}
                x={plot.left - 6}
                y={t.at + fontSize / 3}
                textAnchor="end"
              >
                {t.label}
              </SvgText>
            </>
          )}
        </G>
      ))}
      {categories.map((c, i) =>
        horizontal ? (
          <SvgText
            key={`c${i}`}
            {...label}
            x={plot.left - 6}
            y={c.at + fontSize / 3}
            textAnchor="end"
          >
            {c.label}
          </SvgText>
        ) : (
          <SvgText
            key={`c${i}`}
            {...label}
            x={c.at}
            y={bottom + fontSize + 6}
            textAnchor="middle"
          >
            {c.label}
          </SvgText>
        ),
      )}
    </G>
  );
};

/** Rough width of a label, to leave room for it: the real width needs a measure the SVG does not offer before drawing. */
export const labelWidth = (text: string, fontSize: number) =>
  text.length * fontSize * 0.6;

/** Every how-manyth label fits side by side in `step` pixels. */
export const labelStride = (
  labels: string[],
  fontSize: number,
  step: number,
) => {
  const widest = labels.reduce(
    (w, l) => Math.max(w, labelWidth(l, fontSize)),
    0,
  );
  return step > 0 ? Math.max(1, Math.ceil((widest + 8) / step)) : 1;
};

/** The label cut with an ellipsis to fit `maxWidth` (by the same rough width). */
export const fitLabel = (text: string, fontSize: number, maxWidth: number) => {
  const chars = Math.max(1, Math.floor(maxWidth / (fontSize * 0.6)));
  return text.length <= chars
    ? text
    : `${text.slice(0, Math.max(1, chars - 1))}…`;
};
