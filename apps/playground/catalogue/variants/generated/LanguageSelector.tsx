// GENERATED — do not edit.
// Source: .design-sync/previews/LanguageSelector.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { LanguageSelector, Paper, Typography, Divider } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const noop = () => {};

export const Languages = () => (
  <View style={{ width: 380, flexDirection: "row" }}>
    <Paper elevation={1} outline style={{ flex: 1 }}>
      <Typography variant="labelMedium">Interface language</Typography>
      <View style={{ height: 12 }} />
      <View style={row}>
        <LanguageSelector currentLang="en" onChange={noop} />
        <LanguageSelector currentLang="es" onChange={noop} />
        <LanguageSelector currentLang="it" onChange={noop} />
        <LanguageSelector currentLang="fr" onChange={noop} />
      </View>
    </Paper>
  </View>
);

export const InHeaderRow = () => (
  <View style={{ width: 380, flexDirection: "row" }}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "column" }}>
          <Typography variant="titleSmall">Acme Logistics</Typography>
          <Typography variant="bodySmall">Warehouse — Milano Est</Typography>
        </View>
        <LanguageSelector currentLang="it" onChange={noop} />
      </View>
      <View style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <View style={{ height: 12 }} />
      <Typography variant="bodySmall">
        Tap the flag to cycle through EN, ES, IT and FR.
      </Typography>
    </Paper>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Languages",
    title: "Languages",
    render: Languages,
  },
  {
    name: "InHeaderRow",
    title: "In header row",
    render: InHeaderRow,
  },
];
