import React, { useMemo } from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "./types";

interface RatingProps {
  /** Current rating; halves are rendered (e.g. 3.5). */
  value: number;
  /** Interactive when provided; tapping a star sets a whole value. */
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  disabled?: boolean;
}

const Rating = ({
  value,
  onChange,
  max = 5,
  size = 24,
  disabled,
}: RatingProps) => {
  const { theme } = useTheme();
  const interactive = !!onChange && !disabled;

  const stars = useMemo(() => {
    return Array.from({ length: max }, (_, index) => {
      const starNumber = index + 1;
      let icon: MaterialCommunityIconsGlyphs = "star-outline";
      if (value >= starNumber) {
        icon = "star";
      } else if (value >= starNumber - 0.5) {
        icon = "star-half-full";
      }
      return { starNumber, icon };
    });
  }, [value, max]);

  return (
    <View
      style={[styles.container, disabled && { opacity: 0.38 }]}
      accessibilityRole="adjustable"
      accessibilityLabel={`Rating: ${value} of ${max}`}
      accessibilityValue={{ min: 0, max, now: value }}
    >
      {stars.map(({ starNumber, icon }) => (
        <Pressable
          key={starNumber}
          onPress={
            interactive
              ? () => {
                  // Tapping the current value clears the rating
                  onChange(starNumber === value ? 0 : starNumber);
                }
              : undefined
          }
          disabled={!interactive}
          accessibilityRole={interactive ? "button" : "image"}
          accessibilityLabel={`${starNumber} ${starNumber === 1 ? "star" : "stars"}`}
          style={interactive && styles.starPressable}
        >
          <Icons
            name={icon}
            size={size}
            color={
              icon === "star-outline"
                ? theme.colors.onSurfaceVariant
                : theme.colors.primary
            }
          />
        </Pressable>
      ))}
    </View>
  );
};

export default Rating;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  starPressable: {
    ...Platform.select({
      web: { cursor: "pointer" },
    }),
  },
});
