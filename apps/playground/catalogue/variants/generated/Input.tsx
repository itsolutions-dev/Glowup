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
      onChange={noop}
    />
    <Input
      variant="outlined"
      label="Company"
      placeholder="Acme Inc."
      value="Acme Inc."
      onChange={noop}
    />
  </View>
);

export const WithIcons = () => (
  <View style={stack}>
    <Input
      label="Work email"
      leadingIcon="email-outline"
      value="ada@acme.example"
      onChange={noop}
    />
    <Input
      label="Password"
      leadingIcon="lock-outline"
      trailingIcon="eye-off-outline"
      secureTextEntry
      value="correct-horse"
      onChange={noop}
      onTrailingIconPress={noop}
    />
    <Input
      label="Net total"
      type="number"
      prefix="€"
      suffix="EUR"
      precision={2}
      value="1240.50"
      onChange={noop}
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
      onChange={noop}
    />
    <Input
      label="VAT number"
      required
      error="Must be exactly 11 digits."
      value="01234"
      onChange={noop}
    />
    <Input
      label="Invoice reference"
      placeholder="Optional"
      helperText="Shown on the PDF and the bank transfer."
      value=""
      onChange={noop}
    />
    <Input
      label="Seats"
      type="number"
      maxLength={3}
      helperText="Max 250 per workspace."
      value="24"
      onChange={noop}
    />
  </View>
);

export const Multiline = () => (
  <View style={stack}>
    <Input
      label="Delivery notes"
      placeholder="Anything the courier should know?"
      multiline
      rows={4}
      maxLength={280}
      value={
        "Ring the bell twice — the intercom is broken.\nIf nobody answers, leave it with the concierge."
      }
      onChange={noop}
    />
  </View>
);

export const DecimalComma = () => (
  <View style={stack}>
    <Input
      type="number"
      label="Amount (decimal comma)"
      decimalSeparator=","
      precision={2}
      suffix="€"
      value="1250.50"
      onChange={noop}
    />
    <Input
      type="number"
      label="Amount (decimal point)"
      precision={2}
      suffix="€"
      value="1250.50"
      onChange={noop}
    />
  </View>
);

export const UpperCaseAndReservedHelper = () => (
  <View style={stack}>
    <Input
      label="Tax code"
      allUpperCase
      reserveHelperText
      value="RSSMRA80A01H501U"
      onChange={noop}
    />
    <Input
      label="Plate"
      allUpperCase
      reserveHelperText
      error="Not a valid plate"
      value="AB123C"
      onChange={noop}
    />
    <Input label="Next field" value="" onChange={noop} />
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
  {
    name: "DecimalComma",
    title: "Decimal comma",
    render: DecimalComma,
  },
  {
    name: "UpperCaseAndReservedHelper",
    title: "Upper case and reserved helper",
    render: UpperCaseAndReservedHelper,
  },
];
