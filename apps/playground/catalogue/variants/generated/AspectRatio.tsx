// GENERATED — do not edit.
// Source: .design-sync/previews/AspectRatio.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import type { Variant } from "../types";
import { AspectRatio, HStack, Typography } from "@its/glowup-ui";

const band = (ratio: number, label: string) => (
  <AspectRatio ratio={ratio} bg="primaryContainer" radius="medium" width={180}>
    <Typography variant="labelMedium">{label}</Typography>
  </AspectRatio>
);

export const Ratios = () => (
  <HStack spacing="m" wrap width={480} align="flex-start">
    {band(16 / 9, "16:9")}
    {band(4 / 3, "4:3")}
    {band(1, "1:1")}
  </HStack>
);

export const AsAMediaSlot = () => (
  <AspectRatio
    ratio={16 / 9}
    bg="tertiaryContainer"
    radius="large"
    width={360}
    p="m"
  >
    <Typography variant="titleMedium">Release banner</Typography>
    <Typography variant="bodySmall">
      The box keeps its 16:9 shape whatever the width is.
    </Typography>
  </AspectRatio>
);

export const variants: Variant[] = [
  {
    name: "Ratios",
    title: "Ratios",
    render: Ratios,
  },
  {
    name: "AsAMediaSlot",
    title: "As a media slot",
    render: AsAMediaSlot,
  },
];
