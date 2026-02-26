import { useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ImageSourcePropType,
} from "react-native";
import { useTheme, Theme, getGlowStyles } from "../providers/ThemeProvider";

import Icons from "@expo/vector-icons/MaterialCommunityIcons";

interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: number;
  onPress?: () => void;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  status?: "online" | "offline" | null;
}

const Avatar = ({
  source,
  name,
  size = 40,
  onPress,
  icon = "account",
  backgroundColor,
  textColor,
  status,
}: AvatarProps) => {
  const getInitials = (fullName: string | undefined | null) => {
    if (!fullName || typeof fullName !== "string" || fullName.trim() === "")
      return null;
    const parts = fullName.split(" ");
    return parts
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const initials = getInitials(name);
  const fontSize = size * 0.4;

  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const statusColor = useMemo(() => {
    if (status === "online") return theme.colors.success || "#4CAF50";
    if (status === "offline") return theme.colors.onSurfaceVariant || "#9E9E9E"; // Fallback
    return null;
  }, [status, theme.colors]);

  const dotSize = size * 0.25;
  const offset = size * 0.05;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: backgroundColor || theme.colors.primaryContainer,
          },
        ]}
      >
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          accessibilityRole={onPress ? "button" : undefined}
          accessibilityLabel={name ? `${name} Avatar` : "User Avatar"}
          style={({ hovered, pressed }: any) => [
            styles.container,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: backgroundColor || theme.colors.primaryContainer,
            },
            onPress && (hovered || pressed) && getGlowStyles(theme, true),
          ]}
        >
          {source ? (
            <Image
              source={source}
              style={[
                styles.image,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                },
              ]}
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
      </View>
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
            },
          ]}
        />
      )}
    </View>
  );
};

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    image: {
      flex: 1,
    },
    initials: {
      fontWeight: "500",
      letterSpacing: 0.1,
    },
    statusDot: {
      position: "absolute",
      borderWidth: 2,
      borderColor: theme.colors.outline,
      borderRadius: 999,
    },
  });

export default Avatar;
