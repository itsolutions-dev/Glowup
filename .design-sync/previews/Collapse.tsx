import React from "react";
import { Box, Button, Collapse, Typography, VStack } from "@its/glowup-ui";

const body = (
  <Typography variant="bodyMedium">
    Invoices are issued on the first working day of each month and charged to
    the card on file. Changing the card mid-cycle applies from the next invoice;
    the current one is already committed.
  </Typography>
);

export const OpenAndClosed = () => (
  <VStack spacing="m" width={380}>
    <Box background="surfaceContainerLow" padding={16} radius="medium">
      <Typography variant="labelSmall">open</Typography>
      <Collapse open>{body}</Collapse>
    </Box>
    <Box background="surfaceContainerLow" padding={16} radius="medium">
      <Typography variant="labelSmall">
        closed — height animates to 0
      </Typography>
      <Collapse open={false}>{body}</Collapse>
    </Box>
  </VStack>
);

/** `collapsedHeight` leaves a teaser visible instead of hiding everything. */
export const Peek = () => (
  <Box
    background="surfaceContainerLow"
    padding={16}
    radius="medium"
    width={380}
  >
    <Typography variant="labelSmall">collapsedHeight = 40</Typography>
    <Collapse open={false} collapsedHeight={40} animateOpacity={false}>
      {body}
    </Collapse>
  </Box>
);

export const Interactive = () => {
  const [open, setOpen] = React.useState(true);
  return (
    <VStack
      spacing="s"
      padding={16}
      background="surfaceContainerLow"
      radius="medium"
      width={380}
    >
      <Typography variant="titleMedium">Billing preferences</Typography>
      <Collapse open={open}>{body}</Collapse>
      <Button variant="text" onClick={() => setOpen((o) => !o)}>
        {open ? "Show less" : "Show more"}
      </Button>
    </VStack>
  );
};
