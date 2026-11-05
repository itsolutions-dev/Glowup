import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { View, Pressable, StyleSheet, ViewStyle } from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import PickerField from "./DateTimePicker.field";
import PickerDialog from "./DateTimePicker.dialog";
import PickerSurface, { StaticPicker } from "./DateTimePicker.surface";
import { usePickerParts } from "./DateTimePicker.hooks";
import {
  DateTimePickerPresentation,
  DateTimePickerProps,
} from "./DateTimePicker.shared";
import { useEscapeKey } from "./internal/useEscapeKey";
import { useWindowWidth } from "./internal/useWindowWidth";
import {
  placeBesideAnchor,
  planPopoverHeight,
  Placement,
} from "./internal/popoverPlacement";

/** M3 docked-picker width; matches the dialog so the two agree. */
const SURFACE_WIDTH = 328;
/**
 * Only used for the very first frame, before the surface has been measured: the
 * height of the date step.
 */
const ESTIMATED_HEIGHT = 431;
/**
 * The date-and-time picker is about 431 px tall on its date step and 555 on its
 * time step, which it moves to by itself. Placing it for the first height would
 * leave the second one cut off, so it is placed for the taller.
 */
const DATETIME_HEIGHT = 560;
const GAP = 6;
const MARGIN = 8;
/** The top of M3's compact window class: narrower than this opens the dialog. */
const COMPACT_WIDTH = 600;

/**
 * Whether this opening should be the dialog: asked for, or a touch device (no
 * fine pointer, as in Material UI's own responsive pickers), or a viewport too
 * narrow to dock a 328 px card beside a field. The viewport is `width`, which a
 * `ViewportProvider` can set to something other than the window's. Evaluated
 * when the picker opens, not while rendering, so server rendering never touches
 * `window`.
 */
const wantsDialog = (
  width: number,
  presentation: DateTimePickerPresentation = "auto",
) => {
  if (presentation !== "auto") return presentation === "dialog";
  const finePointer = window.matchMedia?.("(pointer: fine)")?.matches ?? true;
  return width < COMPACT_WIDTH || !finePointer;
};

/**
 * A surface taller than the room beside the field scrolls instead of moving
 * over it. CSS-only, hence the cast past the react-native style typings.
 */
const SCROLLS = { overflowY: "auto" } as unknown as ViewStyle;

const NO_SUBSCRIPTION = () => () => {};
const ON_CLIENT = () => true;
const ON_SERVER = () => false;

/**
 * The field and its picker: the `default` variant. On a mouse the surface is
 * docked to the field; on a touch device or a narrow window it opens as a
 * dialog, the same card the native pickers use. Tapping outside or pressing
 * Escape dismisses either.
 */
const PopupPicker = (props: DateTimePickerProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const viewportWidth = useWindowWidth();
  const { controller, open, setOpen, close, fieldProps, surfaceProps } =
    usePickerParts(props);

  const triggerRef = useRef<View>(null);
  const surfaceRef = useRef<View>(null);
  const [asDialog, setAsDialog] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  // The surface's height when it opened. Where the popover goes is worked out
  // from this (and `DATETIME_HEIGHT`) alone: the height changes as the user
  // moves between the date and the time, and a popover that re-placed itself
  // on every change would jump about the page under the pointer.
  const [openHeight, setOpenHeight] = useState<number | null>(null);

  const reposition = useCallback(() => {
    const element = triggerRef.current as unknown as HTMLElement | null;
    if (!element?.getBoundingClientRect) return;
    const view = { width: window.innerWidth, height: window.innerHeight };
    // Planned with a little slack: a hovered button grows by a border and the
    // surface must not start to scroll for it (see `planPopoverHeight`).
    const planned = planPopoverHeight(
      openHeight ?? ESTIMATED_HEIGHT,
      props.mode === "datetime" ? DATETIME_HEIGHT : 0,
      view.height,
      MARGIN,
    );
    const next = placeBesideAnchor(
      element.getBoundingClientRect(),
      view,
      {
        width: SURFACE_WIDTH,
        height: planned,
      },
      GAP,
      MARGIN,
    );
    // Until measured the surface is laid out in full, so it has a height to report.
    setPlacement(
      openHeight === null
        ? { ...next, maxHeight: view.height - MARGIN * 2 }
        : next,
    );
  }, [openHeight, props.mode]);

  // A static export prerenders in Node: no `document`, and react-dom's server
  // renderer has no portals. A picker seeded open (`defaultOpen`) portals its
  // popover only in the browser; the server snapshot also holds while the page
  // hydrates, so the first client render matches the prerendered html.
  const inBrowser = useSyncExternalStore(NO_SUBSCRIPTION, ON_CLIENT, ON_SERVER);

  const popoverOpen = open && !asDialog && inBrowser;

  useEffect(() => {
    if (!popoverOpen) return;
    reposition();
    // `position: fixed` coordinates go stale the moment the page scrolls, so
    // follow scroll (capture phase, to catch nested scrollers) and resize. The
    // surface's own scrolling, in the calendar or in a tall surface, moves
    // nothing and is left alone.
    const onScroll = (event: Event) => {
      const surface = surfaceRef.current as unknown as HTMLElement | null;
      if (
        surface &&
        event.target instanceof Node &&
        surface.contains(event.target)
      )
        return;
      reposition();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", reposition);
    };
  }, [popoverOpen, reposition]);

  // Escape lives here rather than in Calendar so a single owner closes the
  // surface in every mode, `time` included (which renders no Calendar).
  useEscapeKey(open, close);

  const openSurface = () => {
    if (props.disabled) return;
    controller.resetInput();
    setAsDialog(wantsDialog(viewportWidth, props.presentation));
    setOpenHeight(null);
    setPlacement(null);
    setOpen(true);
  };

  const popover = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={controller.labels.closePicker}
        onPress={close}
        style={styles.scrim}
      />
      <View
        ref={surfaceRef}
        role="dialog"
        accessibilityLabel={props.label ?? controller.labels.openPicker}
        onLayout={() => {
          // Only the first measurement counts: see `openHeight`. Read off the
          // element, not the event: react-native-web reports `offsetHeight`,
          // which rounds to the nearest pixel, and a 430.3 px surface placed in
          // a 430 px box scrolls by the odd 0.3.
          const element = surfaceRef.current as unknown as HTMLElement | null;
          const height = element?.getBoundingClientRect().height;
          if (height) setOpenHeight((known) => known ?? Math.ceil(height));
        }}
        style={[
          styles.surface,
          SCROLLS,
          {
            ...placement,
            left: placement?.left ?? 0,
            maxHeight: placement?.maxHeight,
            // Hidden for the frame before it is measured and placed.
            opacity: openHeight === null ? 0 : 1,
            backgroundColor: theme.colors.surfaceContainer,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <PickerSurface {...surfaceProps} />
      </View>
    </>
  );

  return (
    <>
      <PickerField {...fieldProps} ref={triggerRef} onClick={openSurface} />
      {popoverOpen && createPortal(popover, document.body)}
      <PickerDialog
        visible={open && asDialog}
        onClose={close}
        closeLabel={controller.labels.closePicker}
      >
        <PickerSurface {...surfaceProps} />
      </PickerDialog>
    </>
  );
};

/**
 * Material 3 date / time / date-time picker, docked to its field on a mouse
 * and a dialog on a touch device or a narrow window. `variant="static"` draws
 * the picker inline instead of behind a field.
 */
const DateTimePicker = (props: DateTimePickerProps) =>
  props.variant === "static" ? (
    <StaticPicker {...props} />
  ) : (
    <PopupPicker {...props} />
  );

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
