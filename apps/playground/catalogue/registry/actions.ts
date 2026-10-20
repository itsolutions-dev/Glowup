import {
  Button,
  ProgressButton,
  Chip,
  FAB,
  SpeedDial,
  ToggleButtonGroup,
  IconButton,
  ToggleButton,
  ButtonGroup,
  SplitButton,
  ChipGroup,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";
import { ButtonGroupDemo, SplitButtonDemo, ChipGroupDemo } from "../demos";

/** Actions: 12 catalogue entries. */
export const actions: Record<string, ComponentMetadata> = {
  Button: {
    name: "Button",
    Component: Button,
    props: {
      children: { type: "text", default: "Click Me", label: "Label" },
      variant: {
        type: "select",
        default: "filled",
        label: "Variant",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
          { label: "Text", value: "text" },
        ],
      },
      color: {
        type: "select",
        default: "primary",
        label: "Color",
        options: [
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Tertiary", value: "tertiary" },
          { label: "Error", value: "error" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Info", value: "info" },
          { label: "Neutral", value: "neutral" },
        ],
      },
      iconName: { type: "text", default: "plus", label: "Icon Name" },
      iconPosition: {
        type: "select",
        default: "start",
        label: "Icon Position",
        options: [
          { label: "Start", value: "start" },
          { label: "End", value: "end" },
        ],
      },
      fullWidth: { type: "boolean", default: false, label: "Full Width" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      loading: { type: "boolean", default: false, label: "Loading" },
    },
  },
  ProgressButton: {
    name: "ProgressButton",
    Component: ProgressButton,
    props: {
      children: {
        type: "text",
        default: "Start navigation",
        label: "Label",
      },
      status: {
        type: "select",
        default: "idle",
        label: "Status",
        options: [
          { label: "Idle", value: "idle" },
          { label: "Loading", value: "loading" },
          { label: "Success", value: "success" },
          { label: "Error", value: "error" },
        ],
      },
      progress: {
        type: "number",
        // Unset, like the component's own default: an indeterminate sweep.
        default: undefined,
        label: "Progress (0-1, empty = indeterminate)",
        appliesWhen: (values) => values.status === "loading",
      },
      loadingLabel: {
        type: "text",
        // Empty falls back to the label, which is what the component does
        // without one — so the snippet only writes it once it says something.
        default: "",
        label: "Loading label",
        appliesWhen: (values) => values.status === "loading",
      },
      successLabel: {
        type: "text",
        default: "Done",
        label: "Success label",
      },
      errorLabel: {
        type: "text",
        default: "Try again",
        label: "Error label",
      },
      indicator: {
        type: "select",
        default: "fill",
        label: "Indicator",
        options: [
          { label: "Fill", value: "fill" },
          { label: "Bar", value: "bar" },
        ],
      },
      variant: {
        type: "select",
        default: "filled",
        label: "Variant",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
          { label: "Text", value: "text" },
        ],
      },
      iconName: {
        type: "text",
        default: "",
        label: "Icon Name",
      },
      fullWidth: { type: "boolean", default: false, label: "Full Width" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  IconButton: {
    name: "IconButton",
    Component: IconButton,
    props: {
      icon: { type: "text", default: "heart-outline", label: "Icon" },
      title: { type: "text", default: "", label: "Title (tooltip)" },
      variant: {
        type: "select",
        default: "standard",
        label: "Variant",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
        ],
      },
      color: {
        type: "select",
        default: "",
        label: "Color",
        options: [
          { label: "Default", value: "" },
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Tertiary", value: "tertiary" },
          { label: "Error", value: "error" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Info", value: "info" },
          { label: "Neutral", value: "neutral" },
        ],
      },
      size: {
        type: "select",
        default: "medium",
        label: "Size",
        options: [
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ],
      },
      selected: { type: "boolean", default: false, label: "Selected" },
      loading: { type: "boolean", default: false, label: "Loading" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Chip: {
    name: "Chip",
    Component: Chip,
    props: {
      label: { type: "text", default: "React Native", label: "Label" },
      selected: { type: "boolean", default: false, label: "Selected" },
      variant: {
        type: "select",
        default: "filled",
        label: "Variant",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
        ],
      },
      color: {
        type: "select",
        default: "",
        label: "Color",
        options: [
          { label: "Default", value: "" },
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Tertiary", value: "tertiary" },
          { label: "Error", value: "error" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Info", value: "info" },
          { label: "Neutral", value: "neutral" },
        ],
      },
      size: {
        type: "select",
        default: "medium",
        label: "Size",
        options: [
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ],
      },
      border: {
        type: "select",
        default: "rounded",
        label: "Border",
        options: [
          { label: "Rounded", value: "rounded" },
          { label: "Squared", value: "squared" },
          { label: "Circular", value: "circular" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  FAB: {
    name: "FAB",
    Component: FAB,
    props: {
      icon: { type: "text", default: "plus", label: "Icon" },
      label: {
        type: "text",
        default: "Create",
        label: "Label (extended, animated)",
      },
      variant: {
        type: "select",
        default: "icon",
        label: "Variant",
        options: [
          { label: "Icon", value: "icon" },
          { label: "Extended", value: "extended" },
          { label: "Animated", value: "animated" },
        ],
      },
      size: {
        type: "select",
        default: "medium",
        label: "Size",
        options: [
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ],
      },
      extended: {
        type: "boolean",
        default: true,
        label: "Extended",
        appliesWhen: (values) => values.variant === "animated",
      },
      animateFrom: {
        type: "select",
        default: "right",
        label: "Animate from",
        options: [
          { label: "Right", value: "right" },
          { label: "Left", value: "left" },
        ],
        appliesWhen: (values) => values.variant === "animated",
      },
      iconMode: {
        type: "select",
        default: "static",
        label: "Icon mode",
        options: [
          { label: "Static", value: "static" },
          { label: "Dynamic", value: "dynamic" },
        ],
        appliesWhen: (values) => values.variant === "animated",
      },
      position: {
        type: "select",
        default: "bottom-right",
        label: "Position",
        options: [
          { label: "Bottom Right", value: "bottom-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Top Right", value: "top-right" },
          { label: "Top Left", value: "top-left" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  SpeedDial: {
    name: "SpeedDial",
    Component: SpeedDial,
    props: {
      mainIcon: { type: "text", default: "plus", label: "Main Icon" },
      position: {
        type: "select",
        default: "bottom-right",
        label: "Position",
        options: [
          { label: "Bottom Right", value: "bottom-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Top Right", value: "top-right" },
          { label: "Top Left", value: "top-left" },
        ],
      },
    },
  },
  ToggleButton: {
    name: "ToggleButton",
    Component: ToggleButton,
    props: {
      active: { type: "boolean", default: true, label: "Active" },
      label: { type: "text", default: "Grid", label: "Label" },
      icon: { type: "text", default: "view-grid-outline", label: "Icon" },
      showSelectedCheck: {
        type: "boolean",
        default: false,
        label: "Selected check",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  ToggleButtonGroup: {
    name: "ToggleButtonGroup",
    Component: ToggleButtonGroup,
    props: {
      value: { type: "text", default: "list", label: "Value" },
    },
  },
  ButtonGroup: {
    name: "ButtonGroup",
    Component: ButtonGroup,
    Demo: ButtonGroupDemo,
    props: {
      type: {
        type: "select",
        default: "standard",
        label: "Type",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Connected", value: "connected" },
        ],
      },
      mode: {
        type: "select",
        default: "tonal",
        label: "Unselected look",
        options: [
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
        ],
      },
      size: {
        type: "select",
        default: "s",
        label: "Size",
        options: [
          { label: "Extra small", value: "xs" },
          { label: "Small", value: "s" },
          { label: "Medium", value: "m" },
        ],
      },
      multiSelect: { type: "boolean", default: false, label: "Multi select" },
    },
  },
  SplitButton: {
    name: "SplitButton",
    Component: SplitButton,
    Demo: SplitButtonDemo,
    props: {
      children: { type: "text", default: "Save", label: "Label" },
      mode: {
        type: "select",
        default: "filled",
        label: "Mode",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  ChipGroup: {
    name: "ChipGroup",
    Component: ChipGroup,
    Demo: ChipGroupDemo,
    props: {
      multiple: { type: "boolean", default: false, label: "Multiple" },
      required: {
        type: "boolean",
        default: false,
        label: "Required",
        appliesWhen: (values) => !values.multiple,
      },
      wrap: { type: "boolean", default: true, label: "Wrap" },
      variant: {
        type: "select",
        default: "outlined",
        label: "Variant",
        options: [
          { label: "Outlined", value: "outlined" },
          { label: "Tonal", value: "tonal" },
          { label: "Filled", value: "filled" },
        ],
      },
    },
  },
};
