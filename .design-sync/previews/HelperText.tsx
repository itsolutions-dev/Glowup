import React from "react";
import { HelperText, Input, Typography, Checkbox } from "@glowup/ui";

const field: React.CSSProperties = {
  width: 340,
  display: "flex",
  flexDirection: "column",
};

export const Types = () => (
  <div style={{ ...field, gap: 16 }}>
    <div style={field}>
      <HelperText>Massimo 8 caratteri</HelperText>
    </div>
    <div style={field}>
      <HelperText type="error">Indirizzo email non valido</HelperText>
    </div>
    <div style={field}>
      <HelperText disabled>Campo non modificabile</HelperText>
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
      label="Accetto i termini"
      checked={false}
      onValueChange={() => {}}
      error
    />
    <HelperText type="error" padding="none">
      Devi accettare i termini per procedere
    </HelperText>
  </div>
);

export const AlongsideInput = () => (
  <div style={field}>
    <Input
      label="Email"
      value="mario.rossi"
      onChangeText={() => {}}
      error="Manca la @"
    />
    <Input
      label="Telefono"
      value="+39 340 1234567"
      onChangeText={() => {}}
      helperText="Includi il prefisso internazionale"
    />
  </div>
);

export const Hidden = () => (
  <div style={{ ...field, gap: 8 }}>
    <Typography variant="labelMedium">
      visible=false fades out but keeps its space, so the field never jumps
    </Typography>
    <HelperText visible={false}>Testo nascosto</HelperText>
    <HelperText>Testo visibile</HelperText>
  </div>
);
