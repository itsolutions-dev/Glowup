import React, { useMemo, useState } from "react";
import { View, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import PickerField from "./DateTimePicker.field";
import PickerSurface, { PickerSelection } from "./DateTimePicker.surface";
import { usePickerController } from "./DateTimePicker.hooks";
import { DateTimePickerProps } from "./DateTimePicker.shared";

/**
 * Material 3 date / time / date-time picker.
 *
 * The same in-house surface renders on every platform, so the field, the
 * calendar and the clock look identical on iOS, Android and web instead of
 * deferring to whatever picker the OS ships.
 */
const DateTimePicker = (props: DateTimePickerProps) => {
  const {
    label,
    placeholder,
    mode = "date",
    disabled,
    required,
    error,
    helperText,
    clearable,
    onClear,
    validRange,
    isDateDisabled,
    labels: labelOverrides,
    firstDayOfWeek,
    minuteInterval,
    use24HourClock,
    inputEnabled,
    defaultInputType,
    scrollMode,
    startYear,
    endYear,
    style,
    testID,
    defaultOpen = false,
  } = props;

  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const controller = usePickerController(props);
  const [open, setOpen] = useState(defaultOpen);

  const openPicker = () => {
    if (disabled) return;
    // A half-typed value would otherwise reopen the dialog on stale text.
    controller.resetInput();
    setOpen(true);
  };

  const close = () => setOpen(false);

  const confirm = (selection: PickerSelection) => {
    close();
    controller.handleConfirm(selection);
  };

  return (
    <>
      <PickerField
        label={label}
        required={required}
        displayValue={controller.displayValue}
        placeholder={placeholder}
        icon={mode === "time" ? "clock-outline" : "calendar-blank-outline"}
        active={open}
        disabled={disabled}
        error={error ?? controller.inputError}
        helperText={helperText}
        clearable={clearable}
        onClear={() => {
          controller.resetInput();
          onClear?.();
        }}
        clearAccessibilityLabel={controller.labels.clear}
        onPress={openPicker}
        accessibilityLabel={label ?? controller.labels.openPicker}
        editable={controller.fieldEditable}
        inputValue={controller.fieldText}
        onInputChange={controller.handleInputChange}
        onInputBlur={controller.handleInputBlur}
        inputPlaceholder={controller.inputHint}
        openAccessibilityLabel={controller.labels.openPicker}
        style={style}
        testID={testID}
      />

      {/* Glowup's `Modal` is a fixed-width card with its own title bar and a
          single close action; the M3 picker needs a custom headline row and a
          two-action footer, so the dialog shell is built on RN's Modal. */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={controller.labels.closePicker}
          onPress={close}
          style={styles.scrim}
        >
          {/* Swallows presses on the card so only the scrim dismisses. */}
          <Pressable
            accessibilityRole="none"
            onPress={() => {}}
            style={[
              styles.dialog,
              { backgroundColor: theme.colors.surfaceContainer },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.dialogBody}>
                <PickerSurface
                  mode={mode}
                  fieldLabel={label}
                  selection={controller.selection}
                  onConfirm={confirm}
                  onCancel={close}
                  validRange={validRange}
                  isDateDisabled={isDateDisabled}
                  locale={controller.locale}
                  firstDayOfWeek={firstDayOfWeek}
                  labels={labelOverrides}
                  minuteInterval={minuteInterval}
                  use24HourClock={use24HourClock}
                  scrollMode={scrollMode}
                  startYear={startYear}
                  endYear={endYear}
                  inputEnabled={inputEnabled}
                  defaultInputType={defaultInputType}
                  testID={testID ? `${testID}-surface` : undefined}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default DateTimePicker;

/** M3 basic-dialog width: the 7×40 day grid plus the dialog's own gutters. */
const DIALOG_WIDTH = 328;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    scrim: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.45)",
      padding: theme.spacing.m,
    },
    dialog: {
      width: DIALOG_WIDTH,
      maxWidth: "100%",
      maxHeight: "90%",
      borderRadius: theme.shape.extraLarge,
      overflow: "hidden",
    },
    dialogBody: { alignItems: "stretch" },
  });
