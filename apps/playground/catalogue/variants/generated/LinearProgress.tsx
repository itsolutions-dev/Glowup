// GENERATED — do not edit.
// Source: .design-sync/previews/LinearProgress.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { LinearProgress, Paper, Typography, useTheme } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 20,
  width: 380,
};

const labelRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 8,
};

const field: ViewStyle = { flexDirection: "column" };

export const Determinate = () => (
  <View style={stack}>
    {[
      { label: "brand-guidelines.pdf", value: 0.24 },
      { label: "onboarding-flow.fig", value: 0.61 },
      { label: "release-notes.md", value: 0.93 },
      { label: "icons-v3.zip", value: 1 },
    ].map((file) => (
      <View key={file.label} style={field}>
        <View style={labelRow}>
          <Typography variant="bodyMedium">{file.label}</Typography>
          <Typography variant="labelSmall">
            {Math.round(file.value * 100)}%
          </Typography>
        </View>
        <LinearProgress progress={file.value} />
      </View>
    ))}
  </View>
);

export const Indeterminate = () => (
  <View style={stack}>
    <View style={field}>
      <View style={labelRow}>
        <Typography variant="bodyMedium">Indexing your library</Typography>
        <Typography variant="labelSmall">no ETA</Typography>
      </View>
      <LinearProgress indeterminate />
    </View>
    <View style={field}>
      <View style={labelRow}>
        <Typography variant="bodyMedium">Slower sweep</Typography>
        <Typography variant="labelSmall">3 s cycle</Typography>
      </View>
      <LinearProgress indeterminate height={8} indeterminateDuration={3000} />
    </View>
  </View>
);

export const Heights = () => (
  <View style={stack}>
    {[
      { h: 2, note: "2 — hairline under an app bar" },
      { h: 4, note: "4 — default" },
      { h: 8, note: "8 — inline in a card" },
      { h: 14, note: "14 — quota meter" },
    ].map((item) => (
      <View key={item.h} style={field}>
        <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
          {item.note}
        </Typography>
        <LinearProgress progress={0.55} height={item.h} />
      </View>
    ))}
  </View>
);

export const Colors = () => {
  const { theme } = useTheme();
  return (
    <View style={stack}>
      <View style={field}>
        <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
          primary — default
        </Typography>
        <LinearProgress progress={0.65} height={8} />
      </View>
      <View style={field}>
        <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
          tertiary on a tertiaryContainer track
        </Typography>
        <LinearProgress
          progress={0.65}
          height={8}
          color={theme.colors.tertiary}
          trackColor={theme.colors.tertiaryContainer}
        />
      </View>
      <View style={field}>
        <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
          error — storage almost full
        </Typography>
        <LinearProgress
          progress={0.94}
          height={8}
          color={theme.colors.error}
          trackColor={theme.colors.errorContainer}
        />
      </View>
    </View>
  );
};

export const UploadCard = () => (
  <View style={{ width: 380 }}>
    <Paper
      elevation={1}
      style={{ width: "100%", paddingVertical: 20, paddingHorizontal: 20 }}
    >
      <View style={{ flexDirection: "column", gap: 4 }}>
        <Typography variant="titleMedium">Uploading assets</Typography>
        <Typography variant="bodySmall">
          4.2 MB of 9.3 MB — 12 s left
        </Typography>
      </View>
      <View style={{ marginTop: 16, flexDirection: "column" }}>
        <LinearProgress progress={0.45} height={8} />
      </View>
    </Paper>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Determinate",
    title: "Determinate",
    render: Determinate,
  },
  {
    name: "Indeterminate",
    title: "Indeterminate",
    render: Indeterminate,
  },
  {
    name: "Heights",
    title: "Heights",
    render: Heights,
  },
  {
    name: "Colors",
    title: "Colors",
    render: Colors,
  },
  {
    name: "UploadCard",
    title: "Upload card",
    render: UploadCard,
  },
];
