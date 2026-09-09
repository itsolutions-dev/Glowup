import React from "react";
import { Avatar, Button, Chip, HStack, Typography } from "@glowup/ui";

export const Spacing = () => (
  <HStack spacing="m" align="center" width={480} wrap>
    <Typography variant="labelSmall">spacing=&quot;m&quot;</Typography>
    <Chip label="Paid" mode="tonal" onPress={() => {}} />
    <Chip label="Overdue" mode="outlined" onPress={() => {}} />
    <Chip label="Draft" mode="outlined" onPress={() => {}} />
  </HStack>
);

export const Alignment = () => (
  <HStack spacing="l" width={480} wrap>
    {(["flex-start", "center", "flex-end"] as const).map((align) => (
      <HStack
        key={align}
        align={align}
        spacing="s"
        p="s"
        bg="surfaceContainerLow"
        radius="medium"
        height={96}
      >
        <Avatar name="Ada Lovelace" size={28} />
        <Avatar name="Grace Hopper" size={44} />
        <Typography variant="labelSmall">{align}</Typography>
      </HStack>
    ))}
  </HStack>
);

export const ToolbarRow = () => (
  <HStack
    justify="space-between"
    align="center"
    p="m"
    bg="surfaceContainerLow"
    radius="medium"
    width={480}
  >
    <Typography variant="titleMedium">Invoices</Typography>
    <HStack spacing="s">
      <Button mode="text" onPress={() => {}}>
        Export
      </Button>
      <Button mode="filled" iconName="plus" onPress={() => {}}>
        New
      </Button>
    </HStack>
  </HStack>
);
