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
  width: "100%",
  maxWidth: 380,
};

const MODES = ["filled", "tonal", "outlined"] as const;

// Without a `color`, filled and tonal share the secondary container at rest;
// they part on selection (filled turns tertiary), so both states are shown.
export const Modes = () => (
  <View style={stack}>
    {[false, true].map((selected) => (
      <View key={String(selected)} style={stack}>
        <Typography variant="labelMedium">
          {selected ? "Selected" : "Idle"}
        </Typography>
        <View style={row}>
          {MODES.map((mode) => (
            <Chip
              key={mode}
              label={mode[0].toUpperCase() + mode.slice(1)}
              variant={mode}
              selected={selected}
              onClick={() => {}}
            />
          ))}
        </View>
      </View>
    ))}
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

// 24 / 32 / 40px: the icon, the close glyph and the padding scale with it.
export const Sizes = () => (
  <View style={stack}>
    {(["small", "medium", "large"] as const).map((size) => (
      <View key={size} style={row}>
        <Chip
          label={size[0].toUpperCase() + size.slice(1)}
          size={size}
          icon="tag-outline"
          onClick={() => {}}
        />
        <Chip
          label="Design"
          size={size}
          variant="outlined"
          onClose={() => {}}
        />
      </View>
    ))}
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
