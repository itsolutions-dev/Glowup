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
  Modal,
  ConfirmDialog,
  Popover,
  Collapse,
  Portal,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";

/** Feedback: 14 catalogue entries. */
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
      type: {
        type: "select",
        default: "default",
        label: "Type",
        options: [
          { label: "Default", value: "default" },
          { label: "Success", value: "success" },
          { label: "Error", value: "error" },
        ],
      },
      duration: { type: "number", default: 4000, label: "Duration (ms)" },
      icon: { type: "text", default: "", label: "Icon Override" },
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
  Modal: {
    name: "Modal",
    Component: Modal,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      title: { type: "text", default: "Dialog Title", label: "Title" },
      children: {
        type: "text",
        default: "This is the modal body content.",
        label: "Content",
      },
      closeText: { type: "text", default: "Close", label: "Close Text" },
      icon: { type: "text", default: "", label: "Hero icon" },
      dismissable: { type: "boolean", default: true, label: "Dismissable" },
      scrollable: { type: "boolean", default: false, label: "Scrollable body" },
    },
  },
  ConfirmDialog: {
    name: "ConfirmDialog",
    Component: ConfirmDialog,
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
    },
  },
  Popover: {
    name: "Popover",
    Component: Popover,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
    },
  },
  BottomSheet: {
    name: "BottomSheet",
    Component: BottomSheet,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      title: { type: "text", default: "Sheet Title", label: "Title" },
      showHandle: { type: "boolean", default: true, label: "Show Handle" },
      dismissOnScrimTap: {
        type: "boolean",
        default: true,
        label: "Dismiss On Scrim Tap",
      },
    },
  },
  Menu: {
    name: "Menu",
    Component: Menu,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      closeOnSelect: {
        type: "boolean",
        default: true,
        label: "Close On Select",
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
      height: { type: "number", default: 4, label: "Height" },
      color: { type: "text", default: "", label: "Color" },
    },
  },
  EmptyState: {
    name: "EmptyState",
    Component: EmptyState,
    props: {
      icon: { type: "text", default: "inbox-outline", label: "Icon" },
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
