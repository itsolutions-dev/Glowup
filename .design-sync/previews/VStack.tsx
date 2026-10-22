import React from "react";
import { Button, Typography, VStack } from "@its/glowup-ui";

export const Spacing = () => (
  <VStack spacing="m" width={360}>
    {(["xs", "s", "m"] as const).map((gap) => (
      <VStack
        key={gap}
        spacing={gap}
        padding={8}
        background="surfaceContainerLow"
        radius="medium"
      >
        <Typography variant="labelSmall">spacing=&quot;{gap}&quot;</Typography>
        <Typography variant="bodySmall">First line</Typography>
        <Typography variant="bodySmall">Second line</Typography>
      </VStack>
    ))}
  </VStack>
);

export const Alignment = () => (
  <VStack spacing="m" width={360}>
    {(["flex-start", "center", "stretch"] as const).map((align) => (
      <VStack
        key={align}
        align={align}
        spacing="xs"
        padding={8}
        background="surfaceContainerLow"
        radius="medium"
      >
        <Typography variant="labelSmall">align=&quot;{align}&quot;</Typography>
        <Button variant="tonal" onClick={() => {}}>
          Continue
        </Button>
      </VStack>
    ))}
  </VStack>
);

export const FormColumn = () => (
  <VStack
    spacing="s"
    padding={16}
    background="surfaceContainerLow"
    radius="large"
    width={360}
  >
    <Typography variant="titleMedium">Delete workspace</Typography>
    <Typography variant="bodyMedium">
      This removes every component, token and screen. It cannot be undone.
    </Typography>
    <VStack spacing="xs" align="stretch">
      <Button variant="filled" color="error" onClick={() => {}}>
        Delete workspace
      </Button>
      <Button variant="text" onClick={() => {}}>
        Cancel
      </Button>
    </VStack>
  </VStack>
);

/** `dividers` draws a hairline between the children. */
export const Dividers = () => (
  <VStack
    spacing="s"
    dividers
    padding={8}
    background="surfaceContainerLow"
    radius="medium"
    width={360}
  >
    <Typography variant="bodyMedium">Profile</Typography>
    <Typography variant="bodyMedium">Notifications</Typography>
    <Typography variant="bodyMedium">Security</Typography>
  </VStack>
);
