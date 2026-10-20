import React from "react";
import { CheckboxGroup } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
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
  <div style={stack}>
    <CheckboxGroup
      label="Notify me by"
      options={channels}
      value={["email", "push"]}
      onChange={noop}
    />
  </div>
);

/** `direction="row"` lays the options out on a line that wraps. */
export const Direction = () => (
  <div style={stack}>
    <CheckboxGroup
      label="Notify me by"
      options={channels}
      value={["sms"]}
      direction="row"
      onChange={noop}
    />
  </div>
);

export const States = () => (
  <div style={stack}>
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
  </div>
);
