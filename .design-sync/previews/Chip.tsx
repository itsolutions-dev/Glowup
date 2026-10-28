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

const MODES = ["filled", "tonal", "outlined"] as const;

// Without a `color`, filled and tonal share the secondary container at rest;
// they part on selection (filled turns tertiary), so both states are shown.
export const Modes = () => (
  <div style={stack}>
    {[false, true].map((selected) => (
      <div key={String(selected)} style={stack}>
        <Typography variant="labelMedium">
          {selected ? "Selected" : "Idle"}
        </Typography>
        <div style={row}>
          {MODES.map((mode) => (
            <Chip
              key={mode}
              label={mode[0].toUpperCase() + mode.slice(1)}
              variant={mode}
              selected={selected}
              onClick={() => {}}
            />
          ))}
        </div>
      </div>
    ))}
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

// 24 / 32 / 40px: the icon, the close glyph and the padding scale with it.
export const Sizes = () => (
  <div style={stack}>
    {(["small", "medium", "large"] as const).map((size) => (
      <div key={size} style={row}>
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
      </div>
    ))}
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
