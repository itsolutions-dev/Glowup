import React, { useState, useCallback, useMemo } from "react";
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
import { MaterialCommunityIconsGlyphs } from "./types";

type SpeedDialPosition =
  "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface SpeedDialAction {
  id: string | number;
  label: string;
  icon: MaterialCommunityIconsGlyphs;
  onPress: () => void;
}

interface SpeedDialProps {
  actions: SpeedDialAction[];
  mainIcon: MaterialCommunityIconsGlyphs;
  position?: SpeedDialPosition;
  /** Mount with the action stack already expanded. Uncontrolled after that. */
  defaultOpen?: boolean;
}

const SpeedDial = ({
  actions,
  mainIcon,
  position = "bottom-right",
  defaultOpen = false,
}: SpeedDialProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const insets = useSafeAreaInsets();

  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [anim] = useState(() => new Animated.Value(defaultOpen ? 1 : 0));
  // The collapsed rows keep their layout width, so the stack has to hug the
  // chosen corner or the trigger drifts inward by half the widest label.
  const isLeft = position.endsWith("left");

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

      <View
        style={[
          { alignItems: isLeft ? "flex-start" : "flex-end" },
          getSafeStyle(),
        ]}
      >
        <View
          style={[
            styles.actionsStack,
            { alignItems: isLeft ? "flex-start" : "flex-end" },
          ]}
        >
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
                  { flexDirection: isLeft ? "row-reverse" : "row" },
                  {
                    opacity: anim,
                    transform: [{ scale: anim }, { translateY }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.labelCard,
                    isLeft ? { marginLeft: 16 } : { marginRight: 16 },
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
                  placement="inline"
                  style={styles.actionFab}
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
            placement="inline"
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
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "box-none",
      zIndex: 1000,
    },
    actionsStack: {
      marginBottom: 16,
    },
    actionRow: {
      alignItems: "center",
      marginBottom: 12,
    },
    labelCard: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    // Centres the 40px small FABs on the 56px trigger.
    actionFab: { marginHorizontal: 8 },
  });
