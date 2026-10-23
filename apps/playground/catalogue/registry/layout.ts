import {
  AbsoluteCenter,
  AspectRatio,
  Box,
  Break,
  Center,
  Grid,
  ScrollArea,
  Spacer,
  Stack,
  Visible,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";

/** The spacing tokens `Stack`, `Grid` and `Spacer` take. */
const SPACING_OPTIONS = [
  { label: "xs", value: "xs" },
  { label: "s", value: "s" },
  { label: "m", value: "m" },
  { label: "l", value: "l" },
  { label: "xl", value: "xl" },
];

/** The window size classes `Visible` reads, smallest first. */
const SIZE_CLASS_OPTIONS = [
  { label: "compact", value: "compact" },
  { label: "medium", value: "medium" },
  { label: "expanded", value: "expanded" },
  { label: "large", value: "large" },
  { label: "extraLarge", value: "extraLarge" },
];

/** One edge of `Break`: nothing, or a spacing token (a px number goes through the code). */
const breakEdge = (label: string) => ({
  type: "select" as const,
  default: undefined,
  label,
  options: [{ label: "None", value: undefined }, ...SPACING_OPTIONS],
});

/**
 * The controls of the props `Box` owns. What is built on a Box (`Stack`,
 * `Center`, `AspectRatio`) takes the same props, so its page offers the same
 * controls rather than a second copy of them.
 */
const BOX_PROPS: ComponentMetadata["props"] = {
  padding: { type: "number", default: undefined, label: "Padding" },
  margin: { type: "number", default: undefined, label: "Margin" },
  background: {
    type: "select",
    default: undefined,
    label: "Background",
    options: [
      { label: "None", value: undefined },
      { label: "surface", value: "surface" },
      { label: "surfaceContainerLow", value: "surfaceContainerLow" },
      { label: "surfaceContainer", value: "surfaceContainer" },
      { label: "surfaceContainerHigh", value: "surfaceContainerHigh" },
      {
        label: "surfaceContainerHighest",
        value: "surfaceContainerHighest",
      },
      { label: "primaryContainer", value: "primaryContainer" },
      { label: "secondaryContainer", value: "secondaryContainer" },
      { label: "tertiaryContainer", value: "tertiaryContainer" },
      { label: "errorContainer", value: "errorContainer" },
    ],
  },
  radius: {
    type: "select",
    default: undefined,
    label: "Radius",
    options: [
      { label: "None", value: undefined },
      { label: "Small", value: "small" },
      { label: "Medium", value: "medium" },
      { label: "Large", value: "large" },
      { label: "Extra large", value: "extraLarge" },
    ],
  },
  borderWidth: {
    type: "number",
    default: undefined,
    label: "Border width",
  },
  borderColor: {
    type: "select",
    default: undefined,
    label: "Border color",
    options: [
      { label: "Default", value: undefined },
      { label: "outline", value: "outline" },
      { label: "outlineVariant", value: "outlineVariant" },
      { label: "primary", value: "primary" },
      { label: "secondary", value: "secondary" },
      { label: "tertiary", value: "tertiary" },
      { label: "error", value: "error" },
    ],
    appliesWhen: (values) => Number(values.borderWidth) > 0,
  },
  gap: { type: "number", default: undefined, label: "Gap" },
  align: {
    type: "select",
    default: undefined,
    label: "Align",
    options: [
      { label: "Default", value: undefined },
      { label: "Start", value: "flex-start" },
      { label: "Center", value: "center" },
      { label: "End", value: "flex-end" },
      { label: "Stretch", value: "stretch" },
      { label: "Baseline", value: "baseline" },
    ],
  },
  justify: {
    type: "select",
    default: undefined,
    label: "Justify",
    options: [
      { label: "Default", value: undefined },
      { label: "Start", value: "flex-start" },
      { label: "Center", value: "center" },
      { label: "End", value: "flex-end" },
      { label: "Space between", value: "space-between" },
      { label: "Space around", value: "space-around" },
      { label: "Space evenly", value: "space-evenly" },
    ],
  },
  width: {
    type: "select",
    default: undefined,
    label: "Width",
    options: [
      { label: "Default", value: undefined },
      { label: "Auto", value: "auto" },
      { label: "25%", value: "25%" },
      { label: "50%", value: "50%" },
      { label: "75%", value: "75%" },
      { label: "100%", value: "100%" },
    ],
  },
  height: { type: "number", default: undefined, label: "Height" },
  wrap: { type: "boolean", default: false, label: "Wrap" },
};

/** The shared controls without the ones a component leaves out of its own props. */
const without = (
  source: ComponentMetadata["props"],
  ...keys: string[]
): ComponentMetadata["props"] =>
  Object.fromEntries(
    Object.entries(source).filter(([key]) => !keys.includes(key)),
  );

/** Layout: 10 catalogue entries. */
export const layout: Record<string, ComponentMetadata> = {
  Box: {
    name: "Box",
    Component: Box,
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
      ...BOX_PROPS,
    },
  },
  Stack: {
    name: "Stack",
    Component: Stack,
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
      // `gap` is the one Box prop Stack replaces with `spacing`.
      ...without(BOX_PROPS, "gap"),
    },
  },
  Grid: {
    name: "Grid",
    Component: Grid,
    props: {
      container: { type: "boolean", default: false, label: "Container" },
      columns: { type: "number", default: 12, label: "Columns" },
      spacing: {
        type: "select",
        default: "s",
        label: "Spacing",
        options: [
          ...SPACING_OPTIONS,
          { label: "Row m, column l", value: { row: "m", column: "l" } },
        ],
      },
      wrap: { type: "boolean", default: true, label: "Wrap" },
      autoSize: {
        type: "select",
        default: false,
        label: "Auto size",
        options: [
          { label: "Off", value: false },
          { label: "Responsive (12 / 6 / 4)", value: true },
          { label: "Span 12", value: 12 },
          { label: "Span 6", value: 6 },
          { label: "Span 4", value: 4 },
          { label: "Span 3", value: 3 },
          { label: "Span 2", value: 2 },
          { label: "Auto", value: "auto" },
          { label: "Grow", value: "grow" },
          { label: "Per breakpoint (12 / 6)", value: { xs: 12, md: 6 } },
        ],
      },
    },
  },
  AspectRatio: {
    name: "AspectRatio",
    Component: AspectRatio,
    props: {
      ratio: { type: "number", default: 1, label: "Ratio (w / h)" },
      // The ratio sets the height, and the width starts full.
      ...without(BOX_PROPS, "height", "width"),
      width: {
        type: "select",
        default: "100%",
        label: "Width",
        options: [
          { label: "Auto", value: "auto" },
          { label: "25%", value: "25%" },
          { label: "50%", value: "50%" },
          { label: "75%", value: "75%" },
          { label: "100%", value: "100%" },
        ],
      },
    },
  },
  Spacer: {
    name: "Spacer",
    Component: Spacer,
    props: {
      size: {
        type: "select",
        default: undefined,
        label: "Size",
        options: [
          { label: "Flexible (no size)", value: undefined },
          ...SPACING_OPTIONS,
        ],
      },
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
  Center: {
    name: "Center",
    Component: Center,
    props: {
      direction: {
        type: "select",
        default: "row",
        label: "Direction",
        options: [
          { label: "Row", value: "row" },
          { label: "Column", value: "column" },
        ],
      },
      ...BOX_PROPS,
    },
  },
  AbsoluteCenter: {
    name: "AbsoluteCenter",
    Component: AbsoluteCenter,
    props: {
      axis: {
        type: "select",
        default: "both",
        label: "Axis",
        options: [
          { label: "Both", value: "both" },
          { label: "Horizontal", value: "horizontal" },
          { label: "Vertical", value: "vertical" },
        ],
      },
    },
  },
  Break: {
    name: "Break",
    Component: Break,
    props: {
      inline: breakEdge("Inline (both sides)"),
      block: breakEdge("Block (top and bottom)"),
      inlineStart: breakEdge("Inline start"),
      inlineEnd: breakEdge("Inline end"),
      blockStart: breakEdge("Block start"),
      blockEnd: breakEdge("Block end"),
    },
  },
  Visible: {
    name: "Visible",
    Component: Visible,
    props: {
      when: { type: "boolean", default: true, label: "When" },
      above: {
        type: "select",
        default: undefined,
        label: "Above (from this size class up)",
        options: [{ label: "Off", value: undefined }, ...SIZE_CLASS_OPTIONS],
      },
      below: {
        type: "select",
        default: undefined,
        label: "Below (smaller than this class)",
        options: [{ label: "Off", value: undefined }, ...SIZE_CLASS_OPTIONS],
      },
      only: {
        type: "select",
        default: undefined,
        label: "Only",
        options: [
          { label: "Any size", value: undefined },
          ...SIZE_CLASS_OPTIONS,
          { label: "compact + medium", value: ["compact", "medium"] },
          { label: "expanded + large", value: ["expanded", "large"] },
          { label: "large + extraLarge", value: ["large", "extraLarge"] },
        ],
      },
      keepMounted: { type: "boolean", default: false, label: "Keep mounted" },
    },
  },
  ScrollArea: {
    name: "ScrollArea",
    Component: ScrollArea,
    props: {
      orientation: {
        type: "select",
        default: "vertical",
        label: "Orientation",
        options: [
          { label: "Vertical", value: "vertical" },
          { label: "Horizontal", value: "horizontal" },
          { label: "Both", value: "both" },
        ],
      },
      type: {
        type: "select",
        default: "auto",
        label: "Type",
        options: [
          { label: "Auto (while it overflows)", value: "auto" },
          { label: "Always", value: "always" },
          { label: "Scroll (while scrolling)", value: "scroll" },
          { label: "Hover (under the pointer)", value: "hover" },
        ],
      },
      scrollbarSize: { type: "number", default: 10, label: "Scrollbar size" },
      scrollHideDelay: {
        type: "number",
        default: 600,
        label: "Hide delay (ms)",
        // Only a scrollbar that hides has a delay to wait.
        appliesWhen: (values) =>
          values.type === "scroll" || values.type === "hover",
      },
      height: { type: "number", default: undefined, label: "Height" },
      maxHeight: { type: "number", default: undefined, label: "Max height" },
      width: { type: "number", default: undefined, label: "Width" },
    },
  },
};
