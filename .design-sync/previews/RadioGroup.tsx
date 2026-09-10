import React from "react";
import { RadioGroup } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
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
  <div style={stack}>
    <RadioGroup
      label="Billing plan"
      options={plans}
      value="business"
      onValueChange={noop}
    />
  </div>
);

export const Row = () => (
  <div style={{ ...stack, width: 400 }}>
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
  </div>
);

export const WithError = () => (
  <div style={stack}>
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
  </div>
);

export const DisabledOptions = () => (
  <div style={stack}>
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
  </div>
);
