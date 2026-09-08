import React from "react";
import { LanguageSelector, Paper, Typography, Divider } from "@glowup/ui";

const row: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const noop = () => {};

export const Languages = () => (
  <div style={{ width: 380, display: "flex" }}>
    <Paper elevation={1} outline style={{ flex: 1 }}>
      <Typography variant="labelMedium">Interface language</Typography>
      <div style={{ height: 12 }} />
      <div style={row}>
        <LanguageSelector currentLang="en" onChange={noop} />
        <LanguageSelector currentLang="es" onChange={noop} />
        <LanguageSelector currentLang="it" onChange={noop} />
        <LanguageSelector currentLang="fr" onChange={noop} />
      </div>
    </Paper>
  </div>
);

export const InHeaderRow = () => (
  <div style={{ width: 380, display: "flex" }}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="titleSmall">Acme Logistics</Typography>
          <Typography variant="bodySmall">Warehouse — Milano Est</Typography>
        </div>
        <LanguageSelector currentLang="it" onChange={noop} />
      </div>
      <div style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <div style={{ height: 12 }} />
      <Typography variant="bodySmall">
        Tap the flag to cycle through EN, ES, IT and FR.
      </Typography>
    </Paper>
  </div>
);
