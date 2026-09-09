import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Theme, useTheme } from "../providers/ThemeProvider";
import Calendar from "./Calendar";
import TimeSelect from "./TimeSelect";
import PickerField from "./DateTimePicker.field";
import {
  DateTimePickerProps,
  clampDate,
  getDeviceLocale,
  mergeDateAndTime,
  useDateTimeDisplay,
  useLabels,
} from "./DateTimePicker.shared";

const DateTimePicker = ({
  label,
  value,
  onChange,
  disabled,
  mode = "date",
  variant = "auto",
  relativeLabels,
  labels: labelOverrides,
  minimumDate,
  maximumDate,
  isDateDisabled,
  error,
  helperText,
  required,
  clearable,
  onClear,
  placeholder,
  minuteInterval,
  locale: localeProp,
  firstDayOfWeek,
  style,
  testID,
}: DateTimePickerProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const labels = useLabels(labelOverrides);

  const locale = localeProp ?? getDeviceLocale();
  const displayValue = useDateTimeDisplay(value, mode, locale, relativeLabels);

  const [open, setOpen] = useState(false);
  // Dialog semantics: edits accumulate in the draft and only reach `onChange`
  // when the user confirms, so Cancel really cancels.
  const [draft, setDraft] = useState<Date>(
    () => value ?? clampDate(new Date(), minimumDate, maximumDate),
  );
  // The OS picker has no way to express an arbitrary per-day predicate, so any
  // caller passing one gets the in-house surface even under `auto`.
  const useInlineSurface = variant === "inline" || !!isDateDisabled;

  const openPicker = () => {
    if (disabled) return;
    setDraft(value ?? clampDate(new Date(), minimumDate, maximumDate));
    setOpen(true);
  };

  const close = () => setOpen(false);

  const confirm = (date: Date) => {
    close();
    onChange(clampDate(date, minimumDate, maximumDate));
  };

  const field = (
    <PickerField
      label={label}
      required={required}
      displayValue={displayValue}
      placeholder={placeholder}
      icon={mode === "time" ? "clock-outline" : "calendar-blank-outline"}
      active={open}
      disabled={disabled}
      error={error}
      helperText={helperText}
      clearable={clearable}
      onClear={onClear}
      clearAccessibilityLabel={labels.clear}
      onPress={openPicker}
      accessibilityLabel={label ?? labels.openPicker}
      style={style}
      testID={testID}
    />
  );

  if (!useInlineSurface) {
    return (
      <>
        {field}
        <DateTimePickerModal
          isVisible={open}
          date={draft}
          mode={mode}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          minuteInterval={minuteInterval}
          onConfirm={confirm}
          onCancel={close}
          locale={locale}
          confirmTextIOS={labels.confirm}
          cancelTextIOS={labels.cancel}
          accentColor={theme.colors.primary}
          buttonTextColorIOS={theme.colors.primary}
        />
      </>
    );
  }

  return (
    <>
      {field}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.closePicker}
          onPress={close}
          style={styles.scrim}
        >
          {/* Swallows presses on the card so only the scrim dismisses. */}
          <Pressable
            accessibilityRole="none"
            onPress={() => {}}
            style={[
              styles.dialog,
              { backgroundColor: theme.colors.surfaceContainerHigh },
            ]}
          >
            <ScrollView
              contentContainerStyle={styles.dialogBody}
              showsVerticalScrollIndicator={false}
            >
              {mode !== "time" && (
                <Calendar
                  value={draft}
                  onChange={(day) => setDraft(mergeDateAndTime(day, draft))}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  isDateDisabled={isDateDisabled}
                  locale={locale}
                  firstDayOfWeek={firstDayOfWeek}
                  labels={labelOverrides}
                  showToday={mode === "date"}
                />
              )}
              {mode !== "date" && (
                <TimeSelect
                  value={draft}
                  onChange={setDraft}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  minuteInterval={minuteInterval}
                  locale={locale}
                  labels={labelOverrides}
                  style={styles.timeSelect}
                />
              )}
            </ScrollView>

            <View
              style={[
                styles.dialogFooter,
                { borderTopColor: theme.colors.outlineVariant },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={close}
                style={styles.footerButton}
              >
                <Text
                  style={[
                    theme.typography.labelLarge,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {labels.cancel}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => confirm(draft)}
                style={styles.footerButton}
              >
                <Text
                  style={[
                    theme.typography.labelLarge,
                    { color: theme.colors.primary },
                  ]}
                >
                  {labels.confirm}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default DateTimePicker;

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
      borderRadius: theme.shape.extraLarge,
      paddingTop: theme.spacing.s,
      maxHeight: "90%",
      overflow: "hidden",
    },
    dialogBody: { alignItems: "center" },
    timeSelect: { marginTop: theme.spacing.s },
    dialogFooter: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: theme.spacing.s,
      borderTopWidth: 1,
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
    },
    footerButton: {
      paddingVertical: 8,
      paddingHorizontal: theme.spacing.s,
      borderRadius: theme.shape.small,
    },
  });
