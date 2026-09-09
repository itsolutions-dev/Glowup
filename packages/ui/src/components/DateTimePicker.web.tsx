import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { PressableState } from "./types";
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

/** Rough surface sizes, used to decide flip/clamp before the first layout. */
const SURFACE_WIDTH = { date: 336, time: 168, datetime: 512 } as const;
const SURFACE_HEIGHT = { date: 372, time: 260, datetime: 372 } as const;
const GAP = 6;
const MARGIN = 8;

interface AnchorPosition {
  top: number;
  left: number;
}
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
  defaultOpen,
}: DateTimePickerProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const labels = useLabels(labelOverrides);

  const locale = localeProp ?? getDeviceLocale();
  const displayValue = useDateTimeDisplay(value, mode, locale, relativeLabels);

  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorPosition | null>(null);

  /**
   * The value the surface edits. It starts from `value`, or from "now" clamped
   * into range when the field is still empty, so opening an empty picker lands
   * on a selectable instant instead of an out-of-range one.
   */
  const draft = useMemo(
    () => value ?? clampDate(new Date(), minimumDate, maximumDate),
    [value, minimumDate, maximumDate],
  );

  const reposition = useCallback(() => {
    const element = triggerRef.current as unknown as HTMLElement | null;
    if (!element?.getBoundingClientRect) return;
    const rect = element.getBoundingClientRect();
    const width = SURFACE_WIDTH[mode];
    const height = SURFACE_HEIGHT[mode];

    // Flip above the field when there is not enough room below it, and clamp
    // horizontally so the surface never hangs off the viewport.
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < height + GAP + MARGIN && rect.top > height + GAP + MARGIN
        ? rect.top - height - GAP
        : rect.bottom + GAP;
    const left = Math.min(
      Math.max(MARGIN, rect.left),
      Math.max(MARGIN, window.innerWidth - width - MARGIN),
    );
    setAnchor({ top, left });

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
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    reposition();
    // `position: fixed` coordinates go stale the moment anything scrolls, so
    // track both scroll (capture phase, to catch nested scrollers) and resize.
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  const close = useCallback(() => setOpen(false), []);

  // Escape lives here rather than in Calendar so a single owner closes the
  // surface in every mode, `time` included (which renders no Calendar).
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  const openSurface = () => {
    if (disabled) return;
    reposition();
    setOpen(true);
  };

  const handleDayChange = (day: Date) => {
    onChange(mergeDateAndTime(day, draft));
    // A pure date picker has nothing left to ask for once a day is picked.
    if (mode === "date") close();
  };

  const handleTimeChange = (next: Date) => onChange(next);

  const surface = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labels.closePicker}
        onPress={close}
        style={styles.scrim}
      />
      <View
        role="dialog"
        accessibilityLabel={label ?? labels.openPicker}
        style={[
          styles.surface,
          {
            top: anchor?.top ?? 0,
            left: anchor?.left ?? 0,
            width: SURFACE_WIDTH[mode],
            backgroundColor: theme.colors.surfaceContainerHigh,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.surfaceBody}>
          {mode !== "time" && (
            <Calendar
              value={value}
              onChange={handleDayChange}
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
            <View
              style={[
                styles.timePane,
                mode === "datetime" && {
                  borderLeftWidth: 1,
                  borderLeftColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <TimeSelect
                value={draft}
                onChange={handleTimeChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                minuteInterval={minuteInterval}
                locale={locale}
                labels={labelOverrides}
              />
            </View>
          )}
        </View>

        {mode !== "date" && (
          <View
            style={[
              styles.surfaceFooter,
              { borderTopColor: theme.colors.outlineVariant },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={close}
              style={({ hovered }: PressableState) => [
                styles.footerButton,
                hovered && {
                  backgroundColor: theme.colors.surfaceContainerHighest,
                },
              ]}
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
        )}
      </View>
    </>
  );

  return (
    <>
      <PickerField
        ref={triggerRef}
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
        onPress={openSurface}
        accessibilityLabel={label ?? labels.openPicker}
        style={style}
        testID={testID}
      />
      {open && createPortal(surface, document.body)}
    </>
  );
};

export default DateTimePicker;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    // `position: "fixed"` is react-native-web only; it keeps the surface out of
    // any scrolling/overflow-hidden ancestor that would otherwise clip it.
    scrim: {
      position: "fixed" as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    surface: {
      position: "fixed" as any,
      borderWidth: 1,
      borderRadius: theme.shape.large,
      paddingVertical: theme.spacing.xs,
      zIndex: 1001,
      // M3 elevation level 3 — the field sits on surface, so the popover needs
      // a stronger shadow than the theme's default level-1 token.
      boxShadow:
        "0px 4px 8px rgba(0,0,0,0.30), 0px 8px 24px rgba(0,0,0,0.22)" as any,
    },
    surfaceBody: { flexDirection: "row" },
    timePane: {
      flex: 1,
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.xs,
      justifyContent: "center",
    },
    surfaceFooter: {
      flexDirection: "row",
      justifyContent: "flex-end",
      borderTopWidth: 1,
      marginTop: theme.spacing.xs,
      paddingTop: theme.spacing.xs,
      paddingHorizontal: theme.spacing.s,
    },
    footerButton: {
      paddingVertical: 6,
      paddingHorizontal: theme.spacing.s,
      borderRadius: theme.shape.small,
    },
  });
