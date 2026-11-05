import React, { useState } from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import Icons from "./Glyph";
import { useTheme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "./types";
import { a11yState } from "./internal/a11yState";

/** The glyphs that have an `-outline` twin, which Rating draws the empty state with. */
type OutlinedGlyph = {
  [
    K in MaterialCommunityIconsGlyphs
  ]: `${K}-outline` extends MaterialCommunityIconsGlyphs ? K : never;
}[MaterialCommunityIconsGlyphs];

export interface RatingProps {
  /** Current rating; fractions are drawn as a partly filled icon (e.g. 3.5). */
  value: number;
  /** Interactive when provided. */
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  disabled?: boolean;
  /**
   * The step of the rating: `1` rates whole icons, `0.5` lets the pointer pick
   * either half of an icon. Defaults to `1`.
   */
  interval?: 0.5 | 1;
  /**
   * The filled glyph. Its `-outline` variant draws the empty state, so it has
   * to be one that has one (`"heart"` does, `"star"` does). Defaults to `"star"`.
   */
  icon?: OutlinedGlyph;
  /**
   * The rating cannot be cleared: tapping the current value keeps it. Without
   * it, tapping the current value resets the rating to 0.
   */
  required?: boolean;
}

const Rating = ({
  value,
  onChange,
  max = 5,
  size = 24,
  disabled,
  interval = 1,
  icon = "star",
  required = false,
}: RatingProps) => {
  const { theme } = useTheme();
  const interactive = !!onChange && !disabled;
  // The rating the pointer is over, shown instead of `value` while it is there.
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = interactive && hovered != null ? hovered : value;
  const emptyIcon = `${icon}-outline` as MaterialCommunityIconsGlyphs;

  const pick = (next: number) => {
    // Tapping the current value clears the rating, unless it is required.
    onChange?.(next === value && !required ? 0 : next);
  };

  return (
    <View
      style={[styles.container, disabled && { opacity: 0.38 }]}
      accessibilityRole="adjustable"
      accessibilityLabel={`Rating: ${value} of ${max}`}
      {...a11yState("adjustable", undefined, { min: 0, max, now: value })}
    >
      {Array.from({ length: max }, (_, index) => {
        const starNumber = index + 1;
        // How much of this icon is filled: 0, half or all of it. A shown value
        // is drawn in halves whatever the `interval`, which only steps the input.
        const fill = Math.min(1, Math.max(0, shown - index));
        const drawn = fill >= 1 ? 1 : fill >= 0.5 ? 0.5 : 0;
        const steps =
          interval === 0.5 ? [starNumber - 0.5, starNumber] : [starNumber];

        return (
          <View
            key={starNumber}
            style={styles.icon}
            // The press targets carry the roles and labels once interactive.
            accessibilityRole={interactive ? undefined : "image"}
            accessibilityLabel={
              interactive
                ? undefined
                : `${starNumber} ${starNumber === 1 ? "star" : "stars"}`
            }
          >
            <Icons
              name={emptyIcon}
              size={size}
              color={theme.colors.onSurfaceVariant}
            />
            {drawn > 0 && (
              <View
                pointerEvents="none"
                style={[styles.fill, { width: size * drawn, height: size }]}
              >
                <Icons name={icon} size={size} color={theme.colors.primary} />
              </View>
            )}
            {interactive && (
              <View style={styles.targets}>
                {steps.map((target) => (
                  <Pressable
                    key={target}
                    accessibilityRole="button"
                    accessibilityLabel={`${target} ${target === 1 ? "star" : "stars"}`}
                    onPress={() => pick(target)}
                    onHoverIn={() => setHovered(target)}
                    onHoverOut={() => setHovered(null)}
                    style={styles.target}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
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
  icon: { position: "relative" },
  // The filled glyph is drawn whole and clipped to the filled share of the width.
  fill: { position: "absolute", top: 0, left: 0, overflow: "hidden" },
  // Invisible hit areas laid over the icon: one per step, so a half step is a
  // half-icon wide and hover, press and the preview all agree on it.
  targets: { ...StyleSheet.absoluteFill, flexDirection: "row" },
  target: {
    flex: 1,
    ...Platform.select({
      web: { cursor: "pointer" },
    }),
  },
});
