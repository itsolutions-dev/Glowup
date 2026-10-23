import { useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ImageSourcePropType,
} from "react-native";
import { useTheme, Theme, getFocusRing } from "../providers/ThemeProvider";

import Icons from "./Glyph";
import Tooltip from "./Tooltip";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

const SIZES = { small: 32, medium: 40, large: 56 } as const;

export interface AvatarProps {
  source?: ImageSourcePropType;
  /**
   * Initials are drawn from it when there is no `source`, and it is shown as a
   * tooltip on hover (web) or long press (native).
   */
  name?: string;
  /** A size in pixels, or `"small"` (32), `"medium"` (40) or `"large"` (56). Defaults to `"medium"`. */
  size?: number | "large" | "medium" | "small";
  onClick?: () => void;
  icon?: MaterialCommunityIconsGlyphs;
  backgroundColor?: string;
  textColor?: string;
  status?: "online" | "offline" | "busy" | "away" | null;
  /** Shape: full circle, rounded corners, or square. */
  variant?: "circular" | "rounded" | "square";
}

const Avatar = ({
  source,
  name,
  size: sizeProp = "medium",
  onClick,
  icon = "account",
  backgroundColor,
  textColor,
  status,
  variant = "circular",
}: AvatarProps) => {
  const getInitials = (fullName: string | undefined | null) => {
    if (!fullName || typeof fullName !== "string" || fullName.trim() === "")
      return null;
    const parts = fullName.trim().split(/\s+/);
    return parts
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const size = typeof sizeProp === "number" ? sizeProp : SIZES[sizeProp];
  const initials = getInitials(name);
  const fontSize = size * 0.4;

  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const statusColor = useMemo(() => {
    if (status === "online") return "#4CAF50";
    if (status === "busy") return theme.colors.error || "#F44336";
    if (status === "away") return "#FFB300";
    if (status === "offline") return theme.colors.outline || "#9E9E9E";
    return null;
  }, [status, theme.colors]);

  const dotSize = size * 0.25;
  const offset = size * 0.05;

  const borderRadius =
    variant === "circular"
      ? size / 2
      : variant === "rounded"
        ? theme.shape.medium
        : 0;

  const avatar = (
    <View style={{ width: size, height: size }}>
      <Pressable
        onPress={onClick}
        disabled={!onClick}
        accessibilityRole={onClick ? "button" : "image"}
        accessibilityLabel={name ? `${name} Avatar` : "User Avatar"}
        style={({ hovered, pressed }: PressableState) => [
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: backgroundColor || theme.colors.primaryContainer,
          },
          onClick && (hovered || pressed) && getFocusRing(theme),
        ]}
      >
        {source ? (
          <Image
            source={source}
            style={{
              width: size,
              height: size,
              borderRadius,
            }}
          />
        ) : name ? (
          <Text
            style={[
              styles.initials,
              {
                fontSize,
                color: textColor || theme.colors.onPrimaryContainer,
              },
            ]}
          >
            {initials}
          </Text>
        ) : (
          <Icons
            name={icon}
            size={size * 0.6}
            color={textColor || theme.colors.onPrimaryContainer}
          />
        )}
      </Pressable>
      {status && statusColor && (
        <View
          style={[
            styles.statusDot,
            {
              bottom: offset,
              right: offset,
              width: dotSize,
              height: dotSize,
              backgroundColor: statusColor,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          {status === "busy" && dotSize > 12 && (
            <View
              style={{
                width: dotSize * 0.6,
                height: 2,
                backgroundColor: "white",
              }}
            />
          )}
          {status === "away" && dotSize > 12 && (
            <Icons name="clock-outline" size={dotSize * 0.8} color="white" />
          )}
        </View>
      )}
    </View>
  );

  return name?.trim() ? (
    <Tooltip content={name} anchorAccessible={false}>
      {avatar}
    </Tooltip>
  ) : (
    avatar
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    initials: {
      fontWeight: "500",
      letterSpacing: 0.1,
    },
    statusDot: {
      position: "absolute",
      borderWidth: 2,
      borderColor: theme.colors.surface, // "cutout" ring against the background
      borderRadius: 999,
    },
  });

export default Avatar;
