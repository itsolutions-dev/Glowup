import React, { useMemo } from "react";
import {
  DimensionValue,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import Clipboard, {
  isClipboardAvailable,
  type ClipboardWriter,
} from "./Clipboard";
import Tooltip from "./Tooltip";
import { resolveColor, type ThemeColor } from "./internal/themeColor";

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
   * value). Defaults to `"N/A"`.
   */
  fallback?: React.ReactNode;
  /** Draws no caption at all, instead of an empty line. */
  omitCaption?: boolean;
  /**
   * A theme colour token (`"primary"`, `"onSurfaceVariant"`, ...) or any colour
   * string. Defaults to `onSurfaceVariant`.
   */
  captionColor?: ThemeColor;
  /**
   * A theme colour token (`"primary"`, `"error"`, ...) or any colour string.
   * Defaults to `onSurface`.
   */
  valueColor?: ThemeColor;
  textAlign?: TextStyle["textAlign"];
  /** Space between the caption and the value, in px. Defaults to 4. */
  gap?: number;
  /** Lines the value may use before it is cut with an ellipsis; `0` is no limit. Defaults to 1. */
  numberOfLines?: number;
  /** Width of the pair. */
  width?: DimensionValue;
  /** Height of the pair. */
  height?: DimensionValue;
  /** Flex of the pair in its parent. */
  flex?: number;
  /** Padding around the pair, in px. */
  padding?: number;
  /**
   * Shows a small copy button (a `Clipboard`) after the value, for a text or
   * number value (a node has nothing to copy). On web it writes the value to
   * the clipboard (`navigator.clipboard`); the library has no clipboard
   * dependency, so on native the button is shown only with a `copy` writer or
   * an `onCopy` that does the copying. The button's icon changes to a check
   * for a moment, and "Copied" is announced, once the value is copied.
   */
  enableCopy?: boolean;
  /**
   * Called with the value as text after it was copied. Without a `copy`
   * writer it is, on native, where the app copies it; on web it is called
   * after the clipboard write succeeded.
   */
  onCopy?: (value: string) => void;
  /**
   * Writes the copied text: `expo-clipboard`'s `setStringAsync` on native, or
   * your own on web. On web it defaults to `navigator.clipboard.writeText`.
   */
  copy?: ClipboardWriter;
  /**
   * Wraps a text or number value in a `Tooltip` with the value as its content:
   * the value in full, for when `numberOfLines` cuts it.
   */
  showTooltip?: boolean;
  captionStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
  /** For anything the props above do not cover. */
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
 * <CaptionValue caption="Phone" value={contact.phone} enableCopy onCopy={copy} />
 * <CaptionValue caption="Due" value="12 Oct" direction="row" valueColor="error" />
 * ```
 */
const CaptionValue = ({
  caption,
  value,
  direction = "column",
  reverse = false,
  fallback = "N/A",
  omitCaption = false,
  captionColor,
  valueColor,
  textAlign,
  gap = 4,
  numberOfLines = 1,
  width,
  height,
  flex,
  padding,
  enableCopy = false,
  onCopy,
  copy,
  showTooltip = false,
  captionStyle,
  valueStyle,
  style,
  testID,
}: CaptionValueProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const empty = isEmpty(value);
  const shown = empty ? fallback : value;
  const isRow = direction === "row";
  const resolvedCaption = resolveColor(theme, captionColor);
  const resolvedValue = resolveColor(theme, valueColor);

  // Only a real text or number value can be copied, and on native only when
  // the app says how.
  const canCopy =
    enableCopy && !empty && isText(value) && isClipboardAvailable(copy, onCopy);

  const captionNode =
    omitCaption || isEmpty(caption) ? null : isText(caption) ? (
      <Text
        style={[
          styles.caption,
          resolvedCaption ? { color: resolvedCaption } : null,
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

  let valueNode: React.ReactNode = isText(shown) ? (
    <Text
      style={[
        styles.value,
        resolvedValue ? { color: resolvedValue } : null,
        { textAlign },
        canCopy && styles.valueShrinks,
        valueStyle,
      ]}
      numberOfLines={numberOfLines}
    >
      {shown}
    </Text>
  ) : (
    shown
  );

  if (showTooltip && !empty && isText(value)) {
    valueNode = (
      <Tooltip content={String(value)} position="top" anchorAccessible={false}>
        {valueNode}
      </Tooltip>
    );
  }

  if (canCopy) {
    valueNode = (
      <View style={styles.valueRow}>
        {valueNode}
        <Clipboard
          value={String(value)}
          size="small"
          onCopy={onCopy}
          copy={copy}
        />
      </View>
    );
  }

  // Read as one phrase when both parts are plain text. Not with a copy button:
  // grouped, the button would be out of reach on native.
  const label =
    isText(caption) && isText(shown) && !omitCaption && !canCopy
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
          width,
          height,
          flex,
          padding,
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
    valueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
    },
    // In the row with the copy button the text gives way to it.
    valueShrinks: { flexShrink: 1 },
  });
