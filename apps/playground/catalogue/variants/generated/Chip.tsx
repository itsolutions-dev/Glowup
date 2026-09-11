// GENERATED — do not edit.
// Source: .design-sync/previews/Chip.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Chip, Typography } from "@its/glowup-ui";

const row: ViewStyle = {
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 12,
  width: 380,
};

export const Modes = () => (
  <View style={row}>
    <Chip label="React Native" mode="filled" onPress={() => {}} />
    <Chip label="Expo" mode="tonal" onPress={() => {}} />
    <Chip label="Material You" mode="outlined" onPress={() => {}} />
  </View>
);

export const FilterRow = () => (
  <View style={stack}>
    <Typography variant="labelLarge">Filter invoices</Typography>
    <View style={row}>
      <Chip
        label="Paid"
        icon="check-circle-outline"
        selected
        mode="tonal"
        onPress={() => {}}
      />
      <Chip
        label="Overdue"
        icon="alert-circle-outline"
        mode="tonal"
        onPress={() => {}}
      />
      <Chip
        label="Draft"
        icon="file-document-outline"
        mode="tonal"
        onPress={() => {}}
      />
      <Chip label="This quarter" selected mode="tonal" onPress={() => {}} />
    </View>
  </View>
);

export const Removable = () => (
  <View style={stack}>
    <Typography variant="labelLarge">Recipients</Typography>
    <View style={row}>
      <Chip
        label="marta.rossi@example.com"
        mode="tonal"
        icon="email-outline"
        onClose={() => {}}
      />
      <Chip
        label="Design team"
        mode="tonal"
        icon="account-group-outline"
        onClose={() => {}}
      />
      <Chip label="QA" mode="outlined" onClose={() => {}} />
    </View>
  </View>
);

export const Sizes = () => (
  <View style={stack}>
    <View style={row}>
      <Chip
        label="Medium"
        mode="filled"
        icon="tag-outline"
        onPress={() => {}}
      />
      <Chip label="Medium tonal" mode="tonal" onPress={() => {}} />
    </View>
    <View style={row}>
      <Chip
        label="Small"
        size="small"
        mode="filled"
        icon="tag-outline"
        onPress={() => {}}
      />
      <Chip label="Small tonal" size="small" mode="tonal" onPress={() => {}} />
      <Chip
        label="Small outlined"
        size="small"
        mode="outlined"
        onPress={() => {}}
      />
    </View>
  </View>
);

export const Disabled = () => (
  <View style={row}>
    <Chip label="Archived" mode="filled" disabled onPress={() => {}} />
    <Chip
      label="Read only"
      mode="tonal"
      disabled
      icon="lock-outline"
      onPress={() => {}}
    />
    <Chip label="Locked tag" mode="outlined" disabled onClose={() => {}} />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Modes",
    title: "Modes",
    render: Modes,
  },
  {
    name: "FilterRow",
    title: "Filter row",
    render: FilterRow,
  },
  {
    name: "Removable",
    title: "Removable",
    render: Removable,
  },
  {
    name: "Sizes",
    title: "Sizes",
    render: Sizes,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
];
