import React from "react";
import { G, Line, Text as SvgText } from "react-native-svg";
import { useTheme } from "@its/glowup-ui";

export type Plot = { left: number; top: number; width: number; height: number };
export type YTick = { y: number; label: string };
export type XLabel = { x: number; label: string };

type ChartAxesProps = {
  plot: Plot;
  yTicks: YTick[];
  xLabels: XLabel[];
  fontSize: number;
};

/** Horizontal grid lines with the value labels on the left, and the category labels under the plot. */
export const ChartAxes = ({
  plot,
  yTicks,
  xLabels,
  fontSize,
}: ChartAxesProps) => {
  const { theme } = useTheme();
  const text = theme.colors.onSurfaceVariant;
  const fontFamily = theme.typography.labelSmall.fontFamily;
  return (
    <G>
      {yTicks.map((t, i) => (
        <G key={`y${i}`}>
          <Line
            x1={plot.left}
            x2={plot.left + plot.width}
            y1={t.y}
            y2={t.y}
            stroke={theme.colors.outlineVariant}
            strokeWidth={1}
          />
          <SvgText
            x={plot.left - 6}
            y={t.y + fontSize / 3}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fill={text}
            textAnchor="end"
          >
            {t.label}
          </SvgText>
        </G>
      ))}
      {xLabels.map((l, i) => (
        <SvgText
          key={`x${i}`}
          x={l.x}
          y={plot.top + plot.height + fontSize + 6}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fill={text}
          textAnchor="middle"
        >
          {l.label}
        </SvgText>
      ))}
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
