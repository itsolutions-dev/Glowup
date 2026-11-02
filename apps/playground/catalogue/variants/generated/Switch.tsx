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

export const Sizes = () => (
  <View style={stack}>
    <View style={row}>
      <Typography variant="bodyMedium">Compact — 32 × 18 (default)</Typography>
      <Switch
        accessibilityLabel="Compact — 32 × 18 (default)"
        value
        onChange={noop}
      />
    </View>
    <View style={row}>
      <Typography variant="bodyMedium">Standard — 48 × 28</Typography>
      <Switch
        accessibilityLabel="Standard — 48 × 28"
        value
        width={48}
        height={28}
        onChange={noop}
      />
    </View>
    <View style={row}>
      <Typography variant="bodyMedium">Large — 64 × 36</Typography>
      <Switch
        accessibilityLabel="Large — 64 × 36"
        value
        width={64}
        height={36}
        onChange={noop}
      />
    </View>
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
    render: Sizes,
  },
];
