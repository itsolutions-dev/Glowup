import React from "react";
import { Box, Chip, CircularProgress, Typography } from "@its/glowup-ui";

export const Padding = () => (
  <Box
    background="surfaceContainerLow"
    padding={16}
    radius="medium"
    gap={8}
    width={360}
  >
    <Typography variant="labelSmall">
      padding and margin take a number of px; one edge goes through style
    </Typography>
    <Box background="secondaryContainer" padding={4} radius="small">
      <Typography variant="bodySmall">padding=&#123;4&#125;</Typography>
    </Box>
    <Box background="secondaryContainer" padding={16} radius="small">
      <Typography variant="bodySmall">padding=&#123;16&#125;</Typography>
    </Box>
    <Box
      background="secondaryContainer"
      radius="small"
      style={{ paddingHorizontal: 32, paddingVertical: 4 }}
    >
      <Typography variant="bodySmall">
        style=&#123;&#123; paddingHorizontal: 32, paddingVertical: 4
        &#125;&#125;
      </Typography>
    </Box>
  </Box>
);

export const Margin = () => (
  <Box
    background="surfaceContainerLow"
    radius="medium"
    width={360}
    borderWidth={1}
    borderColor="outlineVariant"
  >
    <Box background="primaryContainer" padding={8} radius="small" margin={16}>
      <Typography variant="labelMedium">margin=&#123;16&#125;</Typography>
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
    ).map((background) => (
      <Box
        key={background}
        background={background}
        padding={16}
        radius="medium"
        borderWidth={1}
        borderColor="outlineVariant"
      >
        <Typography variant="labelMedium">
          background=&quot;{background}&quot;
        </Typography>
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
        radius=&quot;large&quot; gap=&#123;4&#125;
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

const tags = ["Buttons", "Inputs", "Feedback", "Navigation", "Foundations"];

/** `variant` presets the direction: `standard` and `column-flex` stack, `flex` is a row. */
export const Directions = () => (
  <Box gap={16} width={360}>
    {(["standard", "flex", "column-flex"] as const).map((variant) => (
      <Box
        key={variant}
        variant={variant}
        background="surfaceContainerLow"
        padding={8}
        radius="medium"
        gap={8}
      >
        <Box background="primaryContainer" padding={8} radius="small">
          <Typography variant="labelMedium">{variant}</Typography>
        </Box>
        <Box background="primaryContainer" padding={8} radius="small">
          <Typography variant="labelMedium">B</Typography>
        </Box>
      </Box>
    ))}
  </Box>
);

/** `wrap` lets the children of a row flow onto the next line. */
export const Wrap = () => (
  <Box
    variant="flex"
    wrap
    gap={8}
    background="surfaceContainerLow"
    padding={8}
    radius="medium"
    width={280}
  >
    {tags.map((tag) => (
      <Chip key={tag} label={tag} variant="tonal" onClick={() => {}} />
    ))}
  </Box>
);

/** The centred variants: both axes, as a row or a column. */
export const Centered = () => (
  <Box gap={16} width={360}>
    <Box
      variant="centered-flex"
      background="surfaceContainerLow"
      radius="medium"
      height={96}
    >
      <Typography variant="titleMedium">centered-flex</Typography>
    </Box>
    <Box
      variant="centered-column-flex"
      background="surfaceContainerLow"
      radius="large"
      height={160}
      gap={8}
    >
      <CircularProgress size={48} />
      <Typography variant="bodyMedium">Syncing your workspace</Typography>
    </Box>
  </Box>
);

/** The `full-*` variants fill their parent; here a 360 by 140 frame. */
export const FillsItsParent = () => (
  <Box gap={16} width={360}>
    <Box
      width={360}
      height={140}
      borderWidth={1}
      borderColor="outlineVariant"
      radius="medium"
    >
      <Box
        variant="full-size-centered-flex"
        background="primaryContainer"
        radius="medium"
      >
        <Typography variant="labelMedium">full-size-centered-flex</Typography>
      </Box>
    </Box>
    <Box
      width={360}
      height={140}
      borderWidth={1}
      borderColor="outlineVariant"
      radius="medium"
    >
      <Box
        variant="full-size-column"
        background="tertiaryContainer"
        radius="medium"
        padding={8}
        justify="space-between"
      >
        <Typography variant="labelMedium">full-size-column</Typography>
        <Typography variant="labelSmall">100% x 100%, a column</Typography>
      </Box>
    </Box>
  </Box>
);
