import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FAB from "./FAB";
import { useTheme, Theme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "@expo/vector-icons/MaterialCommunityIcons";

type SpeedDialPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

interface SpeedDialAction {
  id: string;
  label: string;
  icon: MaterialCommunityIconsGlyphs;
  position?: SpeedDialPosition;
  onPress: () => void;
}

interface SpeedDialProps {
  actions: SpeedDialAction[];
  mainIcon: MaterialCommunityIconsGlyphs;
}

const SpeedDial = ({ actions, mainIcon, position = "bottom-right" }) => {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.spring(anim, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
    setOpen(!open);
  };

  const getSafeStyle = useCallback(() => {
    const baseMargin = 16;
    const style: ViewStyle = { position: "absolute" };

    if (position.startsWith("top")) {
      style.top = insets.top + baseMargin;
    } else {
      style.bottom = insets.bottom + baseMargin;
    }

    if (position.endsWith("right")) {
      style.right = insets.right + baseMargin;
    } else {
      style.left = insets.left + baseMargin;
    }

    return style;
  }, [position, insets]);

  return (
    <View style={styles.container}>
      {open && <Pressable style={StyleSheet.absoluteFill} onPress={toggle} />}

      <View style={[styles.fabContainer, getSafeStyle()]}>
        <View style={styles.actionsStack}>
          {actions.map((action, index) => {
            const translateY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            });

            return (
              <Animated.View
                key={action.id}
                style={[
                  styles.actionRow,
                  {
                    opacity: anim,
                    transform: [{ scale: anim }, { translateY }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.labelCard,
                    { backgroundColor: theme.colors.surfaceContainerHigh },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.labelLarge,
                      { color: theme.colors.onSurface },
                    ]}
                    accessibilityLabel={action.label}
                    accessibilityRole="text"
                  >
                    {action.label}
                  </Text>
                </View>

                <FAB
                  icon={action.icon}
                  onPress={() => {
                    action.onPress();
                    toggle();
                  }}
                  size="small"
                  style={styles.fab}
                />
              </Animated.View>
            );
          })}
        </View>

        <Animated.View
          style={{
            transform: [
              {
                rotate: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "45deg"],
                }),
              },
            ],
          }}
        >
          <FAB
            icon={mainIcon}
            onPress={toggle}
            size="regular"
            style={styles.fab}
            position={position}
          />
        </Animated.View>
      </View>
    </View>
  );
};

export default SpeedDial;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: "box-none",
      zIndex: 1000,
    },
    fabContainer: {
      alignItems: "center",
    },
    actionsStack: {
      alignItems: "flex-end",
      marginBottom: 16,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    labelCard: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginRight: 16,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    fab: { position: "relative", bottom: 0, right: 0 },
  });
