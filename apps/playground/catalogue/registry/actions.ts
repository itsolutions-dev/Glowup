import {
  Button,
  Chip,
  FAB,
  SpeedDial,
  ToggleButtonGroup,
  IconButton,
  AnimatedFAB,
  ToggleButton,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";

/** Actions: 8 catalogue entries. */
export const actions: Record<string, ComponentMetadata> = {
  Button: {
    name: "Button",
    Component: Button,
    props: {
      children: { type: "text", default: "Click Me", label: "Label" },
      mode: {
        type: "select",
        default: "filled",
        label: "Mode",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
          { label: "Text", value: "text" },
        ],
      },
      iconName: { type: "text", default: "plus", label: "Icon Name" },
      iconPosition: {
        type: "select",
        default: "left",
        label: "Icon Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      fullWidth: { type: "boolean", default: false, label: "Full Width" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      loading: { type: "boolean", default: false, label: "Loading" },
    },
  },
  IconButton: {
    name: "IconButton",
    Component: IconButton,
    props: {
      icon: { type: "text", default: "heart-outline", label: "Icon" },
      mode: {
        type: "select",
        default: "standard",
        label: "Mode",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
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
      size: {
        type: "select",
        default: "medium",
        label: "Size",
        options: [
          { label: "Medium", value: "medium" },
          { label: "Small", value: "small" },
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
      label: { type: "text", default: "Create", label: "Label (extended)" },
      size: {
        type: "select",
        default: "regular",
        label: "Size",
        options: [
          { label: "Small", value: "small" },
          { label: "Regular", value: "regular" },
          { label: "Large", value: "large" },
          { label: "Extended", value: "extended" },
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
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  AnimatedFAB: {
    name: "AnimatedFAB",
    Component: AnimatedFAB,
    props: {
      icon: { type: "text", default: "plus", label: "Icon" },
      label: { type: "text", default: "Nuovo intervento", label: "Label" },
      extended: { type: "boolean", default: true, label: "Extended" },
      animateFrom: {
        type: "select",
        default: "right",
        label: "Animate from",
        options: [
          { label: "Right", value: "right" },
          { label: "Left", value: "left" },
        ],
      },
      iconMode: {
        type: "select",
        default: "static",
        label: "Icon mode",
        options: [
          { label: "Static", value: "static" },
          { label: "Dynamic", value: "dynamic" },
        ],
      },
      placement: {
        type: "select",
        default: "inline",
        label: "Placement",
        options: [
          { label: "Inline", value: "inline" },
          { label: "Floating", value: "floating" },
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
      label: { type: "text", default: "Griglia", label: "Label" },
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
};
