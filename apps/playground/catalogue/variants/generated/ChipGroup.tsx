// GENERATED — do not edit.
// Source: .design-sync/previews/ChipGroup.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { ChipGroup, Typography } from "@its/glowup-ui";

const field: ViewStyle = {
  width: 400,
  flexDirection: "column",
  gap: 8,
};

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "review", label: "In review" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived", disabled: true },
];

export const SingleSelect = () => (
  <View style={field}>
    <Typography variant="labelLarge">Status</Typography>
    <ChipGroup
      mode="filled"
      options={STATUSES}
      value="open"
      onValueChange={() => {}}
      accessibilityLabel="Status"
    />
  </View>
);

export const MultiSelect = () => (
  <View style={field}>
    <Typography variant="labelLarge">Status</Typography>
    <ChipGroup
      multiSelect
      options={STATUSES}
      value={["open", "review"]}
      onValueChange={() => {}}
      accessibilityLabel="Status"
    />
  </View>
);

export const WithIcons = () => (
  <View style={field}>
    <Typography variant="labelLarge">Amenities</Typography>
    <ChipGroup
      multiSelect
      mode="outlined"
      options={[
        { value: "wifi", label: "Wi-Fi", icon: "wifi" },
        { value: "parking", label: "Parking", icon: "parking" },
        { value: "pets", label: "Pet friendly", icon: "paw" },
        { value: "pool", label: "Pool", icon: "pool" },
      ]}
      value={["wifi", "pets"]}
      onValueChange={() => {}}
      accessibilityLabel="Amenities"
    />
  </View>
);

export const Scrolling = () => (
  <View style={field}>
    <Typography variant="labelLarge">Category</Typography>
    <ChipGroup
      wrap={false}
      mode="tonal"
      options={[
        { value: "all", label: "All" },
        { value: "design", label: "Design" },
        { value: "engineering", label: "Engineering" },
        { value: "marketing", label: "Marketing" },
        { value: "sales", label: "Sales" },
        { value: "support", label: "Support" },
      ]}
      value="design"
      onValueChange={() => {}}
      accessibilityLabel="Category"
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "SingleSelect",
    title: "Single select",
    render: SingleSelect,
  },
  {
    name: "MultiSelect",
    title: "Multi select",
    render: MultiSelect,
  },
  {
    name: "WithIcons",
    title: "With icons",
    render: WithIcons,
  },
  {
    name: "Scrolling",
    title: "Scrolling",
    render: Scrolling,
  },
];
