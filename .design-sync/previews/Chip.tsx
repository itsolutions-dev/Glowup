import React from "react";
import { Chip, Typography } from "@its/glowup-ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  width: 380,
};

export const Modes = () => (
  <div style={row}>
    <Chip label="React Native" mode="filled" onPress={() => {}} />
    <Chip label="Expo" mode="tonal" onPress={() => {}} />
    <Chip label="Material You" mode="outlined" onPress={() => {}} />
  </div>
);

export const FilterRow = () => (
  <div style={stack}>
    <Typography variant="labelLarge">Filter invoices</Typography>
    <div style={row}>
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
    </div>
  </div>
);

export const Removable = () => (
  <div style={stack}>
    <Typography variant="labelLarge">Recipients</Typography>
    <div style={row}>
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
    </div>
  </div>
);

export const Sizes = () => (
  <div style={stack}>
    <div style={row}>
      <Chip
        label="Medium"
        mode="filled"
        icon="tag-outline"
        onPress={() => {}}
      />
      <Chip label="Medium tonal" mode="tonal" onPress={() => {}} />
    </div>
    <div style={row}>
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
    </div>
  </div>
);

export const Disabled = () => (
  <div style={row}>
    <Chip label="Archived" mode="filled" disabled onPress={() => {}} />
    <Chip
      label="Read only"
      mode="tonal"
      disabled
      icon="lock-outline"
      onPress={() => {}}
    />
    <Chip label="Locked tag" mode="outlined" disabled onClose={() => {}} />
  </div>
);
