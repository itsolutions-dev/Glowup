// GENERATED — do not edit.
// Source: .design-sync/previews/Spacer.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import type { Variant } from "../types";
import {
  Box,
  Button,
  HStack,
  Spacer,
  Typography,
  VStack,
} from "@its/glowup-ui";

/** With no `size`, Spacer absorbs the leftover space along the parent's axis. */
export const PushesApart = () => (
  <HStack
    align="center"
    p="m"
    bg="surfaceContainerLow"
    radius="medium"
    width={420}
  >
    <Typography variant="titleMedium">Invoices</Typography>
    <Spacer />
    <Button mode="tonal" onPress={() => {}}>
      Export
    </Button>
  </HStack>
);

export const FixedSize = () => (
  <VStack p="m" bg="surfaceContainerLow" radius="medium" width={420}>
    <Typography variant="bodyMedium">size=&quot;xs&quot; below</Typography>
    <Spacer size="xs" />
    <Box bg="primaryContainer" p="xs" radius="small" />
    <Spacer size="l" />
    <Typography variant="bodyMedium">size=&quot;l&quot; above</Typography>
  </VStack>
);

export const HorizontalAxis = () => (
  <HStack
    align="center"
    p="m"
    bg="surfaceContainerLow"
    radius="medium"
    width={420}
  >
    <Typography variant="bodyMedium">Left</Typography>
    <Spacer size="xl" axis="horizontal" />
    <Typography variant="bodyMedium">32px later</Typography>
  </HStack>
);

export const variants: Variant[] = [
  {
    name: "PushesApart",
    title: "Pushes apart",
    description:
      "With no `size`, Spacer absorbs the leftover space along the parent's axis.",
    render: PushesApart,
  },
  {
    name: "FixedSize",
    title: "Fixed size",
    render: FixedSize,
  },
  {
    name: "HorizontalAxis",
    title: "Horizontal axis",
    render: HorizontalAxis,
  },
];
