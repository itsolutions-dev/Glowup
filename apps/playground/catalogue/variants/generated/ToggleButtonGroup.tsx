// GENERATED — do not edit.
// Source: .design-sync/previews/ToggleButtonGroup.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { ToggleButtonGroup, Typography } from "@its/glowup-ui";

const field: ViewStyle = {
  flexDirection: "column",
  gap: 4,
  alignItems: "flex-start",
};

export const ViewMode = () => (
  <View style={field}>
    <Typography variant="labelLarge">Layout</Typography>
    <ToggleButtonGroup
      value="list"
      onValueChange={() => {}}
      options={[
        { label: "List", icon: "format-list-bulleted", value: "list" },
        { label: "Grid", icon: "view-grid-outline", value: "grid" },
        { label: "Cards", icon: "card-outline", value: "cards" },
      ]}
    />
  </View>
);

export const LabelsOnly = () => (
  <View style={field}>
    <Typography variant="labelLarge">Report period</Typography>
    <ToggleButtonGroup
      value="week"
      onValueChange={() => {}}
      options={[
        { label: "Day", value: "day" },
        { label: "Week", value: "week" },
        { label: "Month", value: "month" },
        { label: "Year", value: "year" },
      ]}
    />
  </View>
);

export const IconsOnly = () => (
  <View style={field}>
    <Typography variant="labelLarge">Alignment</Typography>
    <ToggleButtonGroup
      value="center"
      onValueChange={() => {}}
      options={[
        { icon: "format-align-left", value: "left" },
        { icon: "format-align-center", value: "center" },
        { icon: "format-align-right", value: "right" },
        { icon: "format-align-justify", value: "justify" },
      ]}
    />
  </View>
);

export const MultiSelect = () => (
  <View style={field}>
    <Typography variant="labelLarge">Text style</Typography>
    <ToggleButtonGroup
      multiSelect
      value={["bold", "underline"]}
      onValueChange={() => {}}
      options={[
        { icon: "format-bold", value: "bold" },
        { icon: "format-italic", value: "italic" },
        { icon: "format-underline", value: "underline" },
        { icon: "format-strikethrough", value: "strike" },
      ]}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "ViewMode",
    title: "View mode",
    render: ViewMode,
  },
  {
    name: "LabelsOnly",
    title: "Labels only",
    render: LabelsOnly,
  },
  {
    name: "IconsOnly",
    title: "Icons only",
    render: IconsOnly,
  },
  {
    name: "MultiSelect",
    title: "Multi select",
    render: MultiSelect,
  },
];
