import { Platform, type ViewStyle } from "react-native";

/**
 * A linear gradient as a style, from one colour to the other, left to right by
 * default (`angle` in degrees, as in CSS). iOS and Android draw it with React
 * Native's own background image, the web with CSS; the start colour is also the
 * background colour, which is what shows where no gradient can be drawn. The
 * brand gradient is `gradientStyle(theme.colors.primary, theme.colors.tertiary)`.
 */
export const gradientStyle = (
  from: string,
  to: string,
  angle = 90,
): ViewStyle => {
  const image = `linear-gradient(${angle}deg, ${from}, ${to})`;
  return Platform.OS === "web"
    ? ({ backgroundColor: from, backgroundImage: image } as ViewStyle)
    : { backgroundColor: from, experimental_backgroundImage: image };
};
