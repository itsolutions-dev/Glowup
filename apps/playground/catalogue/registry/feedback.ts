import {
  Button,
  Menu,
  BottomSheet,
  Skeleton,
  Banner,
  EmptyState,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Dialog,
  ConfirmDialog,
  Form,
  Popover,
  Collapse,
  Portal,
  AlertDialog,
  HoverCard,
} from "@its/glowup-ui";
import type { ComponentMetadata, PropDefinition } from "../types";

const titleCase = (word: string) => word[0].toUpperCase() + word.slice(1);

/**
 * The nine `anchorPosition`s of Popover and Menu as one control. The prop is an
 * object, so each option carries one, and the panel compares values by identity
 * (as it does against `default`): the default below is the first option's own.
 */
const ANCHOR_POSITIONS = (["bottom", "top", "center"] as const).flatMap(
  (vertical) =>
    (["left", "center", "right"] as const).map((horizontal) => ({
      label: `${titleCase(vertical)} ${titleCase(horizontal)}`,
      value: { vertical, horizontal },
    })),
);

const anchorPosition: PropDefinition = {
  type: "select",
  default: ANCHOR_POSITIONS[0].value,
  label: "Anchor Position",
  options: ANCHOR_POSITIONS,
};

/** Feedback: 15 catalogue entries. */
export const feedback: Record<string, ComponentMetadata> = {
  Snackbar: {
    name: "Snackbar",
    Component: Snackbar,
    props: {
      message: { type: "text", default: "", label: "Message" },
      severity: {
        type: "select",
        // Left out, the snackbar is the neutral inverse surface.
        default: undefined,
        label: "Severity",
        options: [
          { label: "Default", value: undefined },
          { label: "Success", value: "success" },
          { label: "Info", value: "info" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
        ],
      },
      variant: {
        type: "select",
        default: "contained",
        label: "Variant",
        options: [
          { label: "Contained", value: "contained" },
          { label: "Outlined", value: "outlined" },
        ],
      },
      position: {
        type: "select",
        default: "bottom-center",
        label: "Position",
        options: [
          { label: "Top Left", value: "top-left" },
          { label: "Top Center", value: "top-center" },
          { label: "Top Right", value: "top-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Bottom Center", value: "bottom-center" },
          { label: "Bottom Right", value: "bottom-right" },
        ],
      },
      duration: { type: "number", default: 4000, label: "Duration (ms)" },
      icon: { type: "icon", default: "", label: "Icon Override" },
    },
  },
  Banner: {
    name: "Banner",
    Component: Banner,
    props: {
      message: { type: "text", default: "", label: "Message" },
      icon: { type: "icon", default: "", label: "Icon Override" },
      type: {
        type: "select",
        default: "default",
        label: "Type",
        options: [
          { label: "Default", value: "default" },
          { label: "Info", value: "info" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
        ],
      },
      dismissable: { type: "boolean", default: false, label: "Dismissable" },
    },
  },
  Dialog: {
    name: "Dialog",
    Component: Dialog,
    props: {
      title: { type: "text", default: "", label: "Title" },
      children: { type: "text", default: "", label: "Body" },
      icon: { type: "icon", default: "", label: "Hero Icon" },
      width: {
        type: "select",
        default: "md",
        label: "Width",
        options: [
          { label: "XS (360)", value: "xs" },
          { label: "SM (480)", value: "sm" },
          { label: "MD (560)", value: "md" },
          { label: "LG (800)", value: "lg" },
        ],
        // The full-screen dialog fills the window.
        appliesWhen: (values) => !values.fullScreen,
      },
      height: {
        type: "number",
        // Empty is the library's own: as tall as the content.
        default: undefined,
        label: "Height (px)",
        appliesWhen: (values) => !values.fullScreen,
      },
      scrollable: {
        type: "boolean",
        default: false,
        label: "Scrollable Body",
        // The full-screen body always scrolls.
        appliesWhen: (values) => !values.fullScreen,
      },
      fullScreen: { type: "boolean", default: false, label: "Full Screen" },
      closeIcon: {
        type: "select",
        default: "close",
        label: "Close Icon",
        options: [
          { label: "Close", value: "close" },
          { label: "Close Circle", value: "close-circle-outline" },
          // Hidden, the dialog falls back to a text button (Close Text).
          { label: "Hidden", value: false },
        ],
      },
      closeText: { type: "text", default: "Close", label: "Close Text" },
      disableEscapeKeyDown: {
        type: "boolean",
        default: false,
        label: "Disable Escape Key",
      },
      disableBackdropClick: {
        type: "boolean",
        default: false,
        label: "Disable Backdrop Click",
        // The full-screen dialog has no backdrop.
        appliesWhen: (values) => !values.fullScreen,
      },
      animationType: {
        type: "select",
        default: "fade",
        label: "Animation",
        options: [
          { label: "Fade", value: "fade" },
          { label: "Slide", value: "slide" },
          { label: "None", value: "none" },
        ],
      },
    },
  },
  ConfirmDialog: {
    name: "ConfirmDialog",
    Component: ConfirmDialog,
    props: {
      title: { type: "text", default: "", label: "Title" },
      message: { type: "text", default: "", label: "Message" },
      confirmText: { type: "text", default: "Confirm", label: "Confirm Text" },
      cancelText: { type: "text", default: "Cancel", label: "Cancel Text" },
      destructive: { type: "boolean", default: false, label: "Destructive" },
      icon: { type: "icon", default: "", label: "Hero Icon" },
      dismissable: { type: "boolean", default: true, label: "Dismissable" },
    },
  },
  AlertDialog: {
    name: "AlertDialog",
    Component: AlertDialog,
    props: {
      title: { type: "text", default: "", label: "Title" },
      message: { type: "text", default: "", label: "Message" },
      severity: {
        type: "select",
        default: undefined,
        label: "Severity",
        options: [
          { label: "None", value: undefined },
          { label: "Info", value: "info" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
        ],
      },
      actionText: { type: "text", default: "OK", label: "Action Text" },
      cancelText: { type: "text", default: "", label: "Cancel Text" },
      destructive: { type: "boolean", default: false, label: "Destructive" },
      loading: { type: "boolean", default: false, label: "Loading" },
      disableBackdropClick: {
        type: "boolean",
        default: true,
        label: "Disable Backdrop Click",
      },
      disableEscapeKeyDown: {
        type: "boolean",
        default: true,
        label: "Disable Escape Key",
      },
    },
  },
  Form: {
    name: "Form",
    Component: Form,
    props: {
      validateOn: {
        type: "select",
        default: "change",
        label: "Validate On",
        options: [
          { label: "Change", value: "change" },
          { label: "Blur", value: "blur" },
          { label: "Submit", value: "submit" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Popover: {
    name: "Popover",
    Component: Popover,
    props: {
      anchorPosition,
      matchAnchorWidth: {
        type: "boolean",
        default: false,
        label: "Match Anchor Width",
      },
    },
  },
  HoverCard: {
    name: "HoverCard",
    Component: HoverCard,
    props: {
      placement: {
        type: "select",
        default: "bottom",
        label: "Placement",
        options: [
          { label: "Bottom", value: "bottom" },
          { label: "Top", value: "top" },
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        // An anchor position replaces it.
        appliesWhen: (values) => !values.anchorPosition,
      },
      anchorPosition: {
        ...anchorPosition,
        // Unset, like the component's own default: `placement` decides.
        default: undefined,
        options: [
          { label: "None (use placement)", value: undefined },
          ...ANCHOR_POSITIONS,
        ],
      },
      openDelay: { type: "number", default: 300, label: "Open Delay (ms)" },
      closeDelay: { type: "number", default: 150, label: "Close Delay (ms)" },
      width: { type: "number", default: 280, label: "Width (px)" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  BottomSheet: {
    name: "BottomSheet",
    Component: BottomSheet,
    props: {
      title: { type: "text", default: "", label: "Title" },
      showCloseButton: {
        type: "boolean",
        default: false,
        label: "Show Close Button",
      },
      showHandle: { type: "boolean", default: true, label: "Show Handle" },
      dismissOnScrimTap: {
        type: "boolean",
        default: true,
        label: "Dismiss On Scrim Tap",
      },
      maxHeightRatio: {
        type: "number",
        default: 0.85,
        label: "Max Height (0-1)",
      },
    },
  },
  Menu: {
    name: "Menu",
    Component: Menu,
    props: {
      closeOnSelect: {
        type: "boolean",
        default: true,
        label: "Close On Select",
      },
      anchorPosition,
      dividers: { type: "boolean", default: false, label: "Dividers" },
    },
  },
  Skeleton: {
    name: "Skeleton",
    Component: Skeleton,
    props: {
      variant: {
        type: "select",
        default: "rect",
        label: "Variant",
        options: [
          { label: "Rect", value: "rect" },
          { label: "Circle", value: "circle" },
          { label: "Text", value: "text" },
        ],
      },
      // Empty is the library's own: the variant's (a rect is 100% x 48).
      width: { type: "number", default: undefined, label: "Width" },
      height: { type: "number", default: undefined, label: "Height" },
      borderRadius: {
        type: "number",
        default: undefined,
        label: "Border Radius",
      },
      duration: {
        type: "number",
        default: 1200,
        label: "Duration (ms)",
        // A static placeholder has no pulse to time.
        appliesWhen: (values) => !!values.animate,
      },
      animate: { type: "boolean", default: true, label: "Animate" },
    },
  },
  CircularProgress: {
    name: "CircularProgress",
    Component: CircularProgress,
    props: {
      // Empty, the ring spins (indeterminate): the field is the switch.
      progress: {
        type: "number",
        default: undefined,
        label: "Progress (0-1, empty spins)",
      },
      label: { type: "text", default: "", label: "Label" },
      labelPosition: {
        type: "select",
        // Left out, the library picks: center for a ring, right for a spinner.
        default: undefined,
        label: "Label Position",
        options: [
          { label: "Auto", value: undefined },
          { label: "Center", value: "center" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      trackColor: {
        type: "select",
        // Unset: a ring has its usual track and a spinner none.
        default: undefined,
        label: "Track",
        options: [
          { label: "Default", value: undefined },
          { label: "Indicator Tint", value: true },
          { label: "None", value: false },
        ],
      },
      size: { type: "number", default: 48, label: "Size" },
      strokeWidth: { type: "number", default: 4, label: "Stroke Width" },
      duration: {
        type: "number",
        default: 1000,
        label: "Duration (ms)",
        // One revolution of the spinner: a ring with a progress does not turn.
        appliesWhen: (values) => values.progress === undefined,
      },
      color: { type: "text", default: "", label: "Color" },
      decorative: { type: "boolean", default: false, label: "Decorative" },
      accessibilityLabel: {
        type: "text",
        default: "",
        label: "Accessibility Label",
      },
    },
  },
  LinearProgress: {
    name: "LinearProgress",
    Component: LinearProgress,
    props: {
      progress: {
        type: "number",
        default: 0,
        label: "Progress (0-1)",
        // The indeterminate bar reports no value, to the eye or to a11y.
        appliesWhen: (values) => !values.indeterminate,
      },
      indeterminate: {
        type: "boolean",
        default: false,
        label: "Indeterminate",
      },
      label: { type: "text", default: "", label: "Label" },
      labelPosition: {
        type: "select",
        default: "right",
        label: "Label Position",
        options: [
          { label: "Right", value: "right" },
          { label: "Left", value: "left" },
          { label: "Top Left", value: "top-left" },
          { label: "Top Center", value: "top-center" },
          { label: "Top Right", value: "top-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Bottom Center", value: "bottom-center" },
          { label: "Bottom Right", value: "bottom-right" },
          { label: "Inside", value: "inside" },
        ],
      },
      width: { type: "text", default: "100%", label: "Width (e.g. 50%)" },
      // Empty is the library's own: 4, or 20 for an inside label.
      height: { type: "number", default: undefined, label: "Height" },
      color: { type: "text", default: "", label: "Color" },
      trackColor: { type: "text", default: "", label: "Track Color" },
      decorative: { type: "boolean", default: false, label: "Decorative" },
    },
  },
  EmptyState: {
    name: "EmptyState",
    Component: EmptyState,
    props: {
      icon: { type: "icon", default: "inbox-outline", label: "Icon" },
      title: { type: "text", default: "", label: "Title" },
      description: { type: "text", default: "", label: "Description" },
    },
  },
  Toast: {
    name: "Toast",
    Component: Button,
    // Not a component, so no props table: these are the options of
    // `toast.show`, which the example spreads into the call.
    props: {
      message: { type: "text", default: "", label: "Message" },
      severity: {
        type: "select",
        // Left out, the toast is the neutral inverse surface.
        default: undefined,
        label: "Severity",
        options: [
          { label: "Default", value: undefined },
          { label: "Success", value: "success" },
          { label: "Info", value: "info" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
        ],
      },
      variant: {
        type: "select",
        default: "contained",
        label: "Variant",
        options: [
          { label: "Contained", value: "contained" },
          { label: "Outlined", value: "outlined" },
        ],
      },
      position: {
        type: "select",
        // The provider's own default.
        default: "bottom-center",
        label: "Position",
        options: [
          { label: "Top Left", value: "top-left" },
          { label: "Top Center", value: "top-center" },
          { label: "Top Right", value: "top-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Bottom Center", value: "bottom-center" },
          { label: "Bottom Right", value: "bottom-right" },
        ],
      },
      duration: { type: "number", default: 4000, label: "Duration (ms)" },
      icon: { type: "icon", default: "", label: "Icon Override" },
    },
  },
  Collapse: {
    name: "Collapse",
    Component: Collapse,
    props: {
      collapsedHeight: {
        type: "number",
        default: 0,
        label: "Collapsed Height",
      },
      duration: { type: "number", default: 200, label: "Duration (ms)" },
      animateOpacity: { type: "boolean", default: true, label: "Fade" },
      keepMounted: { type: "boolean", default: false, label: "Keep Mounted" },
    },
  },
  Portal: {
    name: "Portal",
    Component: Portal,
    props: {},
  },
};
