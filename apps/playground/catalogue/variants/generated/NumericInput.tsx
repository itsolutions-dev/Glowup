// GENERATED — do not edit.
// Source: .design-sync/previews/NumericInput.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { NumericInput } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 320,
};

const noop = () => {};

export const Variants = () => (
  <View style={stack}>
    <NumericInput
      variant="outlined"
      label="Invoice total"
      prefix="€"
      precision={2}
      value="1240.50"
      onChangeText={noop}
    />
    <NumericInput
      variant="filled"
      label="Invoice total"
      prefix="€"
      precision={2}
      value="1240.50"
      onChangeText={noop}
    />
  </View>
);

export const PrefixAndSuffix = () => (
  <View style={stack}>
    <NumericInput
      label="Hourly rate"
      prefix="€"
      suffix="/ h"
      precision={2}
      value="85.00"
      onChangeText={noop}
    />
    <NumericInput
      label="Parcel weight"
      suffix="kg"
      precision={3}
      value="2.450"
      onChangeText={noop}
    />
    <NumericInput
      label="VAT rate"
      suffix="%"
      precision={0}
      value="22"
      onChangeText={noop}
    />
  </View>
);

export const States = () => (
  <View style={stack}>
    <NumericInput
      label="Amount to refund"
      prefix="€"
      placeholder="0.00"
      precision={2}
      value=""
      onChangeText={noop}
    />
    <NumericInput
      label="Discount"
      suffix="%"
      error="Cannot exceed 30%."
      value="45"
      onChangeText={noop}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Variants",
    title: "Variants",
    render: Variants,
  },
  {
    name: "PrefixAndSuffix",
    title: "Prefix and suffix",
    render: PrefixAndSuffix,
  },
  {
    name: "States",
    title: "States",
    render: States,
  },
];
