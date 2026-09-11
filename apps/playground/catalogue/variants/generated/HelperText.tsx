// GENERATED — do not edit.
// Source: .design-sync/previews/HelperText.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { HelperText, Input, Typography, Checkbox } from "@its/glowup-ui";

const field: ViewStyle = {
  width: 340,
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
// gutter, colour role and alert glyph stay identical across a form.
export const UnderAControl = () => (
  <View style={{ ...field, gap: 8 }}>
    <Typography variant="labelMedium">
      Controls without their own error prop borrow it
    </Typography>
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
      onChangeText={() => {}}
      error="Missing the @"
    />
    <Input
      label="Phone"
      value="+44 7700 900123"
      onChangeText={() => {}}
      helperText="Include the country code"
    />
  </View>
);

export const Hidden = () => (
  <View style={{ ...field, gap: 8 }}>
    <Typography variant="labelMedium">
      visible=false fades out but keeps its space, so the field never jumps
    </Typography>
    <HelperText visible={false}>Hidden text</HelperText>
    <HelperText>Visible text</HelperText>
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
