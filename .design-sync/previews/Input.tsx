import React from "react";
import { Input } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 320,
};

const noop = () => {};

export const Variants = () => (
  <div style={stack}>
    <Input
      variant="filled"
      label="Full name"
      placeholder="Ada Lovelace"
      value="Ada Lovelace"
      onChangeText={noop}
    />
    <Input
      variant="outlined"
      label="Company"
      placeholder="Acme S.r.l."
      value="Acme S.r.l."
      onChangeText={noop}
    />
  </div>
);

export const WithIcons = () => (
  <div style={stack}>
    <Input
      label="Work email"
      leadingIcon="email-outline"
      value="ada@acme.example"
      onChangeText={noop}
    />
    <Input
      label="Password"
      leadingIcon="lock-outline"
      trailingIcon="eye-off-outline"
      secureTextEntry
      value="correct-horse"
      onChangeText={noop}
      onTrailingIconPress={noop}
    />
    <Input
      label="Net total"
      type="number"
      prefix="€"
      suffix="EUR"
      precision={2}
      value="1240.50"
      onChangeText={noop}
    />
  </div>
);

// NOTE: `disabled` and `readonly` are deliberately not previewed. Input maps them
// to `editable` / `readOnly` only (see packages/ui/src/components/Input.tsx) with no
// visual treatment, so a disabled field is pixel-identical to an enabled one — a cell
// for it would teach a design agent a state the component does not actually render.
export const ValidationStates = () => (
  <div style={stack}>
    <Input
      label="VAT number"
      required
      helperText="11 digits, no country prefix."
      value="0123456789"
      onChangeText={noop}
    />
    <Input
      label="VAT number"
      required
      error="Must be exactly 11 digits."
      value="01234"
      onChangeText={noop}
    />
    <Input
      label="Invoice reference"
      placeholder="Optional"
      helperText="Shown on the PDF and the bank transfer."
      value=""
      onChangeText={noop}
    />
    <Input
      label="Seats"
      type="number"
      maxLength={3}
      helperText="Max 250 per workspace."
      value="24"
      onChangeText={noop}
    />
  </div>
);

export const Multiline = () => (
  <div style={stack}>
    <Input
      label="Delivery notes"
      placeholder="Anything the courier should know?"
      multiline
      numberOfLines={4}
      maxLength={280}
      value={
        "Ring the bell twice — the intercom is broken.\nIf nobody answers, leave it with the concierge."
      }
      onChangeText={noop}
    />
  </div>
);
