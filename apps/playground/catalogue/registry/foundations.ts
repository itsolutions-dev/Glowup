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

/** The Material type scale by name, then the M3 role names that name the same styles. */
const TYPOGRAPHY_VARIANTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "subtitle1",
  "subtitle2",
  "body1",
  "body2",
  "button",
  "caption",
  "overline",
  "displayLarge",
  "displayMedium",
  "displaySmall",
  "headlineLarge",
  "headlineMedium",
  "headlineSmall",
  "titleLarge",
  "titleMedium",
  "titleSmall",
  "labelLarge",
  "labelMedium",
  "labelSmall",
  "bodyLarge",
  "bodyMedium",
  "bodySmall",
].map((value) => ({ label: value, value }));

/** Foundations: 10 catalogue entries. */
export const foundations: Record<string, ComponentMetadata> = {
  Typography: {
    name: "Typography",
    Component: Typography,
    props: {
      children: { type: "text", default: "", label: "Text" },
      variant: {
        type: "select",
        default: "body1",
        label: "Variant",
        options: TYPOGRAPHY_VARIANTS,
      },
      color: {
        type: "select",
        default: undefined,
        label: "Color",
        options: [
          { label: "Default (onSurface)", value: undefined },
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Tertiary", value: "tertiary" },
          { label: "Error", value: "error" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Info", value: "info" },
          { label: "On surface variant", value: "onSurfaceVariant" },
          { label: "Outline", value: "outline" },
        ],
      },
      fontSize: { type: "number", default: undefined, label: "Font size" },
      align: {
        type: "select",
        default: undefined,
        label: "Align",
        options: [
          { label: "Default", value: undefined },
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
      contentSpacing: {
        type: "number",
        default: 16,
        label: "Label spacing",
      },
      children: {
        type: "text",
        default: "",
        label: "Label",
        // Horizontal only — a vertical rule takes no label.
        appliesWhen: (values) => values.orientation !== "vertical",
      },
    },
  },
  Paper: {
    name: "Paper",
    Component: Paper,
    props: {
      elevation: { type: "number", default: 1, label: "Elevation (0-5)" },
      outline: { type: "boolean", default: false, label: "Outline" },
      glow: { type: "boolean", default: false, label: "Glow" },
    },
  },
  Card: {
    name: "Card",
    Component: Card,
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
      accessibilityLabel: {
        type: "text",
        default: "",
        label: "Accessibility label",
      },
    },
  },
  CardTitle: {
    name: "CardTitle",
    Component: CardTitle,
    props: {
      title: { type: "text", default: "", label: "Title" },
      subtitle: { type: "text", default: "", label: "Subtitle" },
      titleNumberOfLines: {
        type: "number",
        default: 1,
        label: "Title lines",
      },
      subtitleNumberOfLines: {
        type: "number",
        default: 2,
        label: "Subtitle lines",
      },
    },
  },
  CardContent: {
    name: "CardContent",
    Component: CardContent,
    props: {
      children: { type: "text", default: "", label: "Content" },
    },
  },
  CardCover: {
    name: "CardCover",
    Component: CardCover,
    props: {
      alt: { type: "text", default: "", label: "Alt text" },
      ratio: { type: "number", default: 16 / 9, label: "Ratio (w / h)" },
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
      source: { type: "icon", default: "", label: "Source (glyph)" },
      size: { type: "number", default: 24, label: "Size" },
      color: { type: "text", default: "", label: "Color" },
      flipForRTL: { type: "boolean", default: false, label: "Flip for RTL" },
    },
  },
  TouchableRipple: {
    name: "TouchableRipple",
    Component: TouchableRipple,
    props: {
      borderless: { type: "boolean", default: false, label: "Borderless" },
      borderRadius: {
        type: "number",
        default: undefined,
        label: "Border radius",
      },
    },
  },
};
