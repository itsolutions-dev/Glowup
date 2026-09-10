import React from "react";
import { RadioButton } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
  width: 340,
};

const noop = () => {};

export const Selection = () => (
  <div style={stack}>
    <RadioButton label="Standard delivery (3–5 days)" selected onPress={noop} />
    <RadioButton
      label="Express delivery (next day)"
      selected={false}
      onPress={noop}
    />
    <RadioButton label="Pick up in store" selected={false} onPress={noop} />
  </div>
);

export const DisabledAndError = () => (
  <div style={stack}>
    <RadioButton label="Bank transfer" selected disabled onPress={noop} />
    <RadioButton
      label="Cash on delivery (unavailable)"
      selected={false}
      disabled
      onPress={noop}
    />
    <RadioButton
      label="Pick a payment method"
      selected={false}
      error
      onPress={noop}
    />
    <RadioButton label="Credit card" selected error onPress={noop} />
  </div>
);

export const LabelPosition = () => (
  <div style={stack}>
    <RadioButton label="Label on the right (default)" selected onPress={noop} />
    <RadioButton
      label="Label on the left"
      labelPosition="left"
      selected
      onPress={noop}
    />
  </div>
);
