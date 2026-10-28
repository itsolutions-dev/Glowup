import React from "react";
import { Checkbox, HelperText, Input } from "@its/glowup-ui";

const field: React.CSSProperties = {
  width: 340,
  display: "flex",
  flexDirection: "column",
};

export const Types = () => (
  <div style={{ ...field, gap: 16 }}>
    <div style={field}>
      <HelperText>Maximum 8 characters</HelperText>
    </div>
    <div style={field}>
      <HelperText type="error">Enter a valid email address</HelperText>
    </div>
    <div style={field}>
      <HelperText disabled>This field cannot be edited</HelperText>
    </div>
  </div>
);

// The reason it is a component: every input in the kit renders one, so the
// gutter, colour role and alert glyph stay identical across a form. A control
// with no message prop of its own (Checkbox, Switch, Slider) takes one below it.
export const UnderAControl = () => (
  <div style={{ ...field, gap: 8 }}>
    <Checkbox
      label="I accept the terms"
      checked={false}
      onValueChange={() => {}}
      error
    />
    <HelperText type="error" padding="none">
      You must accept the terms to continue
    </HelperText>
  </div>
);

export const AlongsideInput = () => (
  <div style={field}>
    <Input
      label="Email"
      value="jane.doe"
      onChange={() => {}}
      error="Missing the @"
    />
    <Input
      label="Phone"
      value="+44 7700 900123"
      onChange={() => {}}
      helperText="Include the country code"
    />
  </div>
);

// `visible={false}` fades the text out but keeps its line, so the rows below
// never jump when it comes and goes: both rows here are the same height.
export const Hidden = () => (
  <div style={field}>
    <Checkbox
      label="Renew my plan automatically"
      checked={false}
      onValueChange={() => {}}
    />
    <HelperText padding="none" visible={false}>
      Renews on 3 Jun 2024
    </HelperText>
    <Checkbox label="Email me the invoice" checked onValueChange={() => {}} />
    <HelperText padding="none">Sent to marta@itsol.it</HelperText>
  </div>
);
