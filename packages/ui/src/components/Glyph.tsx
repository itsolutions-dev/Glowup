import React from "react";
import type { ComponentProps } from "react";
import Svg, { Path } from "react-native-svg";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "../providers/ThemeProvider";
import { EVA_FOR_MDI, EVA_PATHS } from "../providers/evaIcons";

const HIDDEN = {
  accessible: false,
  importantForAccessibility: "no-hide-descendants",
  accessibilityElementsHidden: true,
  "aria-hidden": true,
} as const;

/**
 * The library's icon glyph: a MaterialCommunityIcons glyph, unless the active
 * palette asks for the Eva set (`palette.iconSet === "eva"`) and has an Eva
 * equivalent for the name — then that is drawn instead. Everything else, names
 * Eva has no match for included, keeps its Material glyph, so switching palette
 * never leaves a hole where an icon was.
 *
 * Same props as MaterialCommunityIcons, so components keep passing Material
 * names whatever the palette.
 */
const Glyph = (props: ComponentProps<typeof MaterialCommunityIcons>) => {
  const { palette } = useTheme();
  const eva =
    palette.iconSet === "eva"
      ? EVA_PATHS[EVA_FOR_MDI[props.name as string]]
      : undefined;

  // An icon is decoration, named by the control around it. A glyph is a
  // character of the icon font, and a pressable row is named by the text
  // inside it, so TalkBack read "󰈦, Roadmap 2027.pdf" with a box for the icon.
  // Hidden from every screen reader, unless the caller names the icon itself.
  const hidden = props.accessibilityLabel ? null : HIDDEN;

  if (!eva) return <MaterialCommunityIcons {...hidden} {...props} />;

  const { size = 12, color = "black", style, testID } = props;
  return (
    <Svg
      {...hidden}
      testID={testID}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style as never}
    >
      <Path d={eva} fill={color as string} />
    </Svg>
  );
};

export default Glyph;
