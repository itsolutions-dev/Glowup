import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { useInsets } from "./internal/useInsets";
import FAB from "./FAB";
import { useTheme, Theme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "./types";
import { cornerStyle } from "./internal/cornerPlacement";

type SpeedDialPosition =
  "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface SpeedDialAction {
  id: string | number;
  label: string;
  icon: MaterialCommunityIconsGlyphs;
  onPress: () => void;
  /** Finds this action's button in tests. */
  testID?: string;
}

export interface SpeedDialProps {
  actions: SpeedDialAction[];
  mainIcon: MaterialCommunityIconsGlyphs;
  position?: SpeedDialPosition;
  /** Mount with the action stack already expanded. Uncontrolled after that. */
  defaultOpen?: boolean;
  /**
   * Web: a mouse over the trigger opens the actions, and leaving them closes
   * them, as a desktop speed dial does. A touch or a click still toggles.
   * Defaults to `false`.
   */
  openOnHover?: boolean;
  /** Accessible name of the closed trigger. Defaults to `"Open actions"`. */
  openLabel?: string;
  /** Accessible name of the open trigger. Defaults to `"Close actions"`. */
  closeLabel?: string;
  /** Finds the trigger in tests (the button that opens and closes the actions). */
  testID?: string;
}

type PointerHandler = (event: {
  nativeEvent: { pointerType?: string };
}) => void;

const SpeedDial = ({
  actions,
  mainIcon,
  position = "bottom-right",
  defaultOpen = false,
  openOnHover = false,
  openLabel = "Open actions",
  closeLabel = "Close actions",
  testID,
}: SpeedDialProps) => {
  const [open, setOpen] = useState(defaultOpen);
  // True once the close spring has settled: the invisible actions are then
  // disabled, which takes them out of the web tab order. Not before, or they
  // would turn grey while still shrinking away.
  const [settledClosed, setSettledClosed] = useState(!defaultOpen);
  const insets = useInsets();

  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [anim] = useState(() => new Animated.Value(defaultOpen ? 1 : 0));
  // The collapsed rows keep their layout width, so the stack has to hug the
  // chosen corner or the trigger drifts inward by half the widest label.
  const isLeft = position.endsWith("left");

  const toggle = () => {
    const toValue = open ? 0 : 1;
    if (!open) setSettledClosed(false);
    Animated.spring(anim, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start(({ finished }) => {
      if (finished && toValue === 0) setSettledClosed(true);
    });
    setOpen(!open);
  };

  // Only a mouse hovers: a touch on the web also sends pointer events, and
  // must keep toggling on press.
  const onHover =
    openOnHover && Platform.OS === "web"
      ? (to: boolean): PointerHandler =>
          ({ nativeEvent }) => {
            if (nativeEvent.pointerType === "mouse" && open !== to) toggle();
          }
      : undefined;

  return (
    <View style={styles.container}>
      {open && <Pressable style={StyleSheet.absoluteFill} onPress={toggle} />}

      <View
        // Leaving the trigger for the actions above it keeps them open.
        {...(onHover && { onPointerLeave: onHover(false) })}
        style={[
          { alignItems: isLeft ? "flex-start" : "flex-end" },
          cornerStyle(position, insets),
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
                aria-hidden={!open}
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
                    // The button beside it carries the same name.
                    aria-hidden
                  >
                    {action.label}
                  </Text>
                </View>

                <FAB
                  testID={action.testID}
                  icon={action.icon}
                  label={action.label}
                  disabled={settledClosed}
                  onClick={() => {
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

        {/* Open, the trigger becomes the close button (the M3 FAB menu), and
            says so to a screen reader. */}
        {/* Opened from the trigger only: the collapsed actions keep their
            layout box above it, invisible. */}
        <View {...(onHover && { onPointerEnter: onHover(true) })}>
          <FAB
            testID={testID}
            icon={open ? "close" : mainIcon}
            label={open ? closeLabel : openLabel}
            onClick={toggle}
            size="medium"
            placement="inline"
          />
        </View>
      </View>
    </View>
  );
};

export default SpeedDial;

const makeStyles = (theme: Theme) =>
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
