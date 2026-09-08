import React from "react";
import { Select } from "@glowup/ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 340,
};

const noop = () => {};

const countries = [
  { id: "it", label: "Italy", value: "it", icon: "flag-outline" as const },
  { id: "fr", label: "France", value: "fr", icon: "flag-outline" as const },
  { id: "de", label: "Germany", value: "de", icon: "flag-outline" as const },
  { id: "es", label: "Spain", value: "es", icon: "flag-outline" as const },
];

const plans = [
  { id: "free", label: "Free", value: "free" },
  { id: "pro", label: "Pro — €19/mo", value: "pro" },
  { id: "team", label: "Team — €49/mo", value: "team" },
  { id: "ent", label: "Enterprise", value: "ent" },
];

const notifications = [
  { id: "email", label: "Email", value: "email", icon: "email-outline" as const },
  { id: "push", label: "Push", value: "push", icon: "cellphone-link" as const },
  { id: "sms", label: "SMS", value: "sms", icon: "message-outline" as const },
  { id: "slack", label: "Slack", value: "slack", icon: "pound" as const },
];

export const Variants = () => (
  <div style={stack}>
    <Select
      variant="outlined"
      label="Billing country"
      options={countries}
      value="it"
      onSelect={noop}
    />
    <Select
      variant="filled"
      label="Billing country"
      options={countries}
      value="fr"
      onSelect={noop}
    />
  </div>
);

export const States = () => (
  <div style={stack}>
    <Select
      label="Subscription plan"
      placeholder="Choose a plan…"
      options={plans}
      value={undefined}
      onSelect={noop}
    />
    <Select
      label="Subscription plan"
      error="Pick a plan to continue."
      placeholder="Choose a plan…"
      options={plans}
      value={undefined}
      onSelect={noop}
    />
    <Select
      label="Subscription plan"
      disabled
      options={plans}
      value="ent"
      onSelect={noop}
    />
  </div>
);

export const MultiSelect = () => (
  <div style={stack}>
    <Select
      label="Notify me via"
      multiSelect
      placeholder="Select channels"
      options={notifications}
      value={undefined}
      selectedValues={["email", "push"]}
      toggleOptions={noop}
      onSelect={noop}
    />
    <Select
      label="Notify me via"
      multiSelect
      placeholder="Select channels"
      options={notifications}
      value={undefined}
      selectedValues={["email", "push", "slack"]}
      toggleOptions={noop}
      onSelect={noop}
    />
  </div>
);

export const MultiSelectChips = () => (
  <div style={stack}>
    <Select
      label="Shipping destinations"
      multiSelect
      showAsChips
      placeholder="Select countries"
      options={countries}
      value={undefined}
      selectedValues={["it", "fr", "es"]}
      toggleOptions={noop}
      onSelect={noop}
    />
  </div>
);
