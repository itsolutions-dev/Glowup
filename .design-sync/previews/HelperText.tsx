import React from "react";
import { HelperText, Input, Typography, Checkbox } from "@its/glowup-ui";

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
// gutter, colour role and alert glyph stay identical across a form.
export const UnderAControl = () => (
  <div style={{ ...field, gap: 8 }}>
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
  </div>
);

export const AlongsideInput = () => (
  <div style={field}>
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
  </div>
);

export const Hidden = () => (
  <div style={{ ...field, gap: 8 }}>
    <Typography variant="labelMedium">
      visible=false fades out but keeps its space, so the field never jumps
    </Typography>
    <HelperText visible={false}>Hidden text</HelperText>
    <HelperText>Visible text</HelperText>
  </div>
);
