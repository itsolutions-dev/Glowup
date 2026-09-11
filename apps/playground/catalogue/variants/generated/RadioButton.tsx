// GENERATED — do not edit.
// Source: .design-sync/previews/RadioButton.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { RadioButton } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 0,
  width: 340,
};

const noop = () => {};

export const Selection = () => (
  <View style={stack}>
    <RadioButton label="Standard delivery (3–5 days)" selected onPress={noop} />
    <RadioButton
      label="Express delivery (next day)"
      selected={false}
      onPress={noop}
    />
    <RadioButton label="Pick up in store" selected={false} onPress={noop} />
  </View>
);

export const DisabledAndError = () => (
  <View style={stack}>
    <RadioButton label="Bank transfer" selected disabled onPress={noop} />
    <RadioButton
      label="Cash on delivery (unavailable)"
      selected={false}
      disabled
      onPress={noop}
    />
    <RadioButton
      label="Pick a payment method"
      selected={false}
      error
      onPress={noop}
    />
    <RadioButton label="Credit card" selected error onPress={noop} />
  </View>
);

export const LabelPosition = () => (
  <View style={stack}>
    <RadioButton label="Label on the right (default)" selected onPress={noop} />
    <RadioButton
      label="Label on the left"
      labelPosition="left"
      selected
      onPress={noop}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Selection",
    title: "Selection",
    render: Selection,
  },
  {
    name: "DisabledAndError",
    title: "Disabled and error",
    render: DisabledAndError,
  },
  {
    name: "LabelPosition",
    title: "Label position",
    render: LabelPosition,
  },
];
