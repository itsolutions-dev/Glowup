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

/** `spacing` takes a token name, a number of px, or a string holding one. */
export const Spacing = () => (
  <Stack direction="horizontal" spacing="m" align="flex-start" width={420} wrap>
    {(["xs", "xl", 20, "12"] as const).map((spacing) => (
      <Stack
        key={spacing}
        spacing={spacing}
        padding={8}
        background="surfaceContainerLow"
        radius="medium"
      >
        <Typography variant="labelSmall">spacing: {spacing}</Typography>
        <Chip label="One" variant="tonal" onClick={() => {}} />
        <Chip label="Two" variant="tonal" onClick={() => {}} />
      </Stack>
    ))}
  </Stack>
);

/** `dividers` puts a hairline between the children, vertical in a horizontal stack. */
export const Dividers = () => (
  <Stack direction="vertical" spacing="m" width={420}>
    <Stack
      spacing="s"
      dividers
      padding={8}
      background="surfaceContainerLow"
      radius="medium"
    >
      <Typography variant="bodyMedium">Profile</Typography>
      <Typography variant="bodyMedium">Notifications</Typography>
      <Typography variant="bodyMedium">Security</Typography>
    </Stack>
    <Stack
      direction="horizontal"
      spacing="m"
      dividers
      align="center"
      padding={8}
      background="surfaceContainerLow"
      radius="medium"
    >
      <Typography variant="labelLarge">12 open</Typography>
      <Typography variant="labelLarge">3 late</Typography>
      <Typography variant="labelLarge">48 closed</Typography>
    </Stack>
  </Stack>
);

/** A node as `dividers` is drawn between the children instead of the hairline. */
export const CustomDivider = () => (
  <Stack
    spacing="s"
    align="center"
    dividers={<Typography variant="labelSmall">or</Typography>}
    padding={16}
    background="surfaceContainerLow"
    radius="medium"
    width={280}
  >
    <Chip label="Continue with email" variant="tonal" onClick={() => {}} />
    <Chip
      label="Continue with a passkey"
      variant="outlined"
      onClick={() => {}}
    />
  </Stack>
);
