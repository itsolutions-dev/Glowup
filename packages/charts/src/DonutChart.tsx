import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import { ChartFrame } from "./ChartFrame";
import { ChartTooltip } from "./ChartTooltip";
import { arcPath, donutSlices, sliceAt } from "./core/paths";
import { usePartsBase, type PartsCommonProps } from "./hooks/usePartsBase";

export type DonutChartProps = PartsCommonProps & {
  height?: number;
  /** Width of the ring in pixels. Default about a third of the radius. */
  thickness?: number;
  /** The big text in the middle; while a part is active it shows that part's value. */
  centerValue?: string;
  /** The small text under it; while a part is active it shows that part's label. */
  centerLabel?: string;
  /** Each part's share, written on its slice (only where the slice is wide enough). */
  showPercent?: boolean;
};

/** A slice grows by this much when it is active, and the chart leaves room for it. */
const GROW = 4;
const PAD_ANGLE = 0.01;
const CORNER = 4;

/**
 * A ring of parts of a whole, clockwise from the top. With a `total` bigger than
 * the parts it is a gauge: 30 of 100 fills 30% of the ring. A tap or a
 * pointer over a slice makes it active.
 */
const DonutChart = (props: DonutChartProps) => {
  const {
    data,
    total,
    height = 200,
    thickness,
    centerValue,
    centerLabel,
    showPercent = false,
    loading,
    emptyLabel = "No data",
    testID,
  } = props;
  const {
    theme,
    partColors,
    format,
    percent,
    nameOf,
    summary,
    active,
    setHovered,
    toggle,
  } = usePartsBase(props);
  const positive = useMemo(
    () => data.filter((d) => Number.isFinite(d.value) && d.value > 0),
    [data],
  );
  // A gauge at zero has no slice but still shows its ring and its centre.
  const empty = positive.length === 0 && total === undefined;

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
        const outer = Math.max(0, Math.min(width, height) / 2 - GROW);
        const ring = Math.min(outer, thickness ?? Math.max(8, outer * 0.36));
        const inner = Math.max(0, outer - ring);
        const cx = width / 2;
        const cy = height / 2;
        const slices = donutSlices(
          data.map((d) => ({ id: d.id, value: d.value })),
          {
            innerRadius: inner,
            outerRadius: outer,
            padAngle: PAD_ANGLE,
            cornerRadius: CORNER,
            total,
          },
        );
        const sum = positive.reduce((s, d) => s + d.value, 0);
        const showTrack = total !== undefined && total > sum;
        const activePart = data.find((d) => d.id === active);
        const color = (id: string) =>
          partColors[data.findIndex((d) => d.id === id)];
        const idAt = (x?: number, y?: number) => {
          if (x === undefined || y === undefined) return null;
          const i = sliceAt(slices, x - cx, y - cy, inner, outer + GROW);
          return i === null ? null : slices[i].id;
        };
        const valueSize = Math.max(12, Math.min(28, inner * 0.42));
        const labelSize = Math.max(10, Math.min(14, inner * 0.2));
        const fontFamily = theme.typography.labelSmall.fontFamily;
        // A pie has no hole to write in: its active slice gets a tooltip instead.
        const hasHole = inner > 0;
        const centerTop = !hasHole
          ? undefined
          : activePart
            ? format(activePart.value)
            : centerValue;
        const centerBottom = !hasHole
          ? undefined
          : activePart
            ? nameOf(activePart)
            : centerLabel;
        const activeSlice = slices.find((s) => s.id === active);
        const locate = (e: {
          nativeEvent: {
            locationX?: number;
            locationY?: number;
            offsetX?: number;
            offsetY?: number;
          };
        }) => {
          const n = e.nativeEvent;
          return idAt(n.locationX ?? n.offsetX, n.locationY ?? n.offsetY);
        };

        return (
          <>
            <Svg
              width={width}
              height={height}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <G x={cx} y={cy}>
                {showTrack && (
                  <Path
                    testID={testID ? `${testID}-track` : undefined}
                    d={arcPath(
                      { startAngle: 0, endAngle: 2 * Math.PI },
                      inner,
                      outer,
                    )}
                    fill={theme.colors.surfaceVariant}
                  />
                )}
                {slices.map((s) => {
                  const isActive = s.id === active;
                  return (
                    <Path
                      key={s.id}
                      testID={testID ? `${testID}-slice-${s.id}` : undefined}
                      d={
                        isActive
                          ? arcPath(s, inner, outer + GROW, CORNER)
                          : s.path
                      }
                      fill={color(s.id)}
                      opacity={active === null || isActive ? 1 : 0.45}
                    />
                  );
                })}
                {showPercent &&
                  slices
                    .filter((s) => s.fraction >= 0.06 && ring >= 18)
                    .map((s) => (
                      <SvgText
                        key={`p${s.id}`}
                        x={s.centroid[0]}
                        y={s.centroid[1] + labelSize / 3}
                        fontSize={labelSize}
                        fontFamily={fontFamily}
                        fill={theme.colors.surface}
                        textAnchor="middle"
                      >
                        {percent(s.fraction)}
                      </SvgText>
                    ))}
                {centerTop !== undefined && (
                  <SvgText
                    x={0}
                    y={centerBottom ? -2 : valueSize / 3}
                    fontSize={valueSize}
                    fontFamily={fontFamily}
                    fontWeight="700"
                    fill={
                      activePart ? color(activePart.id) : theme.colors.onSurface
                    }
                    textAnchor="middle"
                  >
                    {centerTop}
                  </SvgText>
                )}
                {centerBottom !== undefined && (
                  <SvgText
                    x={0}
                    y={
                      labelSize + (centerTop !== undefined ? 2 : -labelSize / 2)
                    }
                    fontSize={labelSize}
                    fontFamily={fontFamily}
                    fill={theme.colors.onSurfaceVariant}
                    textAnchor="middle"
                  >
                    {centerBottom}
                  </SvgText>
                )}
              </G>
            </Svg>
            {!hasHole && activePart && activeSlice && (
              <ChartTooltip
                x={cx + activeSlice.centroid[0]}
                y={cy + activeSlice.centroid[1]}
                containerWidth={width}
                title={nameOf(activePart)}
                rows={[
                  {
                    color: color(activePart.id),
                    value: `${format(activePart.value)} (${percent(activeSlice.fraction)})`,
                  },
                ]}
                testID={testID ? `${testID}-tooltip` : undefined}
              />
            )}
            <Pressable
              testID={testID ? `${testID}-hit` : undefined}
              accessible={false}
              style={StyleSheet.absoluteFill}
              onPress={(e) => {
                const id = locate(e);
                if (id !== null) toggle(id);
              }}
              onPointerMove={(e) => setHovered(locate(e))}
              onPointerLeave={() => setHovered(null)}
            />
          </>
        );
      }}
    </ChartFrame>
  );
};

/** `DonutChart` with no hole. */
const PieChart = (props: Omit<DonutChartProps, "thickness">) => (
  <DonutChart {...props} thickness={Number.POSITIVE_INFINITY} />
);

export default DonutChart;
export { DonutChart, PieChart };
