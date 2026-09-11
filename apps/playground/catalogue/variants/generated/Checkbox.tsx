// GENERATED — do not edit.
// Source: .design-sync/previews/Checkbox.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Checkbox } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 4,
  width: 340,
};

const noop = () => {};

export const States = () => (
  <View style={stack}>
    <Checkbox
      label="Send me the weekly digest"
      checked={false}
      onValueChange={noop}
    />
    <Checkbox
      label="Remember this device for 30 days"
      checked
      onValueChange={noop}
    />
    <Checkbox
      label="Notify my team (2 of 5 selected)"
      checked={false}
      indeterminate
      onValueChange={noop}
    />
  </View>
);

export const SelectAllTree = () => (
  <View style={stack}>
    <Checkbox
      label="All notifications"
      checked={false}
      indeterminate
      onValueChange={noop}
    />
    <View style={{ ...stack, width: "auto", marginLeft: 28 }}>
      <Checkbox label="Invoice issued" checked onValueChange={noop} />
      <Checkbox label="Payment received" checked onValueChange={noop} />
      <Checkbox label="Payment overdue" checked={false} onValueChange={noop} />
    </View>
  </View>
);

export const DisabledAndError = () => (
  <View style={stack}>
    <Checkbox
      label="Enterprise SSO (contact sales)"
      checked={false}
      disabled
      onValueChange={noop}
    />
    <Checkbox
      label="Two-factor authentication (enforced)"
      checked
      disabled
      onValueChange={noop}
    />
    <Checkbox
      label="I accept the terms of service"
      checked={false}
      error
      onValueChange={noop}
    />
  </View>
);

export const LabelPosition = () => (
  <View style={stack}>
    <Checkbox
      label="Label on the right (default)"
      checked
      onValueChange={noop}
    />
    <Checkbox
      label="Label on the left"
      labelPosition="left"
      checked
      onValueChange={noop}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "States",
    title: "States",
    render: States,
  },
  {
    name: "SelectAllTree",
    title: "Select all tree",
    render: SelectAllTree,
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
