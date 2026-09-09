import React from "react";
import { Chip, Stack, Typography } from "@glowup/ui";

const items = ["Buttons", "Inputs", "Feedback"];

export const Direction = () => (
  <Stack direction="vertical" spacing="m" width={420}>
    <Stack
      direction="vertical"
      spacing="xs"
      p="s"
      bg="surfaceContainerLow"
      radius="medium"
    >
      <Typography variant="labelSmall">
        direction=&quot;vertical&quot;
      </Typography>
      {items.map((i) => (
        <Chip key={i} label={i} mode="tonal" onPress={() => {}} />
      ))}
    </Stack>
    <Stack
      direction="horizontal"
      spacing="s"
      p="s"
      bg="surfaceContainerLow"
      radius="medium"
    >
      <Typography variant="labelSmall">horizontal</Typography>
      {items.map((i) => (
        <Chip key={i} label={i} mode="tonal" onPress={() => {}} />
      ))}
    </Stack>
  </Stack>
);

/** `reverse` flips the visual order without touching the children array. */
export const Reverse = () => (
  <Stack direction="vertical" spacing="m" width={420}>
    <Stack direction="horizontal" spacing="s">
      {items.map((i) => (
        <Chip key={i} label={i} mode="outlined" onPress={() => {}} />
      ))}
    </Stack>
    <Stack direction="horizontal" spacing="s" reverse>
      {items.map((i) => (
        <Chip key={i} label={i} mode="tonal" onPress={() => {}} />
      ))}
    </Stack>
  </Stack>
);

export const Wrapped = () => (
  <Stack
    direction="horizontal"
    spacing="s"
    wrap
    p="s"
    bg="surfaceContainerLow"
    radius="medium"
    width={280}
  >
    {[
      "Buttons",
      "Inputs",
      "Feedback",
      "Navigation",
      "Foundations",
      "Providers",
    ].map((i) => (
      <Chip key={i} label={i} mode="tonal" onPress={() => {}} />
    ))}
  </Stack>
);
