import Svg, { Path, Polygon } from "react-native-svg";
import { useTheme } from "@its/glowup-ui";
import MARK from "./brandMark.json";

const VIEWBOX = 100;

const point = (deg: number) => {
  const { cx, cy, r } = MARK.ring;
  const rad = (deg * Math.PI) / 180;
  return `${(cx + r * Math.cos(rad)) * VIEWBOX} ${(cy + r * Math.sin(rad)) * VIEWBOX}`;
};

// Clockwise on screen (sweep 1); the large-arc flag follows the span.
const ARCS = MARK.ring.arcs.map(([from, to]) => {
  const span = (to - from + 360) % 360;
  const r = MARK.ring.r * VIEWBOX;
  return `M ${point(from)} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${point(to)}`;
});

const BOLT = MARK.bolt
  .map(([x, y]) => `${x * VIEWBOX},${y * VIEWBOX}`)
  .join(" ");

type Props = { size: number };

/**
 * The header's copy of the app icon: the same bolt and ring, read from
 * brandMark.json like the PNGs, but flat — the neon glow needs the icon's dark
 * ground, and the header sits on a primaryContainer tile in either scheme.
 */
export const BrandMark = ({ size }: Props) => {
  const { theme } = useTheme();
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
      {ARCS.map((d) => (
        <Path
          key={d}
          d={d}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={MARK.ring.width * VIEWBOX}
          strokeLinecap="round"
        />
      ))}
      <Polygon points={BOLT} fill={theme.colors.onPrimaryContainer} />
    </Svg>
  );
};
