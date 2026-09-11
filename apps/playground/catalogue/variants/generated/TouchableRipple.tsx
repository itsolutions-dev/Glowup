// GENERATED — do not edit.
// Source: .design-sync/previews/TouchableRipple.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { TouchableRipple, Typography, Divider } from "@its/glowup-ui";

const panel: ViewStyle = {
  width: 360,
  flexDirection: "column",
  gap: 12,
};

// RNW renders Text as inline-flex, so stacked Typography siblings need an
// explicit column here or they run onto one line.
const inner: ViewStyle = {
  padding: 16,
  flexDirection: "column",
  gap: 4,
};

export const StateLayer = () => (
  <View style={panel}>
    <Typography variant="labelMedium">
      Hover and press — 8% / 12% of the “on” role over the surface
    </Typography>
    <TouchableRipple
      onPress={() => {}}
      accessibilityLabel="Tappable surface"
      borderRadius={12}
    >
      <View style={inner}>
        <Typography variant="bodyLarge">Tappable surface</Typography>
        <Typography variant="bodySmall">
          The layer is derived from the theme, never a hardcoded overlay
        </Typography>
      </View>
    </TouchableRipple>
  </View>
);

export const Borderless = () => (
  <View style={panel}>
    <Typography variant="labelMedium">
      borderless — tints the child without painting a container
    </Typography>
    <TouchableRipple
      onPress={() => {}}
      accessibilityLabel="No container"
      borderless
      borderRadius={12}
    >
      <View style={inner}>
        <Typography variant="bodyLarge">No container background</Typography>
      </View>
    </TouchableRipple>
  </View>
);

export const AsListRows = () => (
  <View style={{ width: 360, flexDirection: "column" }}>
    {["Email digest", "Mentions", "Product updates"].map((label, index) => (
      <React.Fragment key={label}>
        {index > 0 && <Divider contentSpacing={0} />}
        <TouchableRipple onPress={() => {}} accessibilityLabel={label}>
          <View style={{ padding: 14 }}>
            <Typography variant="bodyLarge">{label}</Typography>
          </View>
        </TouchableRipple>
      </React.Fragment>
    ))}
  </View>
);

export const Disabled = () => (
  <View style={panel}>
    <TouchableRipple
      onPress={() => {}}
      accessibilityLabel="Disabled"
      borderRadius={12}
      disabled
    >
      <View style={inner}>
        <Typography variant="bodyLarge">Disabled — no state layer</Typography>
      </View>
    </TouchableRipple>
  </View>
);

export const variants: Variant[] = [
  {
    name: "StateLayer",
    title: "State layer",
    render: StateLayer,
  },
  {
    name: "Borderless",
    title: "Borderless",
    render: Borderless,
  },
  {
    name: "AsListRows",
    title: "As list rows",
    render: AsListRows,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
];
