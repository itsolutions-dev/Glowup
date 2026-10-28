import React from "react";
import { Switch, Typography } from "@its/glowup-ui";

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
      <Switch value width={48} height={28} onChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Push notifications</Typography>
      <Switch value={false} width={48} height={28} onChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Weekly summary</Typography>
      <Switch value width={48} height={28} onChange={noop} />
    </div>
  </div>
);

export const OnOffDisabled = () => (
  <div style={stack}>
    <div style={row}>
      <Typography variant="bodyLarge">Dark theme</Typography>
      <Switch value width={48} height={28} onChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Reduced motion</Typography>
      <Switch value={false} width={48} height={28} onChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Audit logging (enforced)</Typography>
      <Switch value disabled width={48} height={28} onChange={noop} />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">
        Beta features (Enterprise only)
      </Typography>
      <Switch value={false} disabled width={48} height={28} onChange={noop} />
    </div>
  </div>
);

/** `size` picks a preset track; `width` / `height` override it, as the settings rows above do. */
export const Sizes = () => (
  <div style={stack}>
    <Switch size="small" label="Small — 24 × 14" value onChange={noop} />
    <Switch label="Medium — 32 × 18 (default)" value onChange={noop} />
    <Switch size="large" label="Large — 40 × 22" value onChange={noop} />
    <Switch
      label="Custom — width 48, height 28"
      width={48}
      height={28}
      value
      onChange={noop}
    />
  </div>
);
