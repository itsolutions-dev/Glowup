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
} from "@its/glowup-ui";
import type { ComponentMetadata, PropDefinition } from "../types";
import { ConfirmDialogDemo, DialogDemo, FormDemo, MenuDemo } from "../demos";

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
      visible: { type: "boolean", default: false, label: "Visible" },
      message: {
        type: "text",
        default: "Changes saved.",
        label: "Message",
      },
      severity: {
        type: "select",
        // "default" is the neutral inverse surface: the stage leaves `severity` out.
        default: "default",
        label: "Severity",
        options: [
          { label: "Default", value: "default" },
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
      duration: {
        type: "number",
        default: 4000,
        label: "Duration (ms)",
        // A snackbar with a close button waits for it instead of timing out.
        appliesWhen: (values) => !values.closable,
      },
      // The stage supplies the `action` object and the `onClose` handler.
      withAction: { type: "boolean", default: true, label: "With Action" },
      closable: { type: "boolean", default: false, label: "Close Button" },
      icon: { type: "icon", default: "", label: "Icon Override" },
    },
  },
  Banner: {
    name: "Banner",
    Component: Banner,
    props: {
      visible: { type: "boolean", default: true, label: "Visible" },
      message: {
        type: "text",
        default: "Your subscription is about to expire.",
        label: "Message",
      },
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
    Demo: DialogDemo,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      title: { type: "text", default: "Dialog Title", label: "Title" },
      children: {
        type: "text",
        default: "This is the dialog body content.",
        label: "Content",
      },
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
        default: 0,
        label: "Height (px, 0 = auto)",
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
      form: { type: "boolean", default: false, label: "Form" },
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
      // The stage supplies the `slotStyles` object.
      customSlots: {
        type: "boolean",
        default: false,
        label: "Custom Slot Styles",
      },
    },
  },
  ConfirmDialog: {
    name: "ConfirmDialog",
    Component: ConfirmDialog,
    Demo: ConfirmDialogDemo,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      title: { type: "text", default: "Delete item?", label: "Title" },
      message: {
        type: "text",
        default: "This action cannot be undone.",
        label: "Message",
      },
      confirmText: { type: "text", default: "Delete", label: "Confirm Text" },
      cancelText: { type: "text", default: "Cancel", label: "Cancel Text" },
      destructive: { type: "boolean", default: false, label: "Destructive" },
      icon: { type: "icon", default: "", label: "Hero Icon" },
      dismissable: { type: "boolean", default: true, label: "Dismissable" },
      // The stage supplies the `slotStyles` object.
      customSlots: {
        type: "boolean",
        default: false,
        label: "Custom Slot Styles",
      },
    },
  },
  Form: {
    name: "Form",
    Component: Form,
    Demo: FormDemo,
    // `onSubmit` is the demo's: it shows what the submission carried.
    props: {},
  },
  Popover: {
    name: "Popover",
    Component: Popover,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      anchorPosition,
      matchAnchorWidth: {
        type: "boolean",
        default: false,
        label: "Match Anchor Width",
      },
    },
  },
  BottomSheet: {
    name: "BottomSheet",
    Component: BottomSheet,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      title: { type: "text", default: "Sheet Title", label: "Title" },
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
      // The stage supplies the `actions` row.
      withActions: { type: "boolean", default: false, label: "With Actions" },
    },
  },
  Menu: {
    name: "Menu",
    Component: Menu,
    Demo: MenuDemo,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      closeOnSelect: {
        type: "boolean",
        default: true,
        label: "Close On Select",
      },
      anchorPosition,
      dividers: { type: "boolean", default: false, label: "Dividers" },
      selected: {
        type: "select",
        // Not even `[]`: items are not marked until the prop is passed.
        default: undefined,
        label: "Selected",
        options: [
          { label: "None", value: undefined },
          { label: "Edit", value: ["edit"] },
          { label: "Edit And Duplicate", value: ["edit", "duplicate"] },
          { label: "Delete", value: ["delete"] },
        ],
      },
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
      width: { type: "number", default: 200, label: "Width" },
      height: { type: "number", default: 48, label: "Height" },
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
      // Unset, the ring spins: the stage leaves `progress` out when this is on.
      indeterminate: {
        type: "boolean",
        default: false,
        label: "Indeterminate",
      },
      progress: {
        type: "number",
        default: 0.65,
        label: "Progress (0-1)",
        appliesWhen: (values) => !values.indeterminate,
      },
      label: { type: "text", default: "65%", label: "Label" },
      labelPosition: {
        type: "select",
        // The library's own default for a ring with a `progress`.
        default: "center",
        label: "Label Position",
        options: [
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
      duration: { type: "number", default: 1000, label: "Duration (ms)" },
      color: { type: "text", default: "", label: "Color" },
    },
  },
  LinearProgress: {
    name: "LinearProgress",
    Component: LinearProgress,
    props: {
      progress: {
        type: "number",
        default: 0.6,
        label: "Progress (0-1)",
        // The indeterminate bar reports no value, to the eye or to a11y.
        appliesWhen: (values) => !values.indeterminate,
      },
      indeterminate: {
        type: "boolean",
        default: false,
        label: "Indeterminate",
      },
      label: { type: "text", default: "60%", label: "Label" },
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
      width: { type: "text", default: "100%", label: "Width" },
      // Empty is the library's own: 4, or 20 for an inside label.
      height: { type: "number", default: undefined, label: "Height" },
      color: { type: "text", default: "", label: "Color" },
      trackColor: { type: "text", default: "", label: "Track Color" },
    },
  },
  EmptyState: {
    name: "EmptyState",
    Component: EmptyState,
    props: {
      icon: { type: "icon", default: "inbox-outline", label: "Icon" },
      title: { type: "text", default: "No items yet", label: "Title" },
      description: {
        type: "text",
        default: "Items you add will show up here.",
        label: "Description",
      },
    },
  },
  Toast: {
    name: "Toast",
    Component: Button,
    props: {
      message: { type: "text", default: "Changes saved", label: "Message" },
      duration: { type: "number", default: 4000, label: "Duration (ms)" },
      withAction: { type: "boolean", default: false, label: "With action" },
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
    },
  },
  Portal: {
    name: "Portal",
    Component: Portal,
    props: {},
  },
};
