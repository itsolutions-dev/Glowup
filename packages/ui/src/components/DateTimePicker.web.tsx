import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { View, Text, Pressable, StyleSheet } from "react-native";
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

// --- Custom it-IT calendar (date mode) --------------------------------------
// Replaces the browser's native <input type="date"> for mode="date": a styled
// popover with Monday-first weeks, Italian month/day labels, a filled-primary
// selected pill and an "Oggi" shortcut. time/datetime keep the native input.
const MONTHS = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];
// Monday-first weekday labels; Sunday (last) gets a primary tint.
const WEEKDAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Monday-first offset for the 1st of the shown month (0 = Monday … 6 = Sunday).
const leadingOffset = (year: number, month: number) =>
  (new Date(year, month, 1).getDay() + 6) % 7;

const CELL = 40;

const DateCalendarField = ({
  label,
  value,
  onChange,
  disabled,
  displayValue,
  defaultOpen = false,
}: {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  displayValue: string;
  defaultOpen?: boolean;
}) => {
  const { theme } = useTheme();
  const triggerRef = useRef<any>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [yearPicker, setYearPicker] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [view, setView] = useState<Date>(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const close = () => setOpen(false);

  const openPicker = () => {
    if (disabled) return;
    // Anchor the popover in fixed coordinates so a scrolling form body can't clip it.
    const el = triggerRef.current;
    if (el && typeof el.getBoundingClientRect === "function") {
      const r = el.getBoundingClientRect();
      setAnchor({ top: r.bottom + 6, left: r.left });
    }
    setView(new Date(value.getFullYear(), value.getMonth(), 1));
    setYearPicker(false);
    setOpen(true);
  };

  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const offset = leadingOffset(year, month);
    const start = new Date(year, month, 1 - offset);
    return Array.from(
      { length: 42 },
      (_, i) =>
        new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
    );
  }, [view]);

  const years = useMemo(() => {
    const base = view.getFullYear();
    return Array.from({ length: 12 }, (_, i) => base - 5 + i);
  }, [view]);

  const pick = (d: Date) => {
    // Preserve the current time-of-day; only the calendar date changes.
    const next = new Date(value);
    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    onChange(next);
    close();
  };

  const step = (delta: number) =>
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));

  return (
    <View style={styles.wrapper}>
      {!!label && (
        <Text
          style={[
            theme.typography.labelMedium,
            styles.staticLabel,
            {
              color: open
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={label || "Select date"}
        accessibilityValue={{ text: displayValue }}
        onPress={openPicker}
        disabled={disabled}
        style={[
          styles.container,
          getGlowStyles(theme, open),
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
          name="calendar-blank-outline"
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>

      {open &&
        createPortal(
          <>
            <Pressable
              accessibilityLabel="Chiudi calendario"
              onPress={close}
              style={OVERLAY_STYLE}
            />
            <View
              style={[
                POPOVER_STYLE,
                {
                  top: anchor?.top ?? 0,
                  left: anchor?.left ?? 0,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                },
              ]}
            >
              {/* Header: prev / month-year (toggles year picker) / next */}
              <View style={styles.calHeader}>
                <Pressable
                  onPress={() => step(-1)}
                  accessibilityLabel="Mese precedente"
                  style={({ hovered }: any) => [
                    styles.navBtn,
                    hovered && { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Icons
                    name="chevron-left"
                    size={22}
                    color={theme.colors.onSurface}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setYearPicker((y) => !y)}
                  style={styles.monthLabel}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      theme.typography.titleMedium,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {MONTHS[view.getMonth()]} {view.getFullYear()}
                  </Text>
                  <Icons
                    name={yearPicker ? "menu-up" : "menu-down"}
                    size={18}
                    color={theme.colors.onSurfaceVariant}
                  />
                </Pressable>
                <Pressable
                  onPress={() => step(1)}
                  accessibilityLabel="Mese successivo"
                  style={({ hovered }: any) => [
                    styles.navBtn,
                    hovered && { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Icons
                    name="chevron-right"
                    size={22}
                    color={theme.colors.onSurface}
                  />
                </Pressable>
              </View>

              {yearPicker ? (
                <View style={styles.yearGrid}>
                  {years.map((y) => {
                    const active = y === view.getFullYear();
                    return (
                      <Pressable
                        key={y}
                        onPress={() => {
                          setView(new Date(y, view.getMonth(), 1));
                          setYearPicker(false);
                        }}
                        style={({ hovered }: any) => [
                          styles.yearCell,
                          active && { backgroundColor: theme.colors.primary },
                          !active &&
                            hovered && {
                              backgroundColor: theme.colors.surfaceVariant,
                            },
                        ]}
                      >
                        <Text
                          style={[
                            theme.typography.bodyMedium,
                            {
                              color: active
                                ? theme.colors.onPrimary
                                : theme.colors.onSurface,
                            },
                          ]}
                        >
                          {y}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <>
                  <View style={styles.weekRow}>
                    {WEEKDAYS.map((w, i) => (
                      <Text
                        key={w}
                        style={[
                          theme.typography.labelSmall,
                          styles.weekLabel,
                          {
                            color:
                              i === 6
                                ? theme.colors.primary
                                : theme.colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        {w}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.grid}>
                    {cells.map((d, i) => {
                      const inMonth = d.getMonth() === view.getMonth();
                      const sel = sameDay(d, value);
                      const isSunday = d.getDay() === 0;
                      return (
                        <Pressable
                          key={i}
                          onPress={() => pick(d)}
                          style={({ hovered }: any) => [
                            styles.dayCell,
                            sel && {
                              backgroundColor: theme.colors.primary,
                              ...getGlowStyles(theme, true),
                            },
                            !sel &&
                              hovered && {
                                backgroundColor: theme.colors.surfaceVariant,
                              },
                            !sel &&
                              sameDay(d, today) && {
                                borderWidth: 1,
                                borderColor: theme.colors.primary,
                              },
                          ]}
                        >
                          <Text
                            style={[
                              theme.typography.bodyMedium,
                              {
                                color: sel
                                  ? theme.colors.onPrimary
                                  : !inMonth
                                    ? theme.colors.onSurfaceVariant
                                    : isSunday
                                      ? theme.colors.primary
                                      : theme.colors.onSurface,
                              },
                            ]}
                          >
                            {d.getDate()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              <View
                style={[
                  styles.calFooter,
                  { borderTopColor: theme.colors.outline },
                ]}
              >
                <Pressable onPress={() => pick(today)} style={styles.footerBtn}>
                  <Text
                    style={[
                      theme.typography.labelLarge,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Oggi
                  </Text>
                </Pressable>
              </View>
            </View>
          </>,
          document.body,
        )}
    </View>
  );
};

const DateTimePicker = ({
  label,
  value,
  onChange,
  disabled,
  mode = "date",
  relativeLabels,
  defaultOpen,
}: DateTimePickerProps) => {
  const [focused, setFocused] = useState(false);
  const { theme } = useTheme();

  const locale = getDeviceLocale();
  const displayValue = useDateTimeDisplay(value, mode, locale, relativeLabels);

  // date mode gets the custom it-IT calendar popover; time/datetime keep the
  // native input (the browser clock/datetime UI has no styled equivalent here).
  if (mode === "date") {
    return (
      <DateCalendarField
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        displayValue={displayValue}
        defaultOpen={defaultOpen}
      />
    );
  }

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

// position:"fixed" and boxShadow aren't in RN's ViewStyle type — declared here
// as plain objects (react-native-web honours them) so StyleSheet stays clean.
const OVERLAY_STYLE = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1000,
} as any;
const POPOVER_STYLE = {
  position: "fixed",
  width: 320,
  borderWidth: 1,
  borderRadius: 16,
  padding: 12,
  zIndex: 1001,
  boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
} as any;

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
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  weekRow: {
    flexDirection: "row",
  },
  weekLabel: {
    width: CELL,
    textAlign: "center",
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: CELL,
    height: CELL,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  yearCell: {
    width: "31%",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 6,
  },
  calFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
  },
  footerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
