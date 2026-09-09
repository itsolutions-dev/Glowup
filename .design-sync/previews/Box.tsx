import React from "react";
import { Box, Typography } from "@glowup/ui";

export const Padding = () => (
  <Box bg="surfaceContainerLow" p="m" radius="medium" gap="s" width={360}>
    <Typography variant="labelSmall">
      p / px / py take spacing token names
    </Typography>
    <Box bg="secondaryContainer" p="xs" radius="small">
      <Typography variant="bodySmall">p=&quot;xs&quot; — 4</Typography>
    </Box>
    <Box bg="secondaryContainer" p="m" radius="small">
      <Typography variant="bodySmall">p=&quot;m&quot; — 16</Typography>
    </Box>
    <Box bg="secondaryContainer" px="xl" py="xs" radius="small">
      <Typography variant="bodySmall">
        px=&quot;xl&quot; py=&quot;xs&quot;
      </Typography>
    </Box>
  </Box>
);

export const Surfaces = () => (
  <Box gap="s" width={360}>
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
        bg={bg}
        p="m"
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
  <Box gap="m" width={360}>
    <Box
      bg="surfaceContainerLow"
      p="s"
      radius="medium"
      gap="s"
      justify="space-between"
      align="center"
      height={72}
    >
      <Typography variant="labelSmall">
        justify=&quot;space-between&quot; align=&quot;center&quot;
      </Typography>
      <Box bg="primaryContainer" p="s" radius="small">
        <Typography variant="labelMedium">A</Typography>
      </Box>
    </Box>
    <Box bg="surfaceContainerLow" p="s" radius="large" gap="xs">
      <Typography variant="labelSmall">
        radius=&quot;large&quot; gap=&quot;xs&quot;
      </Typography>
      <Box bg="primaryContainer" p="s" radius="small">
        <Typography variant="labelMedium">B</Typography>
      </Box>
      <Box bg="primaryContainer" p="s" radius="small">
        <Typography variant="labelMedium">C</Typography>
      </Box>
    </Box>
  </Box>
);
