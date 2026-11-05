// GENERATED — do not edit.
// Source: .design-sync/previews/Switch.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Switch, Typography } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: "100%",
  maxWidth: 340,
};

const row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
};

const noop = () => {};

export const SettingsList = () => (
  <View style={stack}>
    <View style={row}>
      <Typography variant="bodyLarge">Email notifications</Typography>
      <Switch
        accessibilityLabel="Email notifications"
        value
        width={48}
        height={28}
        onChange={noop}
      />
    </View>
    <View style={row}>
      <Typography variant="bodyLarge">Push notifications</Typography>
      <Switch
        accessibilityLabel="Push notifications"
        value={false}
        width={48}
        height={28}
        onChange={noop}
      />
    </View>
    <View style={row}>
      <Typography variant="bodyLarge">Weekly summary</Typography>
      <Switch
        accessibilityLabel="Weekly summary"
        value
        width={48}
        height={28}
        onChange={noop}
      />
    </View>
  </View>
);

export const OnOffDisabled = () => (
  <View style={stack}>
    <View style={row}>
      <Typography variant="bodyLarge">Dark theme</Typography>
      <Switch
        accessibilityLabel="Dark theme"
        value
        width={48}
        height={28}
        onChange={noop}
      />
    </View>
    <View style={row}>
      <Typography variant="bodyLarge">Reduced motion</Typography>
      <Switch
        accessibilityLabel="Reduced motion"
        value={false}
        width={48}
        height={28}
        onChange={noop}
      />
    </View>
    <View style={row}>
      <Typography variant="bodyLarge">Audit logging (enforced)</Typography>
      <Switch
        accessibilityLabel="Audit logging (enforced)"
        value
        disabled
        width={48}
        height={28}
        onChange={noop}
      />
    </View>
    <View style={row}>
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
    </View>
  </View>
);

/** `size` picks a preset track; `width` / `height` override it, as the settings rows above do. */
export const Sizes = () => (
  <View style={stack}>
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
  </View>
);

export const variants: Variant[] = [
  {
    name: "SettingsList",
    title: "Settings list",
    render: SettingsList,
  },
  {
    name: "OnOffDisabled",
    title: "On off disabled",
    render: OnOffDisabled,
  },
  {
    name: "Sizes",
    title: "Sizes",
    description:
      "`size` picks a preset track; `width` / `height` override it, as the settings rows above do.",
    render: Sizes,
  },
];
