import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import Icons from "./Glyph";
import Button from "./Button";
import LinearProgress from "./Progress/LinearProgress";
import { useFormSubmit } from "./Form";
import { useTheme, Theme, getFocusRing } from "../providers/ThemeProvider";
import { PressableState } from "./types";
import { a11yState } from "./internal/a11yState";

export interface Step {
  label: string;
  icon?: string;
}

export interface StepperProps {
  /**
   * The steps, in order; a string is a step with just a label. A number is
   * that many steps without labels (all `"dots"` and `"progress"` need).
   */
  steps: Step[] | string[] | number;
  /**
   * `"steps"` draws a numbered circle and a label per step. `"dots"` and
   * `"progress"` draw a row of dots or a bar between the optional Back and
   * Next buttons, for a form or a set of pages on a phone. Defaults to
   * `"steps"`.
   */
  variant?: "steps" | "dots" | "progress";
  /** `"dots"` / `"progress"`: draws Back, which calls this (on the first step, `onCancel` instead). */
  onBack?: () => void;
  /** `"dots"` / `"progress"`: draws Next, which calls this. Disabled on the last step unless `submitStep`. */
  onNext?: () => void;
  /** The Back button's label. Defaults to "Back". */
  backLabel?: string;
  /** The Next button's label. Defaults to "Next". */
  nextLabel?: string;
  /**
   * On the last step, Next becomes a filled `type="submit"` button: it
   * submits the enclosing `Form` instead of calling `onNext`. Outside a
   * `Form` it calls `onNext`, and is disabled without one.
   */
  submitStep?: boolean;
  /** What Back does on the first step. Without it Back is disabled there. */
  onCancel?: () => void;
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
  steps: stepsProp,
  activeStep,
  direction = "row",
  onClick,
  style,
  variant = "steps",
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Next",
  submitStep = false,
  onCancel,
}: StepperProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const inForm = !!useFormSubmit();
  const column = direction === "column";
  const steps: (Step | string)[] =
    typeof stepsProp === "number"
      ? Array.from({ length: stepsProp }, () => "")
      : stepsProp;
  const count = steps.length;

  if (variant !== "steps") {
    const first = activeStep <= 0;
    const last = activeStep >= count - 1;
    const submit = submitStep && last;
    // Each button only with something to do: Back with onBack (or onCancel
    // for the first step), Next with onNext (or submitStep for the last).
    const hasBack = !!(onBack || onCancel);
    const hasNext = !!(onNext || submitStep);
    const hasButtons = hasBack || hasNext;
    const indicator = (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${activeStep + 1} of ${count}`}
        accessibilityValue={{ min: 1, max: count, now: activeStep + 1 }}
        style={variant === "dots" ? styles.dots : styles.bar}
      >
        {variant === "dots" ? (
          steps.map((_, index) => (
            <View
              key={index}
              testID="stepper-dot"
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeStep
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                },
              ]}
            />
          ))
        ) : (
          <LinearProgress
            progress={count > 1 ? activeStep / (count - 1) : 0}
            decorative
          />
        )}
      </View>
    );
    if (!hasButtons)
      return <View style={[styles.mobile, style]}>{indicator}</View>;
    return (
      <View style={[styles.mobile, style]}>
        {/* Both sides take an equal share, a button or not, so the indicator sits in the middle. */}
        <View style={[styles.side, styles.start]}>
          {hasBack && (
            <Button
              variant="text"
              iconName="chevron-left"
              disabled={first ? !onCancel : !onBack}
              onClick={first ? onCancel : onBack}
            >
              {backLabel}
            </Button>
          )}
        </View>
        {indicator}
        <View style={[styles.side, styles.end]}>
          {hasNext && (
            <Button
              variant={submit ? "filled" : "text"}
              type={submit ? "submit" : "button"}
              iconName={submit ? undefined : "chevron-right"}
              iconPosition="end"
              disabled={submit ? !inForm && !onNext : last || !onNext}
              onClick={submit && inForm ? undefined : onNext}
            >
              {nextLabel}
            </Button>
          )}
        </View>
      </View>
    );
  }

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
        accessibilityLabel={
          label ? `Step ${index + 1}: ${label}` : `Step ${index + 1}`
        }
        {...a11yState("button", { selected: isActive, disabled: !onClick })}
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
    mobile: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      paddingVertical: theme.spacing.s,
    },
    side: { flex: 1, minWidth: 0 },
    start: { alignItems: "flex-start" },
    end: { alignItems: "flex-end" },
    // Many dots wrap onto more rows within half the width, so Back and Next
    // keep a quarter each instead of being pushed off a phone's screen.
    dots: {
      flexDirection: "row",
      flexShrink: 1,
      flexWrap: "wrap",
      justifyContent: "center",
      maxWidth: "50%",
      gap: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    bar: { flex: 1, paddingHorizontal: theme.spacing.m },
    columnRail: { alignItems: "center" },
    columnConnector: {
      flex: 1,
      width: 2,
      minHeight: theme.spacing.l,
      marginVertical: theme.spacing.xs,
    },
    columnLabel: {
      justifyContent: "center",
      minHeight: CIRCLE,
      marginStart: theme.spacing.m,
      flexShrink: 1,
    },
  });

export default Stepper;
