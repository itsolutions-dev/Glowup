import React from "react";
import { Box, Center, CircularProgress, Typography } from "@its/glowup-ui";

export const Basic = () => (
  <Center
    background="surfaceContainerLow"
    radius="medium"
    height={160}
    width={360}
  >
    <Typography variant="titleMedium">Centred on both axes</Typography>
  </Center>
);

/** `direction="column"` stacks the children, each centred. */
export const Column = () => (
  <Center
    direction="column"
    background="surfaceContainerLow"
    radius="large"
    height={200}
    width={360}
    gap={8}
  >
    <CircularProgress size={48} />
    <Typography variant="bodyMedium">Syncing your workspace</Typography>
  </Center>
);

/** In a row, the children sit side by side in the middle. */
export const Row = () => (
  <Center
    background="surfaceContainerLow"
    radius="large"
    height={120}
    width={360}
    gap={12}
  >
    <Box background="primaryContainer" padding={12} radius="small">
      <Typography variant="labelLarge">One</Typography>
    </Box>
    <Box background="secondaryContainer" padding={12} radius="small">
      <Typography variant="labelLarge">Two</Typography>
    </Box>
  </Center>
);

/** Every other Box prop applies. */
export const WithBoxProps = () => (
  <Center
    background="surface"
    radius="large"
    padding={24}
    height={140}
    width={360}
    borderWidth={1}
    borderColor="outlineVariant"
  >
    <Typography variant="bodyMedium">Bordered, padded, centred</Typography>
  </Center>
);
