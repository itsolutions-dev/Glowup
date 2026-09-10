import React from "react";
import { Checkbox } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  width: 340,
};

const noop = () => {};

export const States = () => (
  <div style={stack}>
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
  </div>
);

export const SelectAllTree = () => (
  <div style={stack}>
    <Checkbox
      label="All notifications"
      checked={false}
      indeterminate
      onValueChange={noop}
    />
    <div style={{ ...stack, width: "auto", marginLeft: 28 }}>
      <Checkbox label="Invoice issued" checked onValueChange={noop} />
      <Checkbox label="Payment received" checked onValueChange={noop} />
      <Checkbox label="Payment overdue" checked={false} onValueChange={noop} />
    </div>
  </div>
);

export const DisabledAndError = () => (
  <div style={stack}>
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
  </div>
);

export const LabelPosition = () => (
  <div style={stack}>
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
  </div>
);
