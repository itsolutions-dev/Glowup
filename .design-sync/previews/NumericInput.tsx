import React from "react";
import { NumericInput } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 320,
};

const noop = () => {};

export const Variants = () => (
  <div style={stack}>
    <NumericInput
      variant="outlined"
      label="Invoice total"
      prefix="€"
      precision={2}
      value="1240.50"
      onChangeText={noop}
    />
    <NumericInput
      variant="filled"
      label="Invoice total"
      prefix="€"
      precision={2}
      value="1240.50"
      onChangeText={noop}
    />
  </div>
);

export const PrefixAndSuffix = () => (
  <div style={stack}>
    <NumericInput
      label="Hourly rate"
      prefix="€"
      suffix="/ h"
      precision={2}
      value="85.00"
      onChangeText={noop}
    />
    <NumericInput
      label="Parcel weight"
      suffix="kg"
      precision={3}
      value="2.450"
      onChangeText={noop}
    />
    <NumericInput
      label="VAT rate"
      suffix="%"
      precision={0}
      value="22"
      onChangeText={noop}
    />
  </div>
);

export const States = () => (
  <div style={stack}>
    <NumericInput
      label="Amount to refund"
      prefix="€"
      placeholder="0.00"
      precision={2}
      value=""
      onChangeText={noop}
    />
    <NumericInput
      label="Discount"
      suffix="%"
      error="Cannot exceed 30%."
      value="45"
      onChangeText={noop}
    />
  </div>
);
