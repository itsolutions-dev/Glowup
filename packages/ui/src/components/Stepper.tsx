import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import Icons from "./Glyph";
import { useTheme, Theme, getFocusRing } from "../providers/ThemeProvider";
import { PressableState } from "./types";

export interface Step {
  label: string;
  icon?: string;
}

export interface StepperProps {
  /** The steps, in order; a string is a step with just a label. */
  steps: Step[] | string[];
  /** Position of the current step. Those before it are completed. */
  activeStep: number;
  /**
   * `"row"` lays the steps out side by side, the label under each circle;
   * `"column"` stacks them, the label beside each circle. Defaults to `"row"`.
   */
  direction?: "row" | "column";
  /** Called with the pressed step's position. Makes the steps pressable. */
  onClick?: (stepIndex: number) => void;
  style?: object;
}

const Stepper = ({
  steps,
  activeStep,
  direction = "row",
  onClick,
  style,
}: StepperProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const column = direction === "column";

  const renderStep = (step: Step | string, index: number) => {
    const isCompleted = index < activeStep;
    const isActive = index === activeStep;
    const isLast = index === steps.length - 1;

    const label = typeof step === "string" ? step : step.label;
    const icon = typeof step === "object" ? step.icon : undefined;

    const stepColor =
      isActive || isCompleted
        ? theme.colors.primary
        : theme.colors.outlineVariant;
    const textColor = isActive
      ? theme.colors.primary
      : theme.colors.onSurfaceVariant;
    const lineColor = isCompleted
      ? theme.colors.primary
      : theme.colors.outlineVariant;

    // The same control in both directions: only where the label sits differs.
    const circle = (
      <Pressable
        onPress={() => onClick?.(index)}
        disabled={!onClick}
        accessibilityRole="button"
        accessibilityLabel={`Step ${index + 1}: ${label}`}
        accessibilityState={{ selected: isActive, disabled: !onClick }}
        style={({ hovered, pressed }: PressableState) => [
          styles.stepCircle,
          {
            borderColor: stepColor,
            backgroundColor: isCompleted
              ? theme.colors.primary
              : theme.colors.surface,
          },
          isActive && getFocusRing(theme),
          (hovered || pressed) && onClick && getFocusRing(theme),
        ]}
      >
        {isCompleted ? (
          <Icons name="check" size={16} color={theme.colors.onPrimary} />
        ) : (
          <Text
            style={[
              theme.typography.labelLarge,
              {
                color: isActive
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {icon ? (
              <Icons
                name={icon as any}
                size={16}
                color={
                  isActive
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
            ) : (
              index + 1
            )}
          </Text>
        )}
      </Pressable>
    );

    if (column) {
      return (
        <View key={index} style={styles.columnStep}>
          <View style={styles.columnRail}>
            {circle}
            {!isLast && (
              <View
                style={[styles.columnConnector, { backgroundColor: lineColor }]}
              />
            )}
          </View>
          <View style={styles.columnLabel}>
            <Text
              style={[
                theme.typography.labelLarge,
                { color: textColor, fontWeight: isActive ? "700" : "400" },
              ]}
            >
              {label}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <React.Fragment key={index}>
        <View style={styles.stepWrapper}>
          {circle}
          <Text
            style={[
              theme.typography.labelSmall,
              styles.stepLabel,
              { color: textColor, fontWeight: isActive ? "700" : "400" },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>

        {!isLast && (
          <View style={[styles.connector, { backgroundColor: lineColor }]} />
        )}
      </React.Fragment>
    );
  };

  return (
    <View style={[column ? styles.column : styles.container, style]}>
      {steps.map(renderStep)}
    </View>
  );
};

const CIRCLE = 32;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingVertical: 16,
      width: "100%",
    },
    column: {
      alignItems: "flex-start",
      paddingVertical: 16,
    },
    stepWrapper: {
      alignItems: "center",
      zIndex: 2,
    },
    stepCircle: {
      width: CIRCLE,
      height: CIRCLE,
      borderRadius: CIRCLE / 2,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: {
          transition: "all 0.2s ease-in-out",
        },
      }),
    },
    stepLabel: {
      marginTop: 8,
      textAlign: "center",
      maxWidth: 80,
    },
    connector: {
      flex: 1,
      height: 2,
      marginTop: 15, // Half of stepCircle height (16) - half of connector height (1)
      marginHorizontal: -10, // Overlap slightly to ensure continuity
      zIndex: 1,
    },
    // A step is the circle and the line down to the next one, with the label
    // beside the circle; a long label grows the row and the line with it.
    columnStep: { flexDirection: "row" },
    columnRail: { alignItems: "center" },
    columnConnector: {
      flex: 1,
      width: 2,
      minHeight: theme.spacing.l,
      marginVertical: theme.spacing.xs,
    },
    // Pinned to the top: the row is as tall as the circle and its line, and a
    // label centred in all of that would sit below its circle.
    columnLabel: {
      alignSelf: "flex-start",
      justifyContent: "center",
      minHeight: CIRCLE,
      marginStart: theme.spacing.m,
      flexShrink: 1,
    },
  });

export default Stepper;
