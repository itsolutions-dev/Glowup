// GENERATED — do not edit.
// Source: .design-sync/previews/Box.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import type { Variant } from "../types";
import { Box, Typography } from "@its/glowup-ui";

export const Padding = () => (
  <Box
    background="surfaceContainerLow"
    padding={16}
    radius="medium"
    gap={8}
    width={360}
  >
    <Typography variant="labelSmall">
      p / px / py take spacing token names
    </Typography>
    <Box background="secondaryContainer" padding={4} radius="small">
      <Typography variant="bodySmall">p=&quot;xs&quot; — 4</Typography>
    </Box>
    <Box background="secondaryContainer" padding={16} radius="small">
      <Typography variant="bodySmall">p=&quot;m&quot; — 16</Typography>
    </Box>
    <Box
      background="secondaryContainer"
      radius="small"
      style={{ paddingHorizontal: 32, paddingVertical: 4 }}
    >
      <Typography variant="bodySmall">
        px=&quot;xl&quot; py=&quot;xs&quot;
      </Typography>
    </Box>
  </Box>
);

export const Surfaces = () => (
  <Box gap={8} width={360}>
    {(
      [
        "surface",
        "surfaceContainer",
        "primaryContainer",
        "tertiaryContainer",
      ] as const
    ).map((bg) => (
      <Box
        key={bg}
        background={bg}
        padding={16}
        radius="medium"
        borderWidth={1}
        borderColor="outlineVariant"
      >
        <Typography variant="labelMedium">bg=&quot;{bg}&quot;</Typography>
      </Box>
    ))}
  </Box>
);

export const FlexControls = () => (
  <Box gap={16} width={360}>
    <Box
      background="surfaceContainerLow"
      padding={8}
      radius="medium"
      gap={8}
      justify="space-between"
      align="center"
      height={72}
    >
      <Typography variant="labelSmall">
        justify=&quot;space-between&quot; align=&quot;center&quot;
      </Typography>
      <Box background="primaryContainer" padding={8} radius="small">
        <Typography variant="labelMedium">A</Typography>
      </Box>
    </Box>
    <Box background="surfaceContainerLow" padding={8} radius="large" gap={4}>
      <Typography variant="labelSmall">
        radius=&quot;large&quot; gap=&quot;xs&quot;
      </Typography>
      <Box background="primaryContainer" padding={8} radius="small">
        <Typography variant="labelMedium">B</Typography>
      </Box>
      <Box background="primaryContainer" padding={8} radius="small">
        <Typography variant="labelMedium">C</Typography>
      </Box>
    </Box>
  </Box>
);

export const variants: Variant[] = [
  {
    name: "Padding",
    title: "Padding",
    render: Padding,
  },
  {
    name: "Surfaces",
    title: "Surfaces",
    render: Surfaces,
  },
  {
    name: "FlexControls",
    title: "Flex controls",
    render: FlexControls,
  },
];
