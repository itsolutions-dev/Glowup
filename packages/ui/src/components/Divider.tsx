import React, { useMemo } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

interface DividerProps {
  children?: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  inset?: number;
  thickness?: number;
  style?: ViewStyle;
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

  const Component =
    typeof children === "string" ? (
      <Text
        style={[
          theme.typography.labelMedium,
          styles.componentSpacing,
          {
            color: theme.colors.onSurfaceVariant,
          },
        ]}
      >
        {children}
      </Text>
    ) : (
      <View style={styles.componentSpacing}>{children}</View>
    );

  const isHorizontal = orientation === "horizontal";

  const lineStyle: ViewStyle = {
    backgroundColor: theme.colors.outlineVariant,
    flex: 1,
    ...(isHorizontal
      ? { height: thickness, marginHorizontal: inset }
      : { width: thickness, marginVertical: inset, height: "100%" }),
  };

  if (isHorizontal) {
    return (
      <View
        style={[styles.containerWithComponent, styles.componentSpacing, style]}
      >
        <View style={lineStyle} />
        {Component}
        <View style={lineStyle} />
      </View>
    );
  }

  return <View style={[lineStyle, style]} />;
};

export default Divider;

// Styles
interface DividerStyleProps {
  containerWithComponent: ViewStyle;
  componentSpacing: ViewStyle;
}

const makeStyles: (
  contentSpacing: number,
) => StyleSheet.NamedStyles<DividerStyleProps> = (contentSpacing: number) =>
  StyleSheet.create({
    containerWithComponent: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
    },
    componentSpacing: {
      marginHorizontal: contentSpacing,
    },
  });
