import React from "react";
import { Button, Checkbox, SideSheet, Typography } from "@its/glowup-ui";

// The standard (modal={false}) sheet renders inline beside content; the modal
// sheet portals over the page and cannot be shown inside a card.
const frame: React.CSSProperties = { height: 380, width: 480, display: "flex" };

const content: React.CSSProperties = {
  flex: 1,
  padding: 16,
  display: "flex",
  flexDirection: "column",
};

const filterActions = (
  <>
    <Button onPress={() => {}}>Apply</Button>
    <Button mode="outlined" onPress={() => {}}>
      Reset
    </Button>
  </>
);

export const Filters = () => (
  <div style={frame}>
    <div style={content}>
      <Typography variant="titleMedium">Orders</Typography>
      <Typography variant="bodyMedium">128 results</Typography>
    </div>
    <SideSheet
      modal={false}
      title="Filters"
      width={256}
      onDismiss={() => {}}
      actions={filterActions}
    >
      <Checkbox label="Paid" checked onValueChange={() => {}} />
      <Checkbox label="Due" checked={false} onValueChange={() => {}} />
      <Checkbox label="Overdue" checked onValueChange={() => {}} />
    </SideSheet>
  </div>
);

export const StartSide = () => (
  <div style={frame}>
    <SideSheet
      modal={false}
      side="start"
      title="Details"
      width={256}
      onDismiss={() => {}}
      onBack={() => {}}
    >
      <Typography variant="bodyMedium">
        Invoice #10428 was issued on 3 June and is due in 14 days.
      </Typography>
    </SideSheet>
    <div style={content}>
      <Typography variant="titleMedium">Invoice #10428</Typography>
    </div>
  </div>
);
