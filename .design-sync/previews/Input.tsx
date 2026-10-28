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
      onChange={noop}
    />
    <Input
      variant="outlined"
      label="Company"
      placeholder="Acme Inc."
      value="Acme Inc."
      onChange={noop}
    />
  </div>
);

export const WithIcons = () => (
  <div style={stack}>
    <Input
      label="Work email"
      leadingIcon="email-outline"
      value="ada@acme.example"
      onChange={noop}
    />
    <Input
      label="Password"
      leadingIcon="lock-outline"
      trailingIcon="eye-off-outline"
      secureTextEntry
      value="correct-horse"
      onChange={noop}
      onTrailingIconPress={noop}
    />
    <Input
      label="Monthly rent"
      type="number"
      prefix="€"
      suffix="/ month"
      precision={2}
      value="1240.50"
      onChange={noop}
    />
  </div>
);

export const ValidationStates = () => (
  <div style={stack}>
    <Input
      label="VAT number"
      required
      helperText="11 digits, no country prefix."
      value="0123456789"
      onChange={noop}
    />
    <Input
      label="VAT number"
      required
      error="Must be exactly 11 digits."
      value="01234"
      onChange={noop}
    />
    <Input
      label="Invoice reference"
      placeholder="Optional"
      helperText="Shown on the PDF and the bank transfer."
      value=""
      onChange={noop}
    />
    <Input
      label="Seats"
      type="number"
      maxLength={3}
      helperText="Max 250 per workspace."
      value="24"
      onChange={noop}
    />
    <Input
      label="Customer ID"
      disabled
      helperText="Assigned when the account is created."
      value="C-10482"
      onChange={noop}
    />
  </div>
);

export const DecimalComma = () => (
  <div style={stack}>
    <Input
      type="number"
      label="Amount (decimal comma)"
      decimalSeparator=","
      precision={2}
      suffix="€"
      value="1250.50"
      onChange={noop}
    />
    <Input
      type="number"
      label="Amount (decimal point)"
      precision={2}
      suffix="€"
      value="1250.50"
      onChange={noop}
    />
  </div>
);

export const UpperCaseAndReservedHelper = () => (
  <div style={stack}>
    <Input
      label="Tax code"
      allUpperCase
      reserveHelperText
      value="RSSMRA80A01H501U"
      onChange={noop}
    />
    <Input
      label="Plate"
      allUpperCase
      reserveHelperText
      error="Not a valid plate"
      value="AB123C"
      onChange={noop}
    />
    <Input label="Province" allUpperCase value="RM" onChange={noop} />
  </div>
);
