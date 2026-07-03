import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";

import { useTheme, Theme } from "providers/ThemeProvider";
import Button from "./Button";
import { MaterialCommunityIconsGlyphs } from "./types";

interface IconBadgeProps {
  iconName: MaterialCommunityIconsGlyphs;
  badgeCount: number;
  badgeColor?: string;
  color?: string;
  size?: number;
  onPress?: () => void;
}

const IconBadge = ({
  iconName,
  badgeCount,
  badgeColor,
  color,
  size = 32,
  onPress,
}: IconBadgeProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const memoizedBadgeStyles = useMemo(() => {
    const badgeSize = Math.max(size * 0.35, 20);
    const borderRadius = badgeSize / 2;
    return {
      minWidth: badgeSize,
      height: badgeSize,
      borderRadius: borderRadius,
      top: -badgeSize / 3,
      right: -badgeSize / 3,
      paddingHorizontal: badgeSize / 8,
    };
  }, [size]); // Recalculate only if 'size' changes

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {/* The Base Icon */}
      <Button
        iconName={iconName}
        size={size}
        style={{ padding: 0, backgroundColor: "transparent" }}
        iconStyle={{ color: color || theme.colors.primary }}
        onPress={onPress}
      />

      {/* The Badge */}
      {badgeCount > 0 && (
        <View
          style={[
            styles.badge,
            memoizedBadgeStyles,
            { backgroundColor: badgeColor || theme.colors.error },
          ]}
        >
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
};
export default IconBadge;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.colors.surface, // M3 "cutout" ring against the background
    },
    badgeText: {
      color: theme.colors.onError,
      fontSize: 10,
      fontWeight: "700",
      lineHeight: 12,
    },
  });
