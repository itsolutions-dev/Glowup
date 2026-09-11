// GENERATED — do not edit.
// Source: .design-sync/previews/Toggle.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Toggle, Typography } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 340,
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
      <Toggle value width={48} height={28} onValueChange={noop} />
    </View>
    <View style={row}>
      <Typography variant="bodyLarge">Push notifications</Typography>
      <Toggle value={false} width={48} height={28} onValueChange={noop} />
    </View>
    <View style={row}>
      <Typography variant="bodyLarge">Weekly summary</Typography>
      <Toggle value width={48} height={28} onValueChange={noop} />
    </View>
  </View>
);

export const OnOffDisabled = () => (
  <View style={stack}>
    <View style={row}>
      <Typography variant="bodyLarge">Dark theme</Typography>
      <Toggle value width={48} height={28} onValueChange={noop} />
    </View>
    <View style={row}>
      <Typography variant="bodyLarge">Reduced motion</Typography>
      <Toggle value={false} width={48} height={28} onValueChange={noop} />
    </View>
    <View style={row}>
      <Typography variant="bodyLarge">Audit logging (enforced)</Typography>
      <Toggle value disabled width={48} height={28} onValueChange={noop} />
    </View>
    <View style={row}>
      <Typography variant="bodyLarge">
        Beta features (Enterprise only)
      </Typography>
      <Toggle
        value={false}
        disabled
        width={48}
        height={28}
        onValueChange={noop}
      />
    </View>
  </View>
);

export const Sizes = () => (
  <View style={stack}>
    <View style={row}>
      <Typography variant="bodyMedium">Compact — 32 × 18 (default)</Typography>
      <Toggle value onValueChange={noop} />
    </View>
    <View style={row}>
      <Typography variant="bodyMedium">Standard — 48 × 28</Typography>
      <Toggle value width={48} height={28} onValueChange={noop} />
    </View>
    <View style={row}>
      <Typography variant="bodyMedium">Large — 64 × 36</Typography>
      <Toggle value width={64} height={36} onValueChange={noop} />
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
