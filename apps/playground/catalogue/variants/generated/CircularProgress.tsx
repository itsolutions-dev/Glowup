// GENERATED — do not edit.
// Source: .design-sync/previews/CircularProgress.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { CircularProgress, Paper, Typography, useTheme } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-end",
  gap: 24,
  flexWrap: "wrap",
};

const cell: ViewStyle = {
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
};

export const Sizes = () => (
  <View style={row}>
    <View style={cell}>
      <CircularProgress size={20} strokeWidth={2} />
      <Typography variant="labelSmall">20 — inline</Typography>
    </View>
    <View style={cell}>
      <CircularProgress size={32} strokeWidth={3} />
      <Typography variant="labelSmall">32 — list row</Typography>
    </View>
    <View style={cell}>
      <CircularProgress size={48} />
      <Typography variant="labelSmall">48 — default</Typography>
    </View>
    <View style={cell}>
      <CircularProgress size={72} strokeWidth={6} />
      <Typography variant="labelSmall">72 — full page</Typography>
    </View>
  </View>
);

export const StrokeWeights = () => (
  <View style={row}>
    <View style={cell}>
      <CircularProgress size={48} strokeWidth={2} />
      <Typography variant="labelSmall">strokeWidth 2</Typography>
    </View>
    <View style={cell}>
      <CircularProgress size={48} strokeWidth={4} />
      <Typography variant="labelSmall">strokeWidth 4</Typography>
    </View>
    <View style={cell}>
      <CircularProgress size={48} strokeWidth={8} />
      <Typography variant="labelSmall">strokeWidth 8</Typography>
    </View>
  </View>
);

export const Colors = () => {
  const { theme } = useTheme();
  return (
    <View style={row}>
      <View style={cell}>
        <CircularProgress size={44} />
        <Typography variant="labelSmall">primary</Typography>
      </View>
      <View style={cell}>
        <CircularProgress size={44} color={theme.colors.secondary} />
        <Typography variant="labelSmall">secondary</Typography>
      </View>
      <View style={cell}>
        <CircularProgress size={44} color={theme.colors.tertiary} />
        <Typography variant="labelSmall">tertiary</Typography>
      </View>
      <View style={cell}>
        <CircularProgress size={44} color={theme.colors.error} />
        <Typography variant="labelSmall">error</Typography>
      </View>
    </View>
  );
};

export const LoadingPane = () => (
  <View style={{ width: 380 }}>
    <Paper
      elevation={1}
      style={{
        width: "100%",
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: "center",
      }}
    >
      <CircularProgress size={56} strokeWidth={5} />
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          marginTop: 20,
        }}
      >
        <Typography variant="titleMedium" style={{ textAlign: "center" }}>
          Syncing your workspace
        </Typography>
        <Typography variant="bodySmall" style={{ textAlign: "center" }}>
          Fetching 42 projects and 1,204 components
        </Typography>
      </View>
    </Paper>
  </View>
);

export const InlineWithLabel = () => (
  <View style={{ flexDirection: "column", gap: 16, width: 320 }}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <CircularProgress size={20} strokeWidth={2} />
      <Typography variant="bodyMedium">Checking availability…</Typography>
    </View>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <CircularProgress size={20} strokeWidth={2} />
      <Typography variant="bodyMedium">Verifying payment method…</Typography>
    </View>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Sizes",
    title: "Sizes",
    render: Sizes,
  },
  {
    name: "StrokeWeights",
    title: "Stroke weights",
    render: StrokeWeights,
  },
  {
    name: "Colors",
    title: "Colors",
    render: Colors,
  },
  {
    name: "LoadingPane",
    title: "Loading pane",
    render: LoadingPane,
  },
  {
    name: "InlineWithLabel",
    title: "Inline with label",
    render: InlineWithLabel,
  },
];
