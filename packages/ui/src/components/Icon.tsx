import React, { useMemo } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  I18nManager,
  ImageStyle,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "./types";

/** Props handed to a render-function icon source. */
export interface IconRenderProps {
  size: number;
  color: string;
}

/**
 * Anything a component can accept where an icon is expected:
 * a MaterialCommunityIcons glyph name, a bitmap (`require(...)` / `{ uri }`),
 * a render function, or a ready-made element (an SVG, a custom glyph set).
 *
 * The union widens the kit beyond MaterialCommunityIcons without every call
 * site having to branch on the source type.
 */
export type IconSource =
  | MaterialCommunityIconsGlyphs
  | ImageSourcePropType
  | ((props: IconRenderProps) => React.ReactNode)
  | React.ReactElement;

export interface IconProps {
  source: IconSource;
  size?: number;
  color?: string;
  /** Mirror the glyph when the layout direction is RTL (arrows, chevrons). */
  flipForRTL?: boolean;
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

const isImageSource = (source: unknown): source is ImageSourcePropType =>
  typeof source === "number" ||
  (typeof source === "object" &&
    source !== null &&
    !React.isValidElement(source) &&
    ("uri" in (source as object) || Array.isArray(source)));

/**
 * Renders an icon from any supported source.
 *
 * ```tsx
 * <Icon source="camera" size={24} />
 * <Icon source={require("./logo.png")} size={24} />
 * <Icon source={({ size, color }) => <MySvg width={size} fill={color} />} />
 * ```
 */
const Icon = ({
  source,
  size = 24,
  color,
  flipForRTL = false,
  style,
  testID,
}: IconProps) => {
  const { theme } = useTheme();
  const tint = color ?? theme.colors.onSurface;

  const transform = useMemo(
    () => (flipForRTL && I18nManager.isRTL ? [{ scaleX: -1 }] : undefined),
    [flipForRTL],
  );

  if (typeof source === "function") {
    return <>{source({ size, color: tint })}</>;
  }

  if (React.isValidElement(source)) {
    return source;
  }

  if (isImageSource(source)) {
    return (
      <Image
        testID={testID}
        source={source}
        resizeMode="contain"
        style={[{ width: size, height: size, transform }, style]}
        // A tint only makes sense on a monochrome glyph; callers pass a
        // full-colour bitmap by leaving `color` unset.
        tintColor={color}
      />
    );
  }

  return (
    <Icons
      testID={testID}
      name={source}
      size={size}
      color={tint}
      style={[transform ? { transform } : null, style as StyleProp<ImageStyle>]}
    />
  );
};

export default Icon;
