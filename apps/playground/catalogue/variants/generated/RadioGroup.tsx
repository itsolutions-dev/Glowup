// GENERATED — do not edit.
// Source: .design-sync/previews/RadioGroup.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { RadioGroup } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 20,
  width: 340,
};

const noop = () => {};

const plans = [
  { id: "starter", label: "Starter — €9 / month", value: "starter" },
  { id: "business", label: "Business — €29 / month", value: "business" },
  {
    id: "enterprise",
    label: "Enterprise — contact sales",
    value: "enterprise",
  },
];

export const Column = () => (
  <View style={stack}>
    <RadioGroup
      label="Billing plan"
      options={plans}
      value="business"
      onValueChange={noop}
    />
  </View>
);

export const Row = () => (
  <View style={{ ...stack, width: 400 }}>
    <RadioGroup
      label="Invoice frequency"
      direction="row"
      options={[
        { id: "monthly", label: "Monthly", value: "monthly" },
        { id: "quarterly", label: "Quarterly", value: "quarterly" },
        { id: "yearly", label: "Yearly", value: "yearly" },
      ]}
      value="yearly"
      onValueChange={noop}
    />
  </View>
);

export const WithError = () => (
  <View style={stack}>
    <RadioGroup
      label="Shipping address"
      options={[
        { id: "home", label: "Home — Via Roma 12, Milano", value: "home" },
        {
          id: "office",
          label: "Office — Corso Buenos Aires 4",
          value: "office",
        },
        { id: "new", label: "Add a new address", value: "new" },
      ]}
      value={null}
      onValueChange={noop}
      error="Select an address to continue."
    />
  </View>
);

export const DisabledOptions = () => (
  <View style={stack}>
    <RadioGroup
      label="Support tier"
      options={[
        { id: "email", label: "Email support", value: "email" },
        {
          id: "phone",
          label: "Phone support (Business+)",
          value: "phone",
          disabled: true,
        },
        {
          id: "dedicated",
          label: "Dedicated engineer (Enterprise)",
          value: "dedicated",
          disabled: true,
        },
      ]}
      value="email"
      onValueChange={noop}
    />
    <RadioGroup
      label="Data region (locked by contract)"
      options={[
        { id: "eu", label: "EU (Frankfurt)", value: "eu" },
        { id: "us", label: "US (Virginia)", value: "us" },
      ]}
      value="eu"
      disabled
      onValueChange={noop}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Column",
    title: "Column",
    render: Column,
  },
  {
    name: "Row",
    title: "Row",
    render: Row,
  },
  {
    name: "WithError",
    title: "With error",
    render: WithError,
  },
  {
    name: "DisabledOptions",
    title: "Disabled options",
    render: DisabledOptions,
  },
];
