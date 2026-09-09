import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { View, Pressable, StyleSheet, ViewStyle } from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import PickerField from "./DateTimePicker.field";
import PickerSurface, { PickerSelection } from "./DateTimePicker.surface";
import { usePickerController } from "./DateTimePicker.hooks";
import { DateTimePickerProps } from "./DateTimePicker.shared";

/** M3 docked-picker width; matches the native dialog so the two agree. */
const SURFACE_WIDTH = 328;
/** Only used for the very first frame, before the surface has been measured. */
const ESTIMATED_HEIGHT = 600;
const GAP = 6;
const MARGIN = 8;

interface AnchorPosition {
  top: number;
  left: number;
}

/**
 * A viewport shorter than the surface scrolls it instead of cutting the
 * actions off the bottom. Both declarations are CSS-only, hence the cast past
 * the react-native style typings.
 */
const VIEWPORT_CLAMP = {
  maxHeight: `calc(100vh - ${MARGIN * 2}px)`,
  overflowY: "auto",
} as unknown as ViewStyle;

/**
 * Material 3 picker, docked to its field. Same surface as the native dialog,
 * presented as an anchored popover because a mouse has somewhere to point.
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

  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [anchor, setAnchor] = useState<AnchorPosition | null>(null);
  // The surface's real height depends on the mode, the locale and the month
  // grid, so it is measured once it is on screen rather than guessed at.
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  const reposition = useCallback(() => {
    const element = triggerRef.current as unknown as HTMLElement | null;
    if (!element?.getBoundingClientRect) return;
    const rect = element.getBoundingClientRect();
    const available = window.innerHeight - MARGIN * 2;
    const height = Math.min(measuredHeight ?? ESTIMATED_HEIGHT, available);

    // Flip above the field when there is not enough room below it, then clamp
    // both axes so the surface never hangs off the viewport.
    const spaceBelow = window.innerHeight - rect.bottom;
    const preferred =
      spaceBelow < height + GAP + MARGIN && rect.top > height + GAP + MARGIN
        ? rect.top - height - GAP
        : rect.bottom + GAP;
    const top = Math.max(
      MARGIN,
      Math.min(preferred, window.innerHeight - height - MARGIN),
    );
    const left = Math.min(
      Math.max(MARGIN, rect.left),
      Math.max(MARGIN, window.innerWidth - SURFACE_WIDTH - MARGIN),
    );
    setAnchor({ top, left });
  }, [measuredHeight]);

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
    controller.resetInput();
    setMeasuredHeight(null);
    reposition();
    setOpen(true);
  };

  const confirm = (selection: PickerSelection) => {
    close();
    controller.handleConfirm(selection);
  };

  const surface = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={controller.labels.closePicker}
        onPress={close}
        style={styles.scrim}
      />
      <View
        role="dialog"
        accessibilityLabel={label ?? controller.labels.openPicker}
        onLayout={(event) =>
          setMeasuredHeight(Math.ceil(event.nativeEvent.layout.height))
        }
        style={[
          styles.surface,
          VIEWPORT_CLAMP,
          {
            top: anchor?.top ?? 0,
            left: anchor?.left ?? 0,
            backgroundColor: theme.colors.surfaceContainer,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
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
    </>
  );

  return (
    <>
      <PickerField
        ref={triggerRef}
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
        onPress={openSurface}
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
      width: SURFACE_WIDTH,
      borderWidth: 1,
      borderRadius: theme.shape.large,
      zIndex: 1001,
      // M3 elevation level 3 — the field sits on surface, so the popover needs
      // a stronger shadow than the theme's default level-1 token.
      boxShadow:
        "0px 4px 8px rgba(0,0,0,0.30), 0px 8px 24px rgba(0,0,0,0.22)" as any,
    },
  });
