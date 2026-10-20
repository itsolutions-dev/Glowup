// GENERATED — do not edit.
// Source: .design-sync/previews/Chip.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Chip, Typography } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
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
    <Chip label="React Native" variant="filled" onClick={() => {}} />
    <Chip label="Expo" variant="tonal" onClick={() => {}} />
    <Chip label="Material You" variant="outlined" onClick={() => {}} />
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
        variant="tonal"
        onClick={() => {}}
      />
      <Chip
        label="Overdue"
        icon="alert-circle-outline"
        variant="tonal"
        onClick={() => {}}
      />
      <Chip
        label="Draft"
        icon="file-document-outline"
        variant="tonal"
        onClick={() => {}}
      />
      <Chip label="This quarter" selected variant="tonal" onClick={() => {}} />
    </View>
  </View>
);

export const Removable = () => (
  <View style={stack}>
    <Typography variant="labelLarge">Recipients</Typography>
    <View style={row}>
      <Chip
        label="marta.rossi@example.com"
        variant="tonal"
        icon="email-outline"
        onClose={() => {}}
      />
      <Chip
        label="Design team"
        variant="tonal"
        icon="account-group-outline"
        onClose={() => {}}
      />
      <Chip label="QA" variant="outlined" onClose={() => {}} />
    </View>
  </View>
);

export const Sizes = () => (
  <View style={stack}>
    <View style={row}>
      <Chip
        label="Medium"
        variant="filled"
        icon="tag-outline"
        onClick={() => {}}
      />
      <Chip label="Medium tonal" variant="tonal" onClick={() => {}} />
    </View>
    <View style={row}>
      <Chip
        label="Small"
        size="small"
        variant="filled"
        icon="tag-outline"
        onClick={() => {}}
      />
      <Chip
        label="Small tonal"
        size="small"
        variant="tonal"
        onClick={() => {}}
      />
      <Chip
        label="Small outlined"
        size="small"
        variant="outlined"
        onClick={() => {}}
      />
    </View>
  </View>
);

export const Disabled = () => (
  <View style={row}>
    <Chip label="Archived" variant="filled" disabled onClick={() => {}} />
    <Chip
      label="Read only"
      variant="tonal"
      disabled
      icon="lock-outline"
      onClick={() => {}}
    />
    <Chip label="Locked tag" variant="outlined" disabled onClose={() => {}} />
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
