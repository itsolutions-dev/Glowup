import React, { useMemo } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

interface DividerProps {
  /**
   * Centred label, splitting the rule in two. Horizontal only — a vertical
   * divider is a bare rule.
   */
  children?: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  /** Margin at both ends of the line, along its own axis. */
  inset?: number;
  /** Line thickness, in pixels. */
  thickness?: number;
  style?: ViewStyle;
  /** Gap between the label and each half of the rule. No label, no gap. */
  contentSpacing?: number;
}

const Divider = ({
  orientation = "horizontal",
  inset = 0,
  thickness = 1,
  style,
  children,
  contentSpacing = 16,
}: DividerProps) => {
  const { theme } = useTheme();

  const styles = useMemo(() => makeStyles(contentSpacing), [contentSpacing]);

  const isHorizontal = orientation === "horizontal";
  // `contentSpacing` is the gap around the label, so with nothing to put in the
  // middle there is nothing to space: the rule stays one unbroken line instead
  // of opening a `contentSpacing * 2` hole in itself. Vertical never takes a
  // label at all.
  const label = isHorizontal ? children : undefined;
  const hasLabel =
    label !== undefined && label !== null && label !== false && label !== "";

  const line: ViewStyle = {
    backgroundColor: theme.colors.outlineVariant,
    ...(isHorizontal
      ? { height: thickness, marginHorizontal: inset }
      : { width: thickness, marginVertical: inset }),
  };

  if (!hasLabel) {
    // A bare rule sizes itself along the line and stretches across it. It must
    // not `flex: 1`: in the row a vertical divider lives in, growing is along
    // the *width*, and the hairline ate the whole row instead of separating
    // it. `alignSelf` is what makes it as tall as its neighbours.
    return <View style={[line, styles.bareRule, style]} />;
  }

  return (
    <View style={[styles.labelledRule, style]}>
      <View style={[line, styles.segment]} />
      {typeof label === "string" ? (
        <Text
          style={[
            theme.typography.labelMedium,
            styles.labelSpacing,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {label}
        </Text>
      ) : (
        <View style={styles.labelSpacing}>{label}</View>
      )}
      <View style={[line, styles.segment]} />
    </View>
  );
};

export default Divider;

// Styles
interface DividerStyleProps {
  bareRule: ViewStyle;
  labelledRule: ViewStyle;
  segment: ViewStyle;
  labelSpacing: ViewStyle;
}

const makeStyles: (
  contentSpacing: number,
) => StyleSheet.NamedStyles<DividerStyleProps> = (contentSpacing: number) =>
  StyleSheet.create({
    bareRule: {
      alignSelf: "stretch",
    },
    // No horizontal margin here: `contentSpacing` belongs to the label alone.
    // On the container it made the rule `contentSpacing * 2` wider than the box
    // it was asked to fill and pushed it off-centre by `contentSpacing` — on a
    // 360px stage the right-hand segment ran out past the edge.
    labelledRule: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
    },
    segment: {
      flex: 1,
    },
    labelSpacing: {
      marginHorizontal: contentSpacing,
    },
  });
