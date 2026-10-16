import React, { useMemo } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";

export interface CaptionValueProps {
  /** The label: "Phone", "Due date". Text, or any node. */
  caption?: React.ReactNode;
  /** The value. Text and numbers are drawn in the theme's type; any other node as given. */
  value?: React.ReactNode;
  /** `"column"` stacks the caption over the value, `"row"` puts them side by side. */
  direction?: "column" | "row";
  /** Puts the value before the caption. */
  reverse?: boolean;
  /**
   * Drawn when `value` is empty (`null`, `undefined`, `""` or `false`; `0` is a
   * value). Defaults to an em dash.
   */
  fallback?: React.ReactNode;
  /** Draws no caption at all, instead of an empty line. */
  omitCaption?: boolean;
  /** Any colour; defaults to the variant-on-surface role. */
  captionColor?: string;
  /** Any colour; defaults to the on-surface role. */
  valueColor?: string;
  textAlign?: TextStyle["textAlign"];
  /** Space between the caption and the value. Defaults to 4. */
  gap?: number;
  /** Lines the value may use before it is cut with an ellipsis; `0` is no limit. Defaults to 1. */
  numberOfLines?: number;
  captionStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
  /** For width, flex, padding and the like. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const isText = (node: React.ReactNode): node is string | number =>
  typeof node === "string" || typeof node === "number";

const isEmpty = (node: React.ReactNode) =>
  node === null || node === undefined || node === "" || node === false;

/**
 * A caption and its value, stacked or in a row: the read-only pair a detail
 * screen is made of ("Phone  +39 06 1234"). An empty value shows `fallback`
 * instead of leaving a hole.
 *
 * ```tsx
 * <CaptionValue caption="Phone" value={contact.phone} />
 * <CaptionValue caption="Due" value="12 Oct" direction="row" valueColor={theme.colors.error} />
 * ```
 */
const CaptionValue = ({
  caption,
  value,
  direction = "column",
  reverse = false,
  fallback = "—",
  omitCaption = false,
  captionColor,
  valueColor,
  textAlign,
  gap = 4,
  numberOfLines = 1,
  captionStyle,
  valueStyle,
  style,
  testID,
}: CaptionValueProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const shown = isEmpty(value) ? fallback : value;
  const isRow = direction === "row";

  const captionNode =
    omitCaption || isEmpty(caption) ? null : isText(caption) ? (
      <Text
        style={[
          styles.caption,
          captionColor ? { color: captionColor } : null,
          { textAlign },
          captionStyle,
        ]}
        numberOfLines={1}
      >
        {caption}
      </Text>
    ) : (
      caption
    );

  const valueNode = isText(shown) ? (
    <Text
      style={[
        styles.value,
        valueColor ? { color: valueColor } : null,
        { textAlign },
        valueStyle,
      ]}
      numberOfLines={numberOfLines}
    >
      {shown}
    </Text>
  ) : (
    shown
  );

  // Read as one phrase when both parts are plain text.
  const label =
    isText(caption) && isText(shown) && !omitCaption
      ? `${caption}: ${shown}`
      : undefined;

  return (
    <View
      style={[
        {
          flexDirection: `${direction}${reverse ? "-reverse" : ""}` as
            "row" | "column" | "row-reverse" | "column-reverse",
          alignItems: isRow ? "center" : "stretch",
          gap,
        },
        style,
      ]}
      accessible={label ? true : undefined}
      accessibilityLabel={label}
      testID={testID}
    >
      {captionNode}
      {valueNode}
    </View>
  );
};

export default CaptionValue;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    caption: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
    },
    value: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
    },
  });
