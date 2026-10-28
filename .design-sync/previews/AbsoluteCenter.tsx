import React from "react";
import {
  AbsoluteCenter,
  Box,
  CircularProgress,
  HStack,
  Typography,
} from "@its/glowup-ui";

/** The parent needs a size of its own: the centred layer fills it. */
export const Both = () => (
  <Box
    background="surfaceContainerLow"
    radius="medium"
    height={160}
    width={360}
    borderWidth={1}
    borderColor="outlineVariant"
  >
    <AbsoluteCenter>
      <Typography variant="titleMedium">Centred on both axes</Typography>
    </AbsoluteCenter>
  </Box>
);

export const Axes = () => (
  <HStack spacing="m" wrap width={560}>
    {(["horizontal", "vertical"] as const).map((axis) => (
      <Box
        key={axis}
        background="surfaceContainerLow"
        radius="medium"
        height={120}
        width={180}
        borderWidth={1}
        borderColor="outlineVariant"
      >
        <AbsoluteCenter axis={axis}>
          <Box
            background="secondaryContainer"
            radius="small"
            padding={8}
            margin={12}
            align="center"
          >
            <Typography variant="labelLarge">
              axis=&quot;{axis}&quot;
            </Typography>
          </Box>
        </AbsoluteCenter>
      </Box>
    ))}
  </HStack>
);

/** Out of the flow: the content of the parent stays where it is. */
export const OverContent = () => (
  <Box
    background="surfaceContainerLow"
    radius="large"
    height={240}
    width={360}
    padding={16}
    gap={8}
  >
    <Typography variant="titleSmall">Quarterly report</Typography>
    <Typography variant="bodyMedium">
      The spinner sits over the middle of the card without moving this text.
    </Typography>
    <AbsoluteCenter>
      <Box
        background="surfaceContainerHighest"
        radius="extraLarge"
        padding={12}
      >
        <CircularProgress size={40} />
      </Box>
    </AbsoluteCenter>
  </Box>
);
