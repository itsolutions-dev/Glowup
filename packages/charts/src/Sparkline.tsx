import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "@its/glowup-ui";
import { ChartFrame } from "./ChartFrame";
import { makeValueFormatter } from "./core/format";
import { areaPath, linePath } from "./core/paths";
import { pointPositions, valueScale } from "./core/scales";
import type { CurveName } from "./core/types";

export type SparklineProps = {
  /** The values in order; a missing one (`null`) leaves a gap. */
  values: (number | null | undefined)[];
  /** Height in pixels. Default 32. The width is the box it sits in. */
  height?: number;
  /** Line colour. Default: the theme's `primary`. */
  color?: string;
  /** Fill under the line. */
  area?: boolean;
  curve?: CurveName;
  /** A dot on the last value. Default true. */
  lastDot?: boolean;
  /** BCP 47 tag for the numbers in the screen-reader text. Default "en-US". */
  locale?: string;
  /** What a screen reader says; default is the first, lowest, highest and last value. */
  accessibilityLabel?: string;
  testID?: string;
};

const PAD = 3;

const finite = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

/** A small line with no axes, for a tile or a table row: it shows the shape of a series, not its numbers. */
const Sparkline = ({
  values,
  height = 32,
  color,
  area = false,
  curve = "linear",
  lastDot = true,
  locale,
  accessibilityLabel,
  testID,
}: SparklineProps) => {
  const { theme } = useTheme();
  const stroke = color ?? theme.colors.primary;
  const known = values.filter(finite);
  const format = makeValueFormatter({ locale });
  const label =
    accessibilityLabel ??
    (known.length
      ? `Trend of ${known.length} values: first ${format(known[0])}, lowest ${format(Math.min(...known))}, highest ${format(Math.max(...known))}, last ${format(known[known.length - 1])}.`
      : "No data");

  return (
    <ChartFrame
      height={height}
      empty={known.length === 0}
      emptyLabel="No data"
      summary={label}
      testID={testID}
    >
      {({ width }) => {
        const v = valueScale({
          values,
          range: [height - PAD, PAD],
          zero: false,
        });
        const xs = pointPositions(values.length, [PAD, width - PAD]);
        const points = values.map((x, i) => ({
          x: xs[i],
          y: finite(x) ? v.at(x) : null,
        }));
        const line = linePath(points, curve);
        const last = [...points].reverse().find((p) => p.y !== null);
        return (
          <Svg
            width={width}
            height={height}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <G>
              {area && (
                <Path
                  testID={testID ? `${testID}-area` : undefined}
                  d={areaPath(points, height - PAD, curve)}
                  fill={stroke}
                  fillOpacity={0.16}
                />
              )}
              {line !== "" && (
                <Path
                  testID={testID ? `${testID}-line` : undefined}
                  d={line}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {lastDot && last && (
                <Circle
                  testID={testID ? `${testID}-last` : undefined}
                  cx={last.x}
                  cy={last.y as number}
                  r={3}
                  fill={stroke}
                />
              )}
            </G>
          </Svg>
        );
      }}
    </ChartFrame>
  );
};

export default Sparkline;
export { Sparkline };
