import React from "react";
import {
  AccessibilityRole,
  AccessibilityState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { PressableState } from "../types";

interface SelectionControlProps {
  label?: string;
  labelPosition: "left" | "right";
  onPress: () => void;
  disabled?: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityState: AccessibilityState;
  /** The mark (box, circle); `active` while hovered or pressed. */
  children: (active: boolean) => React.ReactNode;
}

/**
 * The shared shell of `Checkbox` and `RadioButton`: the pressable row, the
 * optional label on either side and the 40dp M3 state-layer halo.
 */
const SelectionControl = ({
  label,
  labelPosition,
  onPress,
  disabled,
  accessibilityRole,
  accessibilityState,
  children,
}: SelectionControlProps) => {
  const { theme } = useTheme();

  const labelComponent = !!label && (
    <Text
      style={[
        theme.typography.bodyLarge,
        { color: theme.colors.onSurface },
        labelPosition === "left" ? { marginRight: 12 } : { marginLeft: 12 },
      ]}
    >
      {label}
    </Text>
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      disabled={disabled}
      style={[styles.wrapper, { opacity: disabled ? 0.38 : 1 }]}
    >
      {({ hovered, pressed }: PressableState) => (
        <>
          {labelPosition === "left" && labelComponent}

          <View style={styles.container}>
            {/* State Layer (Hover/Pressed Effect) */}
            <View
              style={[
                styles.stateLayer,
                {
                  backgroundColor: pressed
                    ? theme.colors.primary
                    : hovered
                      ? theme.colors.onSurface
                      : "transparent",
                  opacity: pressed ? 0.12 : hovered ? 0.08 : 0,
                },
              ]}
            />
            {children(!!(hovered || pressed))}
          </View>

          {labelPosition === "right" && labelComponent}
        </>
      )}
    </Pressable>
  );
};

export default SelectionControl;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    alignSelf: "flex-start",
    ...Platform.select({
      web: { cursor: "pointer" },
    }),
  },
  container: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  stateLayer: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
