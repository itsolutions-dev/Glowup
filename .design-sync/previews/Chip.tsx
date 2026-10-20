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
    <Chip label="React Native" variant="filled" onClick={() => {}} />
    <Chip label="Expo" variant="tonal" onClick={() => {}} />
    <Chip label="Material You" variant="outlined" onClick={() => {}} />
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
    </div>
  </div>
);

export const Removable = () => (
  <div style={stack}>
    <Typography variant="labelLarge">Recipients</Typography>
    <div style={row}>
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
    </div>
  </div>
);

export const Sizes = () => (
  <div style={stack}>
    <div style={row}>
      <Chip
        label="Medium"
        variant="filled"
        icon="tag-outline"
        onClick={() => {}}
      />
      <Chip label="Medium tonal" variant="tonal" onClick={() => {}} />
    </div>
    <div style={row}>
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
    </div>
  </div>
);

export const Disabled = () => (
  <div style={row}>
    <Chip label="Archived" variant="filled" disabled onClick={() => {}} />
    <Chip
      label="Read only"
      variant="tonal"
      disabled
      icon="lock-outline"
      onClick={() => {}}
    />
    <Chip label="Locked tag" variant="outlined" disabled onClose={() => {}} />
  </div>
);
