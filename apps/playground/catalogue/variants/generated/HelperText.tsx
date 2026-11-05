// GENERATED — do not edit.
// Source: .design-sync/previews/HelperText.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Checkbox, HelperText, Input } from "@its/glowup-ui";

const field: ViewStyle = {
  width: "100%",
  maxWidth: 340,
  flexDirection: "column",
};

export const Types = () => (
  <View style={{ ...field, gap: 16 }}>
    <View style={field}>
      <HelperText>Maximum 8 characters</HelperText>
    </View>
    <View style={field}>
      <HelperText type="error">Enter a valid email address</HelperText>
    </View>
    <View style={field}>
      <HelperText disabled>This field cannot be edited</HelperText>
    </View>
  </View>
);

// The reason it is a component: every input in the kit renders one, so the
// gutter, colour role and alert glyph stay identical across a form. A control
// with no message prop of its own (Checkbox, Switch, Slider) takes one below it.
export const UnderAControl = () => (
  <View style={{ ...field, gap: 8 }}>
    <Checkbox
      label="I accept the terms"
      checked={false}
      onValueChange={() => {}}
      error
    />
    <HelperText type="error" padding="none">
      You must accept the terms to continue
    </HelperText>
  </View>
);

export const AlongsideInput = () => (
  <View style={field}>
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
  </View>
);

// `visible={false}` fades the text out but keeps its line, so the rows below
// never jump when it comes and goes: both rows here are the same height.
export const Hidden = () => (
  <View style={field}>
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
  </View>
);

export const variants: Variant[] = [
  {
    name: "Types",
    title: "Types",
    render: Types,
  },
  {
    name: "UnderAControl",
    title: "Under a control",
    render: UnderAControl,
  },
  {
    name: "AlongsideInput",
    title: "Alongside input",
    render: AlongsideInput,
  },
  {
    name: "Hidden",
    title: "Hidden",
    render: Hidden,
  },
];
