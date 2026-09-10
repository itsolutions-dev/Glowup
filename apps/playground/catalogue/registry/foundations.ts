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
        default: "bodyLarge",
        label: "Variant",
        options: [
          { label: "Display Large", value: "displayLarge" },
          { label: "Display Medium", value: "displayMedium" },
          { label: "Display Small", value: "displaySmall" },
          { label: "Headline Large", value: "headlineLarge" },
          { label: "Headline Medium", value: "headlineMedium" },
          { label: "Headline Small", value: "headlineSmall" },
          { label: "Title Large", value: "titleLarge" },
          { label: "Title Medium", value: "titleMedium" },
          { label: "Title Small", value: "titleSmall" },
          { label: "Body Large", value: "bodyLarge" },
          { label: "Body Medium", value: "bodyMedium" },
          { label: "Body Small", value: "bodySmall" },
          { label: "Label Large", value: "labelLarge" },
          { label: "Label Medium", value: "labelMedium" },
          { label: "Label Small", value: "labelSmall" },
        ],
      },
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
      children: { type: "text", default: "OR", label: "Label" },
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
      title: { type: "text", default: "Impianto 4", label: "Title" },
      subtitle: {
        type: "text",
        default: "Manutenzione programmata",
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
        default: "Prossimo intervento: 12 marzo",
        label: "Content",
      },
    },
  },
  CardCover: {
    name: "CardCover",
    Component: CardCover,
    props: {
      ratio: { type: "number", default: 1.78, label: "Ratio (w / h)" },
      alt: { type: "text", default: "Impianto 4", label: "Alt text" },
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
      source: { type: "text", default: "camera", label: "Source (glyph)" },
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
