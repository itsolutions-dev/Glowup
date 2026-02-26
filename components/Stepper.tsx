import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme, getGlowStyles } from "../providers/ThemeProvider";

export interface Step {
  label: string;
  icon?: string;
}

interface StepperProps {
  steps: Step[] | string[];
  activeStep: number;
  onStepPress?: (stepIndex: number) => void;
  style?: object;
}

const Stepper = ({ steps, activeStep, onStepPress, style }: StepperProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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

    return (
      <React.Fragment key={index}>
        <View style={styles.stepWrapper}>
          <Pressable
            onPress={() => onStepPress?.(index)}
            disabled={!onStepPress}
            style={({ hovered, pressed }: any) => [
              styles.stepCircle,
              {
                borderColor: stepColor,
                backgroundColor: isCompleted
                  ? theme.colors.primary
                  : theme.colors.surface,
              },
              isActive && getGlowStyles(theme, true),
              (hovered || pressed) && onStepPress && getGlowStyles(theme, true),
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
                {icon ? <Icons name={icon as any} size={16} /> : index + 1}
              </Text>
            )}
          </Pressable>
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
          <View
            style={[
              styles.connector,
              {
                backgroundColor: isCompleted
                  ? theme.colors.primary
                  : theme.colors.outlineVariant,
              },
            ]}
          />
        )}
      </React.Fragment>
    );
  };

  return <View style={[styles.container, style]}>{steps.map(renderStep)}</View>;
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingVertical: 16,
      width: "100%",
    },
    stepWrapper: {
      alignItems: "center",
      zIndex: 2,
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
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
  });

export default Stepper;
