import React from "react";
import { Chip, Stack, Typography } from "@its/glowup-ui";

const items = ["Buttons", "Inputs", "Feedback"];

export const Direction = () => (
  <Stack direction="vertical" spacing="m" width={420}>
    <Stack
      direction="vertical"
      spacing="xs"
      padding={8}
      background="surfaceContainerLow"
      radius="medium"
    >
      <Typography variant="labelSmall">
        direction=&quot;vertical&quot;
      </Typography>
      {items.map((i) => (
        <Chip key={i} label={i} variant="tonal" onClick={() => {}} />
      ))}
    </Stack>
    <Stack
      direction="horizontal"
      spacing="s"
      padding={8}
      background="surfaceContainerLow"
      radius="medium"
    >
      <Typography variant="labelSmall">horizontal</Typography>
      {items.map((i) => (
        <Chip key={i} label={i} variant="tonal" onClick={() => {}} />
      ))}
    </Stack>
  </Stack>
);

/** `reverse` flips the visual order without touching the children array. */
export const Reverse = () => (
  <Stack direction="vertical" spacing="m" width={420}>
    <Stack direction="horizontal" spacing="s">
      {items.map((i) => (
        <Chip key={i} label={i} variant="outlined" onClick={() => {}} />
      ))}
    </Stack>
    <Stack direction="horizontal" spacing="s" reverse>
      {items.map((i) => (
        <Chip key={i} label={i} variant="tonal" onClick={() => {}} />
      ))}
    </Stack>
  </Stack>
);

export const Wrapped = () => (
  <Stack
    direction="horizontal"
    spacing="s"
    wrap
    padding={8}
    background="surfaceContainerLow"
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
      <Chip key={i} label={i} variant="tonal" onClick={() => {}} />
    ))}
  </Stack>
);
