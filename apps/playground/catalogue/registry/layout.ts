import { Box, Grid, Stack, AspectRatio, Center, Spacer } from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";

/** Layout: 6 catalogue entries. */
export const layout: Record<string, ComponentMetadata> = {
  Box: {
    name: "Box",
    Component: Box,
    props: {
      p: {
        type: "select",
        default: "m",
        label: "Padding",
        options: [
          { label: "xs", value: "xs" },
          { label: "s", value: "s" },
          { label: "m", value: "m" },
          { label: "l", value: "l" },
          { label: "xl", value: "xl" },
        ],
      },
      bg: {
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
      row: { type: "boolean", default: false, label: "Horizontal" },
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
        options: [
          { label: "xs", value: "xs" },
          { label: "s", value: "s" },
          { label: "m", value: "m" },
          { label: "l", value: "l" },
        ],
      },
      reverse: { type: "boolean", default: false, label: "Reverse" },
    },
  },
  Grid: {
    name: "Grid",
    Component: Grid,
    props: {
      columns: {
        type: "number",
        default: 3,
        label: "Columns",
        // "Ignored when `minChildWidth` is set", says the prop's own JSDoc.
        appliesWhen: (values) => !Number(values.minChildWidth),
      },
      minChildWidth: {
        type: "number",
        default: 0,
        label: "Min Child Width (0 = off)",
      },
      spacing: {
        type: "select",
        default: "s",
        label: "Spacing",
        options: [
          { label: "xs", value: "xs" },
          { label: "s", value: "s" },
          { label: "m", value: "m" },
          { label: "l", value: "l" },
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
  Center: {
    name: "Center",
    Component: Center,
    props: {},
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
