import React from "react";
import { CircularProgress, Paper, Typography, useTheme } from "@glowup/ui";

const row: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-end",
  gap: 24,
  flexWrap: "wrap",
};

const cell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
};

export const Sizes = () => (
  <div style={row}>
    <div style={cell}>
      <CircularProgress size={20} strokeWidth={2} />
      <Typography variant="labelSmall">20 — inline</Typography>
    </div>
    <div style={cell}>
      <CircularProgress size={32} strokeWidth={3} />
      <Typography variant="labelSmall">32 — list row</Typography>
    </div>
    <div style={cell}>
      <CircularProgress size={48} />
      <Typography variant="labelSmall">48 — default</Typography>
    </div>
    <div style={cell}>
      <CircularProgress size={72} strokeWidth={6} />
      <Typography variant="labelSmall">72 — full page</Typography>
    </div>
  </div>
);

export const StrokeWeights = () => (
  <div style={row}>
    <div style={cell}>
      <CircularProgress size={48} strokeWidth={2} />
      <Typography variant="labelSmall">strokeWidth 2</Typography>
    </div>
    <div style={cell}>
      <CircularProgress size={48} strokeWidth={4} />
      <Typography variant="labelSmall">strokeWidth 4</Typography>
    </div>
    <div style={cell}>
      <CircularProgress size={48} strokeWidth={8} />
      <Typography variant="labelSmall">strokeWidth 8</Typography>
    </div>
  </div>
);

export const Colors = () => {
  const { theme } = useTheme();
  return (
    <div style={row}>
      <div style={cell}>
        <CircularProgress size={44} />
        <Typography variant="labelSmall">primary</Typography>
      </div>
      <div style={cell}>
        <CircularProgress size={44} color={theme.colors.secondary} />
        <Typography variant="labelSmall">secondary</Typography>
      </div>
      <div style={cell}>
        <CircularProgress size={44} color={theme.colors.tertiary} />
        <Typography variant="labelSmall">tertiary</Typography>
      </div>
      <div style={cell}>
        <CircularProgress size={44} color={theme.colors.error} />
        <Typography variant="labelSmall">error</Typography>
      </div>
    </div>
  );
};

export const LoadingPane = () => (
  <div style={{ width: 380, display: "flex" }}>
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
      <div
        style={{
          display: "flex",
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
      </div>
    </Paper>
  </div>
);

export const InlineWithLabel = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 320 }}>
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
      <CircularProgress size={20} strokeWidth={2} />
      <Typography variant="bodyMedium">Checking availability…</Typography>
    </div>
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
      <CircularProgress size={20} strokeWidth={2} />
      <Typography variant="bodyMedium">Verifying payment method…</Typography>
    </div>
  </div>
);
