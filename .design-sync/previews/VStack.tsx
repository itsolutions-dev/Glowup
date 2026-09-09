import React from "react";
import { Button, Typography, VStack } from "@glowup/ui";

export const Spacing = () => (
  <VStack spacing="m" width={360}>
    {(["xs", "s", "m"] as const).map((gap) => (
      <VStack
        key={gap}
        spacing={gap}
        p="s"
        bg="surfaceContainerLow"
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
        p="s"
        bg="surfaceContainerLow"
        radius="medium"
      >
        <Typography variant="labelSmall">align=&quot;{align}&quot;</Typography>
        <Button mode="tonal" onPress={() => {}}>
          Continue
        </Button>
      </VStack>
    ))}
  </VStack>
);

export const FormColumn = () => (
  <VStack spacing="s" p="m" bg="surfaceContainerLow" radius="large" width={360}>
    <Typography variant="titleMedium">Delete workspace</Typography>
    <Typography variant="bodyMedium">
      This removes every component, token and screen. It cannot be undone.
    </Typography>
    <VStack spacing="xs" align="stretch">
      <Button mode="filled" onPress={() => {}}>
        Delete workspace
      </Button>
      <Button mode="text" onPress={() => {}}>
        Cancel
      </Button>
    </VStack>
  </VStack>
);
