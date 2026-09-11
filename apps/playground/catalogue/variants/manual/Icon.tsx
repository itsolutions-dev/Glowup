import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Icon, Paper, Typography } from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo } from "./shared";

// Hand-written rather than generated: the authored preview draws its custom
// sources as browser `<svg>` elements, and react-native-svg's equivalents are
// components, not intrinsics — there is nothing for the rewriter to map them to.

const GLYPHS = [
  "camera",
  "bell-outline",
  "cog-outline",
  "heart-outline",
  "map-marker-outline",
] as const;

const SIZES = [16, 20, 24, 32, 48];

const Glyphs = () => (
  <View style={demo.row}>
    {GLYPHS.map((name) => (
      <View key={name} style={demo.cell}>
        <Icon source={name} size={28} />
        <Typography variant="labelSmall">{name}</Typography>
      </View>
    ))}
  </View>
);

const Sizes = () => (
  <View style={demo.row}>
    {SIZES.map((size) => (
      <View key={size} style={demo.cell}>
        <Icon source="wrench-outline" size={size} />
        <Typography variant="labelSmall">{`${size}px`}</Typography>
      </View>
    ))}
  </View>
);

const CustomSources = () => (
  <View style={demo.panel}>
    <Typography variant="labelMedium">
      A render function receives the resolved size and colour
    </Typography>
    <Paper elevation={1} outline>
      <View style={demo.row}>
        <Icon
          size={32}
          source={({ size, color }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
              <Path d="M12 2 3 20h18L12 2Zm0 5 5.5 11h-11L12 7Z" />
            </Svg>
          )}
        />
        <Icon
          size={32}
          source={({ size, color }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
              <Circle cx="12" cy="12" r="9" />
            </Svg>
          )}
        />
        <Typography variant="bodySmall">SVG source, themed colour</Typography>
      </View>
    </Paper>
  </View>
);

export const variants: Variant[] = [
  { name: "Glyphs", title: "Glyphs", render: Glyphs },
  { name: "Sizes", title: "Sizes", render: Sizes },
  {
    name: "CustomSources",
    title: "Custom sources",
    description:
      "The point of the primitive: the source does not have to be a glyph name. A render function gets the resolved size and colour and can draw anything.",
    render: CustomSources,
  },
];
