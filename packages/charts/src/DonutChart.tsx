import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { G, Line, Path, Text as SvgText } from "react-native-svg";
import { ChartFrame } from "./ChartFrame";
import { ChartTooltip } from "./ChartTooltip";
import { readableOn } from "./core/palette";
import {
  arcPath,
  donutSlices,
  sliceAt,
  spreadAngles,
  textFitsSlice,
} from "./core/paths";
import { labelWidth } from "./ChartAxes";
import { usePartsBase, type PartsCommonProps } from "./hooks/usePartsBase";

export type DonutChartProps = PartsCommonProps & {
  height?: number;
  /** Width of the ring in pixels. Default about a third of the radius. */
  thickness?: number;
  /**
   * The big text in the middle; while a part is active it shows that part's value. A function gets the sum of the parts still
   * shown (the legend can switch some off), for a total that follows them.
   */
  centerValue?: string | ((shownTotal: number) => string);
  /** The small text under it; while a part is active it shows that part's label. */
  centerLabel?: string;
  /** Each part's share: on its slice where the text fits, else outside the ring on a short line, however small the part. */
  showPercent?: boolean;
};

/** A slice grows by this much when it is active, and the chart leaves room for it. */
const GROW = 4;
/** From the ring to a label written outside it. */
const LEADER = 12;
const PAD_ANGLE = 0.01;
const CORNER = 4;

/**
 * A ring of parts of a whole, clockwise from the top. With a `total` bigger than
 * the parts it is a gauge: 30 of 100 fills 30% of the ring. A tap or a
 * pointer over a slice makes it active.
 */
const DonutChart = (props: DonutChartProps) => {
  const {
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
  const positive = visible.filter(
    (d) => Number.isFinite(d.value) && d.value > 0,
  );
  // A gauge at zero has no slice but still shows its ring and its centre.
  const empty = positive.length === 0 && total === undefined;
  const sum = positive.reduce((s, d) => s + d.value, 0);

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
        const labelSize = Math.max(
          10,
          Math.min(14, (Math.min(width, height) / 2) * 0.2),
        );
        const room = Math.max(0, Math.min(width, height) / 2 - GROW);
        const cx = width / 2;
        const cy = height / 2;
        const geometry = (outerRadius: number) => {
          const ringWidth = Math.min(
            outerRadius,
            thickness ?? Math.max(8, outerRadius * 0.36),
          );
          const innerRadius = Math.max(0, outerRadius - ringWidth);
          return {
            outer: outerRadius,
            inner: innerRadius,
            slices: donutSlices(
              visible.map((d) => ({ id: d.id, value: d.value })),
              {
                innerRadius,
                outerRadius,
                padAngle: PAD_ANGLE,
                cornerRadius: CORNER,
                total,
              },
            ),
          };
        };
        // A share goes on its slice when the text fits there, else outside the ring on a short line. The ring
        // leaves room for the outside ones, which makes it thinner, so what fits is asked again until no
        // more slices move out.
        const reserve = (ids: Set<string>, g: ReturnType<typeof geometry>) =>
          ids.size === 0
            ? room
            : Math.max(
                0,
                Math.min(
                  width / 2 -
                    Math.max(
                      ...g.slices
                        .filter((s) => ids.has(s.id))
                        .map((s) => labelWidth(percent(s.fraction), labelSize)),
                    ) -
                    2,
                  height / 2 - labelSize / 2 - 2,
                ) -
                  GROW -
                  LEADER,
              );
        let outsideIds = new Set<string>();
        let g = geometry(room);
        for (let pass = 0; showPercent && pass < 4; pass++) {
          const next = new Set(outsideIds);
          for (const s of g.slices) {
            const text = percent(s.fraction);
            if (
              !textFitsSlice(
                s,
                g.inner,
                g.outer,
                labelWidth(text, labelSize),
                labelSize,
              )
            )
              next.add(s.id);
          }
          if (next.size === outsideIds.size) break;
          outsideIds = next;
          g = geometry(reserve(outsideIds, g));
        }
        const { outer, inner, slices } = g;
        const showTrack = total !== undefined && total > sum;
        const activePart = visible.find((d) => d.id === active);
        const color = colorOf;
        const idAt = (x?: number, y?: number) => {
          if (x === undefined || y === undefined) return null;
          const i = sliceAt(slices, x - cx, y - cy, inner, outer + GROW);
          return i === null ? null : slices[i].id;
        };
        // Where each outside label goes: its slice's middle angle, nudged so neighbours do not touch.
        const labelled = slices.filter((s) => outsideIds.has(s.id));
        const at = (angle: number, radius: number): [number, number] => [
          radius * Math.sin(angle),
          -radius * Math.cos(angle),
        ];
        const edge = outer + GROW;
        const angles = spreadAngles(
          labelled.map((s) => (s.startAngle + s.endAngle) / 2),
          (labelSize + 2) / (edge + LEADER),
        );
        const outsideLabels = labelled.map((s, i) => {
          const mid = (s.startAngle + s.endAngle) / 2;
          const side = Math.sin(angles[i]);
          return {
            id: s.id,
            fraction: s.fraction,
            from: at(mid, outer + 1),
            to: at(angles[i], edge + LEADER - 3),
            text: at(angles[i], edge + LEADER),
            anchor:
              side > 0.1
                ? ("start" as const)
                : side < -0.1
                  ? ("end" as const)
                  : ("middle" as const),
          };
        });
        const valueSize = Math.max(12, Math.min(28, inner * 0.42));
        const fontFamily = theme.typography.labelSmall.fontFamily;
        // A pie has no hole to write in: its active slice gets a tooltip instead.
        const hasHole = inner > 0;
        const centerTop = !hasHole
          ? undefined
          : activePart
            ? format(activePart.value)
            : typeof centerValue === "function"
              ? centerValue(sum)
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

        // The centre text shrinks (not below 9) to stay inside a small hole.
        const fitText = (text: string | undefined, size: number) =>
          Math.max(
            9,
            Math.min(
              size,
              (inner * 1.7) / Math.max(1, (text?.length ?? 0) * 0.6),
            ),
          );
        const topSize = fitText(centerTop, valueSize);
        const bottomSize = fitText(centerBottom, labelSize);

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
                    .filter((s) => !outsideIds.has(s.id))
                    .map((s) => (
                      <SvgText
                        key={`p${s.id}`}
                        x={s.centroid[0]}
                        y={s.centroid[1] + labelSize / 3}
                        fontSize={labelSize}
                        fontFamily={fontFamily}
                        fill={readableOn(
                          color(s.id),
                          theme.colors.surface,
                          theme.colors.onSurface,
                        )}
                        textAnchor="middle"
                      >
                        {percent(s.fraction)}
                      </SvgText>
                    ))}
                {outsideLabels.map((l) => (
                  <G key={`o${l.id}`}>
                    <Line
                      x1={l.from[0]}
                      y1={l.from[1]}
                      x2={l.to[0]}
                      y2={l.to[1]}
                      stroke={theme.colors.outline}
                      strokeWidth={1}
                    />
                    <SvgText
                      x={l.text[0]}
                      y={l.text[1] + labelSize / 3}
                      fontSize={labelSize}
                      fontFamily={fontFamily}
                      fill={theme.colors.onSurface}
                      textAnchor={l.anchor}
                    >
                      {percent(l.fraction)}
                    </SvgText>
                  </G>
                ))}
                {centerTop !== undefined && (
                  <SvgText
                    x={0}
                    y={centerBottom ? -2 : topSize / 3}
                    fontSize={topSize}
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
                      bottomSize +
                      (centerTop !== undefined ? 2 : -bottomSize / 2)
                    }
                    fontSize={bottomSize}
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
  return belowNode ? (
    <View>
      {frame}
      {belowNode}
    </View>
  ) : (
    frame
  );
};

/** `DonutChart` with no hole. */
const PieChart = (props: Omit<DonutChartProps, "thickness">) => (
  <DonutChart {...props} thickness={Number.POSITIVE_INFINITY} />
);

export default DonutChart;
export { DonutChart, PieChart };
