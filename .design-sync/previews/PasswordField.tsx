import React from "react";
import { PasswordField } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 320,
};

const noop = () => {};

export const HiddenAndRevealed = () => (
  <div style={stack}>
    <PasswordField label="Password" value="correct-horse" onChange={noop} />
    <PasswordField
      label="Password"
      value="correct-horse"
      onChange={noop}
      defaultVisible
    />
  </div>
);

export const Variants = () => (
  <div style={stack}>
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
  </div>
);

export const ValidationStates = () => (
  <div style={stack}>
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
  </div>
);

export const StrengthMeter = () => (
  <div style={stack}>
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
  </div>
);
