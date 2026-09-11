// GENERATED — do not edit.
// Source: .design-sync/previews/FAB.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { FAB, Paper, Typography, Divider } from "@its/glowup-ui";

// FAB is always `position: absolute` inside its nearest positioned ancestor.
// A Paper acts as the "screen" surface it floats over.
const screen: ViewStyle = {
  width: 380,
  height: 220,
  flexDirection: "row",
};

// The DS itself un-anchors a FAB by re-declaring position (see SpeedDial's
// internal `fab` style), which is how a FAB is laid out inline in a row.
const inline = {
  position: "relative" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const row: ViewStyle = {
  flexDirection: "row",
  gap: 16,
  alignItems: "center",
  flexWrap: "wrap",
};

export const OnASurface = () => (
  <View style={screen}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <Typography variant="titleMedium">Invoices</Typography>
      <Typography variant="bodySmall">14 open · 3 overdue</Typography>
      <View style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <View style={{ height: 12 }} />
      <Typography variant="bodyMedium">
        INV-2043 · Acme Srl · € 1.280,00
      </Typography>
      <View style={{ height: 8 }} />
      <Typography variant="bodyMedium">
        INV-2042 · Vento Lab · € 640,00
      </Typography>
      <FAB icon="plus" onPress={() => {}} />
    </Paper>
  </View>
);

export const Sizes = () => (
  <View style={row}>
    <FAB icon="pencil-outline" size="small" onPress={() => {}} style={inline} />
    <FAB icon="plus" size="regular" onPress={() => {}} style={inline} />
    <FAB icon="plus" size="large" onPress={() => {}} style={inline} />
  </View>
);

export const Extended = () => (
  <View style={row}>
    <FAB
      icon="plus"
      label="New invoice"
      size="extended"
      onPress={() => {}}
      style={inline}
    />
    <FAB
      icon="upload-outline"
      label="Upload"
      size="extended"
      onPress={() => {}}
      style={inline}
    />
  </View>
);

export const Positions = () => (
  <View style={screen}>
    <Paper
      elevation={1}
      outline
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Typography variant="labelMedium">
        All four corners are anchored
      </Typography>
      <View style={{ height: 4 }} />
      <Typography variant="bodySmall">
        top-left · top-right · bottom-left · bottom-right
      </Typography>
      <FAB
        icon="arrow-left"
        size="small"
        position="top-left"
        onPress={() => {}}
      />
      <FAB
        icon="magnify"
        size="small"
        position="top-right"
        onPress={() => {}}
      />
      <FAB
        icon="filter-variant"
        size="small"
        position="bottom-left"
        onPress={() => {}}
      />
      <FAB icon="plus" position="bottom-right" onPress={() => {}} />
    </Paper>
  </View>
);

export const variants: Variant[] = [
  {
    name: "OnASurface",
    title: "On a surface",
    render: OnASurface,
  },
  {
    name: "Sizes",
    title: "Sizes",
    render: Sizes,
  },
  {
    name: "Extended",
    title: "Extended",
    render: Extended,
  },
  {
    name: "Positions",
    title: "Positions",
    render: Positions,
  },
];
