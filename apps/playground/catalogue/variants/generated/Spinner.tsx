// GENERATED — do not edit.
// Source: .design-sync/previews/Spinner.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Spinner } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  gap: 24,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const noop = () => {};

export const Default = () => (
  <View style={row}>
    <Spinner label="Guests" value={2} min={1} max={12} onChange={noop} />
  </View>
);

export const Steps = () => (
  <View style={row}>
    <Spinner
      label="Quantity"
      value={6}
      step={1}
      min={1}
      max={99}
      onChange={noop}
    />
    <Spinner
      label="Seats (packs of 5)"
      value={25}
      step={5}
      min={5}
      max={100}
      onChange={noop}
    />
  </View>
);

export const AtBounds = () => (
  <View style={row}>
    <Spinner label="Nights" value={1} min={1} max={14} onChange={noop} />
    <Spinner label="Nights" value={14} min={1} max={14} onChange={noop} />
  </View>
);

export const Disabled = () => (
  <View style={row}>
    <Spinner
      label="Licences"
      value={10}
      min={1}
      max={50}
      disabled
      onChange={noop}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Default",
    title: "Default",
    render: Default,
  },
  {
    name: "Steps",
    title: "Steps",
    render: Steps,
  },
  {
    name: "AtBounds",
    title: "At bounds",
    render: AtBounds,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
];
