import {
  Typography,
  Card,
  Divider,
  Paper,
  CardActions,
  CardContent,
  CardCover,
  CardTitle,
  Icon,
  TouchableRipple,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";

/** Foundations: 10 catalogue entries. */
export const foundations: Record<string, ComponentMetadata> = {
  Typography: {
    name: "Typography",
    Component: Typography,
    props: {
      children: {
        type: "text",
        default: "The quick brown fox",
        label: "Text",
      },
      variant: {
        type: "select",
        default: "body1",
        label: "Variant",
        options: [
          { label: "h1", value: "h1" },
          { label: "h2", value: "h2" },
          { label: "h3", value: "h3" },
          { label: "h4", value: "h4" },
          { label: "h5", value: "h5" },
          { label: "h6", value: "h6" },
          { label: "subtitle1", value: "subtitle1" },
          { label: "subtitle2", value: "subtitle2" },
          { label: "body1", value: "body1" },
          { label: "body2", value: "body2" },
          { label: "button", value: "button" },
          { label: "caption", value: "caption" },
          { label: "overline", value: "overline" },
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
          { label: "On surface variant", value: "onSurfaceVariant" },
        ],
      },
      fontSize: { type: "number", default: undefined, label: "Font size" },
      align: {
        type: "select",
        default: "left",
        label: "Align",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
          { label: "Justify", value: "justify" },
        ],
      },
      nowrap: { type: "boolean", default: false, label: "No wrap" },
    },
  },
  Divider: {
    name: "Divider",
    Component: Divider,
    isContainer: true,
    props: {
      orientation: {
        type: "select",
        default: "horizontal",
        label: "Orientation",
        options: [
          { label: "Horizontal", value: "horizontal" },
          { label: "Vertical", value: "vertical" },
        ],
      },
      thickness: { type: "number", default: 1, label: "Thickness" },
      inset: { type: "number", default: 0, label: "Inset" },
      children: {
        type: "text",
        default: "OR",
        label: "Label",
        // Horizontal only — a vertical rule takes no label.
        appliesWhen: (values) => values.orientation !== "vertical",
      },
    },
  },
  Paper: {
    name: "Paper",
    Component: Paper,
    isContainer: true,
    props: {
      elevation: { type: "number", default: 1, label: "Elevation (0-5)" },
      outline: { type: "boolean", default: false, label: "Outline" },
      glow: { type: "boolean", default: false, label: "Glow" },
      children: {
        type: "text",
        default: "Elevated surface content",
        label: "Content",
      },
    },
  },
  Card: {
    name: "Card",
    Component: Card,
    isContainer: true,
    props: {
      variant: {
        type: "select",
        default: "filled",
        label: "Variant",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Elevated", value: "elevated" },
          { label: "Outlined", value: "outlined" },
          { label: "Glow", value: "glow" },
        ],
      },
      children: {
        type: "text",
        default: "This is a card content",
        label: "Content",
      },
    },
  },
  CardTitle: {
    name: "CardTitle",
    Component: CardTitle,
    props: {
      title: { type: "text", default: "Line 4", label: "Title" },
      subtitle: {
        type: "text",
        default: "Scheduled maintenance",
        label: "Subtitle",
      },
    },
  },
  CardContent: {
    name: "CardContent",
    Component: CardContent,
    isContainer: true,
    props: {
      children: {
        type: "text",
        default: "Next service: 12 March",
        label: "Content",
      },
    },
  },
  CardCover: {
    name: "CardCover",
    Component: CardCover,
    props: {
      ratio: { type: "number", default: 1.78, label: "Ratio (w / h)" },
      alt: { type: "text", default: "Line 4", label: "Alt text" },
    },
  },
  CardActions: {
    name: "CardActions",
    Component: CardActions,
    props: {
      align: {
        type: "select",
        default: "end",
        label: "Align",
        options: [
          { label: "End", value: "end" },
          { label: "Start", value: "start" },
          { label: "Space between", value: "space-between" },
        ],
      },
    },
  },
  Icon: {
    name: "Icon",
    Component: Icon,
    props: {
      source: { type: "icon", default: "camera", label: "Source (glyph)" },
      size: { type: "number", default: 32, label: "Size" },
      flipForRTL: { type: "boolean", default: false, label: "Flip for RTL" },
    },
  },
  TouchableRipple: {
    name: "TouchableRipple",
    Component: TouchableRipple,
    props: {
      borderless: { type: "boolean", default: false, label: "Borderless" },
      borderRadius: { type: "number", default: 12, label: "Border radius" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
};
