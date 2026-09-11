// GENERATED — do not edit.
// Source: .design-sync/previews/Button.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Button } from "@its/glowup-ui";

const row: ViewStyle = {
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

export const Modes = () => (
  <View style={row}>
    <Button mode="filled" onPress={() => {}}>
      Save changes
    </Button>
    <Button mode="tonal" onPress={() => {}}>
      Duplicate
    </Button>
    <Button mode="outlined" onPress={() => {}}>
      Export CSV
    </Button>
    <Button mode="text" onPress={() => {}}>
      Cancel
    </Button>
  </View>
);

export const WithIcons = () => (
  <View style={row}>
    <Button mode="filled" iconName="plus" onPress={() => {}}>
      New invoice
    </Button>
    <Button mode="tonal" iconName="download" onPress={() => {}}>
      Download
    </Button>
    <Button
      mode="outlined"
      iconName="arrow-right"
      iconPosition="right"
      onPress={() => {}}
    >
      Continue
    </Button>
  </View>
);

export const States = () => (
  <View style={row}>
    <Button mode="filled" loading onPress={() => {}}>
      Submitting
    </Button>
    <Button mode="filled" disabled onPress={() => {}}>
      Unavailable
    </Button>
    <Button mode="outlined" disabled iconName="lock-outline" onPress={() => {}}>
      Locked
    </Button>
  </View>
);

export const FullWidth = () => (
  <View style={{ flexDirection: "column", gap: 12, width: 320 }}>
    <Button mode="filled" fullWidth iconName="check" onPress={() => {}}>
      Confirm booking
    </Button>
    <Button mode="text" fullWidth onPress={() => {}}>
      Not now
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
];
