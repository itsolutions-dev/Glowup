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
