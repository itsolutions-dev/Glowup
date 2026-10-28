import React from "react";
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
    padding={16}
    background="surfaceContainerLow"
    radius="medium"
    width={420}
  >
    <Typography variant="titleMedium">Invoices</Typography>
    <Spacer />
    <Button variant="tonal" onClick={() => {}}>
      Export
    </Button>
  </HStack>
);

export const FixedSize = () => (
  <VStack
    padding={16}
    background="surfaceContainerLow"
    radius="medium"
    width={420}
  >
    <Typography variant="bodyMedium">size=&quot;xs&quot; below</Typography>
    <Spacer size="xs" />
    <Box background="primaryContainer" padding={4} radius="small" />
    <Spacer size="l" />
    <Typography variant="bodyMedium">size=&quot;l&quot; above</Typography>
  </VStack>
);

export const HorizontalAxis = () => (
  <HStack
    spacing={0}
    align="center"
    padding={16}
    background="surfaceContainerLow"
    radius="medium"
    width={420}
  >
    <Typography variant="bodyMedium">Left</Typography>
    <Spacer size="xl" axis="horizontal" />
    <Typography variant="bodyMedium">32px later</Typography>
  </HStack>
);

/** `size` is a spacing token or a number of px. `spacing={0}` on the row so the gap is the Spacer alone. */
export const PixelSize = () => (
  <HStack
    spacing={0}
    align="center"
    padding={16}
    background="surfaceContainerLow"
    radius="medium"
    width={420}
  >
    <Typography variant="bodyMedium">Left</Typography>
    <Spacer size={60} axis="horizontal" />
    <Typography variant="bodyMedium">60px later</Typography>
  </HStack>
);
