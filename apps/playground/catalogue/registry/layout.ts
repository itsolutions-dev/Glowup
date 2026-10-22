import { Box, Grid, Stack, AspectRatio, Spacer } from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";
import { BoxDemo, GridDemo, StackDemo } from "../demos";

/** The spacing tokens `Stack` and `Grid` take for `spacing`. */
const SPACING_OPTIONS = [
  { label: "xs", value: "xs" },
  { label: "s", value: "s" },
  { label: "m", value: "m" },
  { label: "l", value: "l" },
  { label: "xl", value: "xl" },
];

/** `Box` and `Stack` cross-axis alignment; empty leaves the variant's own. */
const ALIGN_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Start", value: "flex-start" },
  { label: "Center", value: "center" },
  { label: "End", value: "flex-end" },
  { label: "Stretch", value: "stretch" },
];

/** `Box` and `Stack` main-axis distribution; empty leaves the variant's own. */
const JUSTIFY_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Start", value: "flex-start" },
  { label: "Center", value: "center" },
  { label: "End", value: "flex-end" },
  { label: "Space between", value: "space-between" },
  { label: "Space around", value: "space-around" },
  { label: "Space evenly", value: "space-evenly" },
];

/** Layout: 5 catalogue entries. */
export const layout: Record<string, ComponentMetadata> = {
  Box: {
    name: "Box",
    Component: Box,
    Demo: BoxDemo,
    props: {
      variant: {
        type: "select",
        default: "standard",
        label: "Variant",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Flex", value: "flex" },
          { label: "Column flex", value: "column-flex" },
          { label: "Centered flex", value: "centered-flex" },
          { label: "Centered column flex", value: "centered-column-flex" },
          { label: "Full page flex", value: "full-page-flex" },
          { label: "Full page column flex", value: "full-page-column-flex" },
          { label: "Full size flex", value: "full-size-flex" },
          { label: "Full size column", value: "full-size-column" },
          {
            label: "Full size centered flex",
            value: "full-size-centered-flex",
          },
          {
            label: "Full size centered column flex",
            value: "full-size-centered-column-flex",
          },
        ],
      },
      padding: { type: "number", default: 16, label: "Padding" },
      margin: { type: "number", default: 0, label: "Margin" },
      background: {
        type: "select",
        default: "primaryContainer",
        label: "Background",
        options: [
          { label: "primaryContainer", value: "primaryContainer" },
          { label: "secondaryContainer", value: "secondaryContainer" },
          { label: "tertiaryContainer", value: "tertiaryContainer" },
          {
            label: "surfaceContainerHighest",
            value: "surfaceContainerHighest",
          },
        ],
      },
      radius: {
        type: "select",
        default: "large",
        label: "Radius",
        options: [
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
          { label: "Extra large", value: "extraLarge" },
        ],
      },
      borderWidth: { type: "number", default: 0, label: "Border Width" },
      borderColor: {
        type: "select",
        default: "outline",
        label: "Border Color",
        options: [
          { label: "outline", value: "outline" },
          { label: "outlineVariant", value: "outlineVariant" },
          { label: "primary", value: "primary" },
          { label: "error", value: "error" },
        ],
        appliesWhen: (values) => Number(values.borderWidth) > 0,
      },
      gap: { type: "number", default: 8, label: "Gap" },
      align: {
        type: "select",
        default: "",
        label: "Align",
        options: ALIGN_OPTIONS,
      },
      justify: {
        type: "select",
        default: "",
        label: "Justify",
        options: JUSTIFY_OPTIONS,
      },
      width: { type: "text", default: "", label: "Width (px or %)" },
      height: { type: "text", default: "", label: "Height (px or %)" },
      wrap: { type: "boolean", default: false, label: "Wrap" },
    },
  },
  Stack: {
    name: "Stack",
    Component: Stack,
    Demo: StackDemo,
    props: {
      direction: {
        type: "select",
        default: "vertical",
        label: "Direction",
        options: [
          { label: "Vertical", value: "vertical" },
          { label: "Horizontal", value: "horizontal" },
        ],
      },
      spacing: {
        type: "select",
        default: "s",
        label: "Spacing",
        options: SPACING_OPTIONS,
      },
      dividers: { type: "boolean", default: false, label: "Dividers" },
      reverse: { type: "boolean", default: false, label: "Reverse" },
      padding: { type: "number", default: 0, label: "Padding" },
      align: {
        type: "select",
        default: "",
        label: "Align",
        options: ALIGN_OPTIONS,
      },
      justify: {
        type: "select",
        default: "",
        label: "Justify",
        options: JUSTIFY_OPTIONS,
      },
      wrap: { type: "boolean", default: false, label: "Wrap" },
    },
  },
  Grid: {
    name: "Grid",
    Component: Grid,
    Demo: GridDemo,
    props: {
      // A grid lays items out only as a container; the stage wraps each team
      // tile in a `<Grid size>` item of it.
      container: { type: "boolean", default: true, label: "Container" },
      columns: { type: "number", default: 12, label: "Columns" },
      spacing: {
        type: "select",
        default: "s",
        label: "Spacing",
        options: SPACING_OPTIONS,
      },
      wrap: { type: "boolean", default: true, label: "Wrap" },
      autoSize: {
        type: "select",
        default: false,
        label: "Auto Size",
        options: [
          { label: "Off", value: false },
          { label: "Responsive (12 / 6 / 4)", value: true },
          { label: "Span 3", value: 3 },
          { label: "Span 4", value: 4 },
          { label: "Span 6", value: 6 },
        ],
      },
      // The item's prop: every tile on the stage is a `<Grid size>` of it.
      size: {
        type: "select",
        default: "",
        label: "Item Size",
        options: [
          { label: "Default (auto or Auto Size)", value: "" },
          { label: "Auto", value: "auto" },
          { label: "Grow", value: "grow" },
          { label: "Span 3", value: 3 },
          { label: "Span 4", value: 4 },
          { label: "Span 6", value: 6 },
          { label: "Span 12", value: 12 },
        ],
      },
    },
  },
  AspectRatio: {
    name: "AspectRatio",
    Component: AspectRatio,
    props: {
      ratio: { type: "number", default: 1.78, label: "Ratio (w / h)" },
    },
  },
  Spacer: {
    name: "Spacer",
    Component: Spacer,
    props: {
      size: { type: "number", default: 24, label: "Size" },
      axis: {
        type: "select",
        default: "vertical",
        label: "Axis",
        options: [
          { label: "Vertical", value: "vertical" },
          { label: "Horizontal", value: "horizontal" },
        ],
      },
    },
  },
};
