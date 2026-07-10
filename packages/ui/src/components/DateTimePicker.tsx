import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, getGlowStyles } from "../providers/ThemeProvider";
import {
  DateTimePickerProps,
  getDeviceLocale,
  useDateTimeDisplay,
} from "./DateTimePicker.shared";

const DateTimePicker = ({
  label,
  value,
  onChange,
  disabled,
  mode = "date",
  relativeLabels,
}: DateTimePickerProps) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const { theme } = useTheme();

  const handleConfirm = (date: Date) => {
    setPickerVisible(false);
    onChange(date);
  };

  const locale = getDeviceLocale();
  const displayValue = useDateTimeDisplay(value, mode, locale, relativeLabels);

  return (
    <View style={styles.wrapper}>
      {!!label && (
        <Text
          style={[
            theme.typography.labelMedium,
            styles.staticLabel,
            {
              color: pickerVisible
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => setPickerVisible(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label || "Select date"}
        accessibilityValue={{ text: displayValue }}
        accessibilityState={{ disabled }}
        style={[
          styles.container,
          getGlowStyles(theme, pickerVisible),
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
      </Pressable>

      <DateTimePickerModal
        isVisible={pickerVisible}
        date={value}
        mode={mode}
        onConfirm={handleConfirm}
        onCancel={() => setPickerVisible(false)}
        locale={locale}
        accentColor={theme.colors.primary}
        buttonTextColorIOS={theme.colors.primary}
      />
    </View>
  );
};
export default DateTimePicker;

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
