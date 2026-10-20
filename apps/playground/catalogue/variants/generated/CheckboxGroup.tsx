// GENERATED — do not edit.
// Source: .design-sync/previews/CheckboxGroup.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { CheckboxGroup } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  width: 340,
};

const noop = () => {};

const channels = [
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
  { label: "Push", value: "push" },
];

/**
 * Several independent choices under one label: the group owns the array of
 * checked values, where `RadioGroup` owns a single one.
 */
export const Basic = () => (
  <View style={stack}>
    <CheckboxGroup
      label="Notify me by"
      options={channels}
      value={["email", "push"]}
      onChange={noop}
    />
  </View>
);

/** `direction="row"` lays the options out on a line that wraps. */
export const Direction = () => (
  <View style={stack}>
    <CheckboxGroup
      label="Notify me by"
      options={channels}
      value={["sms"]}
      direction="row"
      onChange={noop}
    />
  </View>
);

export const States = () => (
  <View style={stack}>
    <CheckboxGroup
      label="Channels"
      options={[
        ...channels,
        { label: "Phone call", value: "call", disabled: true },
      ]}
      value={["email"]}
      helperText="Phone calls are not available on your plan"
      onChange={noop}
    />
    <CheckboxGroup
      label="Channels"
      options={channels}
      value={[]}
      required
      error="Pick at least one channel"
      onChange={noop}
    />
    <CheckboxGroup
      label="Channels (locked)"
      options={channels}
      value={["email", "sms"]}
      disabled
      onChange={noop}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Basic",
    title: "Basic",
    description:
      "Several independent choices under one label: the group owns the array of checked values, where `RadioGroup` owns a single one.",
    render: Basic,
  },
  {
    name: "Direction",
    title: "Direction",
    description: '`direction="row"` lays the options out on a line that wraps.',
    render: Direction,
  },
  {
    name: "States",
    title: "States",
    render: States,
  },
];
