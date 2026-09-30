// GENERATED — do not edit.
// Source: .design-sync/previews/SideSheet.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Button, Checkbox, SideSheet, Typography } from "@its/glowup-ui";

// The standard (modal={false}) sheet renders inline beside content; the modal
// sheet portals over the page and cannot be shown inside a card.
const frame: ViewStyle = { height: 380, width: 480, flexDirection: "row" };

const content: ViewStyle = {
  flex: 1,
  padding: 16,
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
  <View style={frame}>
    <View style={content}>
      <Typography variant="titleMedium">Orders</Typography>
      <Typography variant="bodyMedium">128 results</Typography>
    </View>
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
  </View>
);

export const StartSide = () => (
  <View style={frame}>
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
    <View style={content}>
      <Typography variant="titleMedium">Invoice #10428</Typography>
    </View>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Filters",
    title: "Filters",
    render: Filters,
  },
  {
    name: "StartSide",
    title: "Start side",
    render: StartSide,
  },
];
