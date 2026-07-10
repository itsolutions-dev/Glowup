import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, getGlowStyles } from "../providers/ThemeProvider";
import {
  DateTimePickerProps,
  DateTimePickerMode,
  getDeviceLocale,
  useDateTimeDisplay,
} from "./DateTimePicker.shared";

const INPUT_TYPES: Record<DateTimePickerMode, string> = {
  date: "date",
  time: "time",
  datetime: "datetime-local",
};

const pad = (n: number) => String(n).padStart(2, "0");

const toInputValue = (date: Date, mode: DateTimePickerMode) => {
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (mode === "time") return timePart;
  if (mode === "datetime") return `${datePart}T${timePart}`;
  return datePart;
};

const fromInputValue = (raw: string, mode: DateTimePickerMode, base: Date) => {
  const next = new Date(base);
  if (mode === "time") {
    const [hours, minutes] = raw.split(":").map(Number);
    next.setHours(hours, minutes, 0, 0);
  } else if (mode === "datetime") {
    const [datePart, timePart] = raw.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);
    next.setFullYear(year, month - 1, day);
    next.setHours(hours, minutes, 0, 0);
  } else {
    const [year, month, day] = raw.split("-").map(Number);
    next.setFullYear(year, month - 1, day);
  }
  return next;
};

const DateTimePicker = ({
  label,
  value,
  onChange,
  disabled,
  mode = "date",
  relativeLabels,
}: DateTimePickerProps) => {
  const [focused, setFocused] = useState(false);
  const { theme } = useTheme();

  const locale = getDeviceLocale();
  const displayValue = useDateTimeDisplay(value, mode, locale, relativeLabels);

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (!raw) return; // field cleared — keep the current value
    onChange(fromInputValue(raw, mode, value));
  };

  const openPicker = (event: React.MouseEvent<HTMLInputElement>) => {
    // showPicker() opens the native calendar/clock dropdown where supported
    // (Chrome 99+, Edge, Firefox 101+, Safari 16+); clicking the input is
    // the fallback behavior elsewhere.
    try {
      event.currentTarget.showPicker?.();
    } catch {
      // NotAllowedError if already open — the picker is visible, nothing to do
    }
  };

  return (
    <View style={styles.wrapper}>
      {!!label && (
        <Text
          style={[
            theme.typography.labelMedium,
            styles.staticLabel,
            {
              color: focused
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        accessibilityValue={{ text: displayValue }}
        style={[
          styles.container,
          getGlowStyles(theme, focused),
          disabled && { opacity: 0.38 },
        ]}
      >
        <View style={styles.content}>
          <Text
            style={[
              theme.typography.bodyLarge,
              { color: theme.colors.onSurface },
            ]}
          >
            {displayValue}
          </Text>
        </View>
        <Icons
          name={mode === "time" ? "clock-outline" : "calendar-blank-outline"}
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
        <input
          type={INPUT_TYPES[mode]}
          value={toInputValue(value, mode)}
          onChange={handleInput}
          onClick={openPicker}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          aria-label={label || "Select date"}
          style={inputOverlayStyle}
        />
      </View>
    </View>
  );
};
export default DateTimePicker;

// Invisible native input stretched over the field: clicks land on it and
// open the browser's own date/time picker, keyboard editing keeps working.
const inputOverlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  cursor: "pointer",
  border: "none",
  padding: 0,
  margin: 0,
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  staticLabel: {
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
  container: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
});
