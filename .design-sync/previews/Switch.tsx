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
      <Switch
        accessibilityLabel="Email notifications"
        value
        width={48}
        height={28}
        onChange={noop}
      />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Push notifications</Typography>
      <Switch
        accessibilityLabel="Push notifications"
        value={false}
        width={48}
        height={28}
        onChange={noop}
      />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Weekly summary</Typography>
      <Switch
        accessibilityLabel="Weekly summary"
        value
        width={48}
        height={28}
        onChange={noop}
      />
    </div>
  </div>
);

export const OnOffDisabled = () => (
  <div style={stack}>
    <div style={row}>
      <Typography variant="bodyLarge">Dark theme</Typography>
      <Switch
        accessibilityLabel="Dark theme"
        value
        width={48}
        height={28}
        onChange={noop}
      />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Reduced motion</Typography>
      <Switch
        accessibilityLabel="Reduced motion"
        value={false}
        width={48}
        height={28}
        onChange={noop}
      />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">Audit logging (enforced)</Typography>
      <Switch
        accessibilityLabel="Audit logging (enforced)"
        value
        disabled
        width={48}
        height={28}
        onChange={noop}
      />
    </div>
    <div style={row}>
      <Typography variant="bodyLarge">
        Beta features (Enterprise only)
      </Typography>
      <Switch
        accessibilityLabel="Beta features (Enterprise only)"
        value={false}
        disabled
        width={48}
        height={28}
        onChange={noop}
      />
    </div>
  </div>
);

export const Sizes = () => (
  <div style={stack}>
    <div style={row}>
      <Typography variant="bodyMedium">Compact — 32 × 18 (default)</Typography>
      <Switch
        accessibilityLabel="Compact — 32 × 18 (default)"
        value
        onChange={noop}
      />
    </div>
    <div style={row}>
      <Typography variant="bodyMedium">Standard — 48 × 28</Typography>
      <Switch
        accessibilityLabel="Standard — 48 × 28"
        value
        width={48}
        height={28}
        onChange={noop}
      />
    </div>
    <div style={row}>
      <Typography variant="bodyMedium">Large — 64 × 36</Typography>
      <Switch
        accessibilityLabel="Large — 64 × 36"
        value
        width={64}
        height={36}
        onChange={noop}
      />
    </div>
  </div>
);
