import React, { useId } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, G, Rect } from "react-native-svg";
import { ChartFrame } from "./ChartFrame";
import { ChartTooltip } from "./ChartTooltip";
import { usePartsBase, type PartsCommonProps } from "./hooks/usePartsBase";

export type StackedBarProps = PartsCommonProps & {
  /** Height of the bar in pixels. Default 32. */
  height?: number;
};

/** A single horizontal bar cut into the parts of a whole, each as wide as its share. */
const StackedBar = (props: StackedBarProps) => {
  const { total, height = 32, loading, emptyLabel = "No data", testID } = props;
  const {
    theme,
    visible,
    colorOf,
    belowNode,
    format,
    percent,
    nameOf,
    summary,
    active,
    setHovered,
    toggle,
  } = usePartsBase(props);
  const clipId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const positive = visible.filter(
    (d) => Number.isFinite(d.value) && d.value > 0,
  );
  const sum = positive.reduce((s, d) => s + d.value, 0);
  const whole = Math.max(total ?? sum, sum);
  const empty = whole <= 0;

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
        let at = 0;
        const segments = positive.map((d) => {
          const w = (d.value / whole) * width;
          const segment = { part: d, x: at, w };
          at += w;
          return segment;
        });
        const shown = segments.find((s) => s.part.id === active);
        const color = colorOf;
        return (
          <>
            <Svg
              width={width}
              height={height}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <Defs>
                <ClipPath id={clipId}>
                  <Rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    rx={Math.min(8, height / 2)}
                  />
                </ClipPath>
              </Defs>
              <G clipPath={`url(#${clipId})`}>
                <Rect
                  x={0}
                  y={0}
                  width={width}
                  height={height}
                  fill={theme.colors.surfaceVariant}
                />
                {segments.map((s) => (
                  <Rect
                    key={s.part.id}
                    testID={
                      testID ? `${testID}-segment-${s.part.id}` : undefined
                    }
                    x={s.x}
                    y={0}
                    width={s.w}
                    height={height}
                    fill={color(s.part.id)}
                    opacity={active === null || active === s.part.id ? 1 : 0.45}
                  />
                ))}
              </G>
            </Svg>
            {segments.map((s) => (
              <Pressable
                key={s.part.id}
                testID={testID ? `${testID}-hit-${s.part.id}` : undefined}
                accessible={false}
                onPress={() => toggle(s.part.id)}
                onHoverIn={() => setHovered(s.part.id)}
                onHoverOut={() => setHovered(null)}
                style={{
                  position: "absolute",
                  left: s.x,
                  width: s.w,
                  top: 0,
                  height,
                }}
              />
            ))}
            {shown && (
              <ChartTooltip
                x={shown.x + shown.w / 2}
                y={0}
                containerWidth={width}
                clampTop={false}
                title={nameOf(shown.part)}
                rows={[
                  {
                    color: color(shown.part.id),
                    value: `${format(shown.part.value)} (${percent(shown.part.value / whole)})`,
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
  return belowNode ? (
    <View>
      {frame}
      {belowNode}
    </View>
  ) : (
    frame
  );
};

export default StackedBar;
export { StackedBar };
