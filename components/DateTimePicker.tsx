import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Button,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "../providers/ThemeProvider";
import * as Localization from "expo-localization";
import { format, isToday, isYesterday, isTomorrow } from "date-fns";

interface DateTimePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  mode?: "date" | "datetime" | "time";
}

const DateTimePicker = ({
  label,
  value,
  onChange,
  disabled,
  mode = "date",
}: DateTimePickerProps) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const { theme } = useTheme();

  const handleConfirm = (date: Date) => {
    setPickerVisible(false);
    onChange(date);
  };

  const getDeviceLocale = useCallback(() => {
    if (Platform.OS === "web") {
      return navigator.language || "it-IT"; // Note: changed from it-US to it-IT
    }
    return Localization.getLocales()[0].languageTag;
  }, []);

  const getRelativeLabel = useCallback(
    (date: Date, locale: string, mode: string) => {
      if (mode === "time") return null;
      if (isToday(date)) return "Today";
      if (isYesterday(date)) return "Yesterday";
      if (isTomorrow(date)) return "Tomorrow";
      return null;
    },
    [],
  );

  const locale = getDeviceLocale();

  const displayValue = useMemo(() => {
    const relative = getRelativeLabel(value, locale, mode);
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: mode === "time" ? undefined : "medium",
      timeStyle: mode === "date" ? undefined : "short",
    };
    const formatted = new Intl.DateTimeFormat(locale, options).format(value);
    return relative ? `${relative}, ${formatted}` : formatted;
  }, [value, mode, locale]);

  return (
    <View>
      <Button title="Show Date Picker" onPress={() => setPickerVisible(true)} />
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

  {
    /* <View style={styles.wrapper}>
      {label && (
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
        style={[
          styles.container,
          {
            borderColor: pickerVisible
              ? theme.colors.primary
              : theme.colors.outlineVariant,
            backgroundColor: theme.colors.surface,
            // Glow effect logic...
            ...(pickerVisible &&
              Platform.OS === "web" && {
                boxShadow: `0 0 0 4px ${theme.colors.primary}25`,
              }),
          },
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
    </View>); */
  }
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
  iosDone: {
    alignItems: "flex-end",
    padding: 10,
    marginTop: -10,
  },
});
