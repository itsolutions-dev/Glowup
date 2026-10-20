// GENERATED — do not edit.
// Source: .design-sync/previews/Button.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Button } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

export const Modes = () => (
  <View style={row}>
    <Button variant="filled" onClick={() => {}}>
      Save changes
    </Button>
    <Button variant="tonal" onClick={() => {}}>
      Duplicate
    </Button>
    <Button variant="outlined" onClick={() => {}}>
      Export CSV
    </Button>
    <Button variant="text" onClick={() => {}}>
      Cancel
    </Button>
  </View>
);

export const WithIcons = () => (
  <View style={row}>
    <Button variant="filled" iconName="plus" onClick={() => {}}>
      New invoice
    </Button>
    <Button variant="tonal" iconName="download" onClick={() => {}}>
      Download
    </Button>
    <Button
      variant="outlined"
      iconName="arrow-right"
      iconPosition="end"
      onClick={() => {}}
    >
      Continue
    </Button>
  </View>
);

export const States = () => (
  <View style={row}>
    <Button variant="filled" loading onClick={() => {}}>
      Submitting
    </Button>
    <Button variant="filled" disabled onClick={() => {}}>
      Unavailable
    </Button>
    <Button
      variant="outlined"
      disabled
      iconName="lock-outline"
      onClick={() => {}}
    >
      Locked
    </Button>
  </View>
);

export const FullWidth = () => (
  <View style={{ flexDirection: "column", gap: 12, width: 320 }}>
    <Button variant="filled" fullWidth iconName="check" onClick={() => {}}>
      Confirm booking
    </Button>
    <Button variant="text" fullWidth onClick={() => {}}>
      Not now
    </Button>
  </View>
);

export const WithBadge = () => (
  <View style={row}>
    <Button variant="outlined" iconName="filter-outline">
      Filters
    </Button>
    <Button iconName="filter-variant" badge={3}>
      Filters
    </Button>
    <Button variant="tonal" badge={12}>
      Inbox
    </Button>
    <Button variant="outlined" badge={120}>
      Alerts
    </Button>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Modes",
    title: "Modes",
    render: Modes,
  },
  {
    name: "WithIcons",
    title: "With icons",
    render: WithIcons,
  },
  {
    name: "States",
    title: "States",
    render: States,
  },
  {
    name: "FullWidth",
    title: "Full width",
    render: FullWidth,
  },
  {
    name: "WithBadge",
    title: "With badge",
    render: WithBadge,
  },
];
