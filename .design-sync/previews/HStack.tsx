import React from "react";
import { Avatar, Button, Chip, HStack, Typography } from "@its/glowup-ui";

export const Spacing = () => (
  <HStack spacing="m" align="center" width={480} wrap>
    <Typography variant="labelSmall">spacing=&quot;m&quot;</Typography>
    <Chip label="Paid" variant="tonal" onClick={() => {}} />
    <Chip label="Overdue" variant="outlined" onClick={() => {}} />
    <Chip label="Draft" variant="outlined" onClick={() => {}} />
  </HStack>
);

export const Alignment = () => (
  <HStack spacing="l" width={480} wrap>
    {(["flex-start", "center", "flex-end"] as const).map((align) => (
      <HStack
        key={align}
        align={align}
        spacing="s"
        padding={8}
        background="surfaceContainerLow"
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
    padding={16}
    background="surfaceContainerLow"
    radius="medium"
    width={480}
  >
    <Typography variant="titleMedium">Invoices</Typography>
    <HStack spacing="s">
      <Button variant="text" onClick={() => {}}>
        Export
      </Button>
      <Button variant="filled" iconName="plus" onClick={() => {}}>
        New
      </Button>
    </HStack>
  </HStack>
);
