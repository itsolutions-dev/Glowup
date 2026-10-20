import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@its/glowup-ui";

export type LegendItem = { key: string; label: string; color: string };

export type ChartLegendProps = {
  items: LegendItem[];
  /** Keys of the items that are switched off: they stay in the legend, greyed and struck out. */
  hidden?: string[];
  /** An item was tapped. Without it the legend is only a key to the colours. */
  onToggle?: (key: string) => void;
  testID?: string;
};

/**
 * A key to the colours of a chart. Given `onToggle`, each item is a switch that
 * hides or shows its series or part; a screen reader hears it as a checkbox.
 */
export const ChartLegend = ({
  items,
  hidden = [],
  onToggle,
  testID,
}: ChartLegendProps) => {
  const { theme } = useTheme();
  return (
    <View style={styles.row} testID={testID}>
      {items.map((item) => {
        const off = hidden.includes(item.key);
        const content = (
          <>
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor: off ? "transparent" : item.color,
                  borderColor: off ? theme.colors.outline : item.color,
                },
              ]}
            />
            <Text
              style={[
                theme.typography.labelMedium,
                {
                  color: off
                    ? theme.colors.onSurfaceVariant
                    : theme.colors.onSurface,
                  textDecorationLine: off ? "line-through" : "none",
                },
              ]}
            >
              {item.label}
            </Text>
          </>
        );
        return onToggle ? (
          <Pressable
            key={item.key}
            testID={testID ? `${testID}-${item.key}` : undefined}
            accessibilityRole="checkbox"
            accessibilityLabel={item.label}
            accessibilityState={{ checked: !off }}
            onPress={() => onToggle(item.key)}
            hitSlop={6}
            style={styles.item}
          >
            {content}
          </Pressable>
        ) : (
          <View
            key={item.key}
            testID={testID ? `${testID}-${item.key}` : undefined}
            style={styles.item}
          >
            {content}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 16, paddingTop: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 2, borderWidth: 2 },
});
