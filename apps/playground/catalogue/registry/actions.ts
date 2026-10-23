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
  Clipboard,
  Download,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";

/** Actions: 12 catalogue entries. */
export const actions: Record<string, ComponentMetadata> = {
  Button: {
    name: "Button",
    Component: Button,
    props: {
      children: { type: "text", default: "", label: "Label" },
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
      iconName: { type: "icon", default: "", label: "Icon Name" },
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
      children: { type: "text", default: "", label: "Label" },
      loadingLabel: { type: "text", default: "", label: "Loading label" },
      successLabel: { type: "text", default: "Done", label: "Success label" },
      errorLabel: { type: "text", default: "Try again", label: "Error label" },
      iconName: { type: "icon", default: "", label: "Icon Name" },
      successIconName: {
        type: "icon",
        default: "check",
        label: "Success icon",
      },
      errorIconName: {
        type: "icon",
        default: "alert-circle-outline",
        label: "Error icon",
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
      successDuration: {
        type: "number",
        default: 2000,
        label: "Success duration (ms, 0 = stay)",
      },
      fullWidth: { type: "boolean", default: false, label: "Full Width" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  IconButton: {
    name: "IconButton",
    Component: IconButton,
    props: {
      icon: { type: "icon", default: "", label: "Icon" },
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
      // Unset, like the component's own default: no badge.
      badge: { type: "number", default: undefined, label: "Badge (count)" },
      loading: { type: "boolean", default: false, label: "Loading" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Chip: {
    name: "Chip",
    Component: Chip,
    props: {
      label: { type: "text", default: "", label: "Label" },
      icon: { type: "icon", default: "", label: "Icon" },
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
      toneFrom: {
        type: "text",
        default: "",
        label: "Tone from (any text or #RRGGBB)",
        // Only a filled or tonal chip is tinted: an outlined one has no fill.
        appliesWhen: (values) => values.variant !== "outlined",
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
      icon: { type: "icon", default: "", label: "Icon" },
      label: {
        type: "text",
        default: "",
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
      placement: {
        type: "select",
        default: "floating",
        label: "Placement",
        options: [
          { label: "Floating", value: "floating" },
          { label: "Inline", value: "inline" },
        ],
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
      // Unset: the component folds and unfolds in 150 ms.
      duration: {
        type: "number",
        default: undefined,
        label: "Duration (ms, default 150)",
        appliesWhen: (values) => values.variant === "animated",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  SpeedDial: {
    name: "SpeedDial",
    Component: SpeedDial,
    props: {
      mainIcon: { type: "icon", default: "", label: "Main Icon" },
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
      label: { type: "text", default: "", label: "Label" },
      icon: { type: "icon", default: "", label: "Icon" },
      isFirst: { type: "boolean", default: false, label: "First in a group" },
      isLast: { type: "boolean", default: false, label: "Last in a group" },
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
      multiSelect: { type: "boolean", default: false, label: "Multi select" },
      showSelectedCheck: {
        type: "boolean",
        default: false,
        label: "Selected check",
      },
      fullWidth: { type: "boolean", default: false, label: "Full Width" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  ButtonGroup: {
    name: "ButtonGroup",
    Component: ButtonGroup,
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
    props: {
      children: { type: "text", default: "", label: "Label" },
      iconName: { type: "icon", default: "", label: "Icon Name" },
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
      menuAccessibilityLabel: {
        type: "text",
        default: "More options",
        label: "Menu label (accessibility)",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  ChipGroup: {
    name: "ChipGroup",
    Component: ChipGroup,
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
  Clipboard: {
    name: "Clipboard",
    Component: Clipboard,
    props: {
      value: { type: "text", default: "", label: "Text to copy" },
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
        default: "large",
        label: "Size",
        options: [
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ],
      },
      label: { type: "text", default: "Copy", label: "Label (accessibility)" },
      copiedLabel: {
        type: "text",
        default: "Copied",
        label: "Copied label (accessibility)",
      },
      // Unset: the check shows for 1500 ms.
      timeout: {
        type: "number",
        default: undefined,
        label: "Confirmation (ms, default 1500)",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Download: {
    name: "Download",
    Component: Download,
    props: {
      children: { type: "text", default: "", label: "Label" },
      filename: { type: "text", default: "", label: "File name" },
      mimeType: { type: "text", default: "", label: "Media type" },
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
      icon: { type: "icon", default: "download", label: "Icon" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
};
