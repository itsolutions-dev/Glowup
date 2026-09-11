// GENERATED — do not edit.
// Source: .design-sync/previews/Input.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Input } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 320,
};

const noop = () => {};

export const Variants = () => (
  <View style={stack}>
    <Input
      variant="filled"
      label="Full name"
      placeholder="Ada Lovelace"
      value="Ada Lovelace"
      onChangeText={noop}
    />
    <Input
      variant="outlined"
      label="Company"
      placeholder="Acme Inc."
      value="Acme Inc."
      onChangeText={noop}
    />
  </View>
);

export const WithIcons = () => (
  <View style={stack}>
    <Input
      label="Work email"
      leadingIcon="email-outline"
      value="ada@acme.example"
      onChangeText={noop}
    />
    <Input
      label="Password"
      leadingIcon="lock-outline"
      trailingIcon="eye-off-outline"
      secureTextEntry
      value="correct-horse"
      onChangeText={noop}
      onTrailingIconPress={noop}
    />
    <Input
      label="Net total"
      type="number"
      prefix="€"
      suffix="EUR"
      precision={2}
      value="1240.50"
      onChangeText={noop}
    />
  </View>
);

// NOTE: `disabled` and `readonly` are deliberately not previewed. Input maps them
// to `editable` / `readOnly` only (see packages/ui/src/components/Input.tsx) with no
// visual treatment, so a disabled field is pixel-identical to an enabled one — a cell
// for it would teach a design agent a state the component does not actually render.
export const ValidationStates = () => (
  <View style={stack}>
    <Input
      label="VAT number"
      required
      helperText="11 digits, no country prefix."
      value="0123456789"
      onChangeText={noop}
    />
    <Input
      label="VAT number"
      required
      error="Must be exactly 11 digits."
      value="01234"
      onChangeText={noop}
    />
    <Input
      label="Invoice reference"
      placeholder="Optional"
      helperText="Shown on the PDF and the bank transfer."
      value=""
      onChangeText={noop}
    />
    <Input
      label="Seats"
      type="number"
      maxLength={3}
      helperText="Max 250 per workspace."
      value="24"
      onChangeText={noop}
    />
  </View>
);

export const Multiline = () => (
  <View style={stack}>
    <Input
      label="Delivery notes"
      placeholder="Anything the courier should know?"
      multiline
      numberOfLines={4}
      maxLength={280}
      value={
        "Ring the bell twice — the intercom is broken.\nIf nobody answers, leave it with the concierge."
      }
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
    name: "WithIcons",
    title: "With icons",
    render: WithIcons,
  },
  {
    name: "ValidationStates",
    title: "Validation states",
    render: ValidationStates,
  },
  {
    name: "Multiline",
    title: "Multiline",
    render: Multiline,
  },
];
