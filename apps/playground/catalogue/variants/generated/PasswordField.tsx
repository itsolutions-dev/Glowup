// GENERATED — do not edit.
// Source: .design-sync/previews/PasswordField.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { PasswordField } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 320,
};

const noop = () => {};

export const HiddenAndRevealed = () => (
  <View style={stack}>
    <PasswordField label="Password" value="correct-horse" onChange={noop} />
    <PasswordField
      label="Password"
      value="correct-horse"
      onChange={noop}
      defaultVisible
    />
  </View>
);

export const Variants = () => (
  <View style={stack}>
    <PasswordField
      variant="outlined"
      label="Outlined"
      value="correct-horse"
      onChange={noop}
    />
    <PasswordField
      variant="filled"
      label="Filled"
      value="correct-horse"
      onChange={noop}
    />
    <PasswordField
      label="Dense"
      density="dense"
      value="correct-horse"
      onChange={noop}
    />
  </View>
);

export const ValidationStates = () => (
  <View style={stack}>
    <PasswordField
      label="Password"
      required
      helperText="At least 8 characters."
      value=""
      onChange={noop}
      placeholder="Your password"
    />
    <PasswordField
      label="Password"
      required
      error="Wrong password. 2 tries left."
      value="hunter2"
      onChange={noop}
    />
    <PasswordField label="Password" disabled value="hunter2" onChange={noop} />
  </View>
);

export const StrengthMeter = () => (
  <View style={stack}>
    <PasswordField
      label="New password"
      autoComplete="new-password"
      showStrength
      value="abc"
      onChange={noop}
    />
    <PasswordField
      label="New password"
      autoComplete="new-password"
      showStrength
      value="abcdefghijkl"
      onChange={noop}
    />
    <PasswordField
      label="New password"
      autoComplete="new-password"
      showStrength
      value="Tr0ub4dor&3"
      onChange={noop}
    />
    <PasswordField
      label="New password"
      autoComplete="new-password"
      showStrength
      value="Zx9!kQ2#mWp4"
      onChange={noop}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "HiddenAndRevealed",
    title: "Hidden and revealed",
    render: HiddenAndRevealed,
  },
  {
    name: "Variants",
    title: "Variants",
    render: Variants,
  },
  {
    name: "ValidationStates",
    title: "Validation states",
    render: ValidationStates,
  },
  {
    name: "StrengthMeter",
    title: "Strength meter",
    render: StrengthMeter,
  },
];
