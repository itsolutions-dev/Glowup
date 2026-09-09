import React from "react";
import { Toggle, Typography } from "@glowup/ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 340,
};

const row: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
};

const noop = () => {};

export const SettingsList = () => (
  <div style={stack}>
    <div style={row}>
      <Typography variant="bodyLarge">Email notifications</Typography>
      <Toggle value width={48} height={28} onValueChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Push notifications</Typography>
      <Toggle value={false} width={48} height={28} onValueChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Weekly summary</Typography>
      <Toggle value width={48} height={28} onValueChange={noop} />
    </div>
  </div>
);

export const OnOffDisabled = () => (
  <div style={stack}>
    <div style={row}>
      <Typography variant="bodyLarge">Dark theme</Typography>
      <Toggle value width={48} height={28} onValueChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Reduced motion</Typography>
      <Toggle value={false} width={48} height={28} onValueChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Audit logging (enforced)</Typography>
      <Toggle value disabled width={48} height={28} onValueChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Beta features (Enterprise only)</Typography>
      <Toggle value={false} disabled width={48} height={28} onValueChange={noop} />
    </div>
  </div>
);

export const Sizes = () => (
  <div style={stack}>
    <div style={row}>
      <Typography variant="bodyMedium">Compact — 32 × 18 (default)</Typography>
      <Toggle value onValueChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyMedium">Standard — 48 × 28</Typography>
      <Toggle value width={48} height={28} onValueChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyMedium">Large — 64 × 36</Typography>
      <Toggle value width={64} height={36} onValueChange={noop} />
    </div>
  </div>
);
