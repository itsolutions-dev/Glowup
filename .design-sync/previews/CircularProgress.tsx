import React from "react";
import { CircularProgress, Paper, Typography, useTheme } from "@its/glowup-ui";

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
  <div
    style={{ display: "flex", flexDirection: "column", gap: 16, width: 320 }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <CircularProgress size={20} strokeWidth={2} />
      <Typography variant="bodyMedium">Checking availability…</Typography>
    </div>
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <CircularProgress size={20} strokeWidth={2} />
      <Typography variant="bodyMedium">Verifying payment method…</Typography>
    </div>
  </div>
);

export const Determinate = () => (
  <div style={row}>
    {[0.25, 0.5, 0.75, 1].map((value) => (
      <div key={value} style={cell}>
        <CircularProgress
          progress={value}
          size={64}
          strokeWidth={5}
          label={`${Math.round(value * 100)}%`}
        />
        <Typography variant="labelSmall">progress {value}</Typography>
      </div>
    ))}
  </div>
);

export const LabelPositions = () => (
  <div style={row}>
    {(["center", "top", "bottom", "left", "right"] as const).map((position) => (
      <div key={position} style={cell}>
        <CircularProgress
          progress={0.65}
          size={56}
          label="65%"
          labelPosition={position}
        />
        <Typography variant="labelSmall">{position}</Typography>
      </div>
    ))}
    <div style={cell}>
      <CircularProgress size={24} strokeWidth={3} label="Loading" />
      <Typography variant="labelSmall">spinner: right</Typography>
    </div>
  </div>
);

export const Tracks = () => {
  const { theme } = useTheme();
  return (
    <div style={row}>
      <div style={cell}>
        <CircularProgress progress={0.65} size={56} />
        <Typography variant="labelSmall">ring: default</Typography>
      </div>
      <div style={cell}>
        <CircularProgress progress={0.65} size={56} trackColor={false} />
        <Typography variant="labelSmall">ring: none</Typography>
      </div>
      <div style={cell}>
        <CircularProgress
          progress={0.65}
          size={56}
          color={theme.colors.error}
          trackColor={theme.colors.errorContainer}
        />
        <Typography variant="labelSmall">ring: a colour</Typography>
      </div>
      <div style={cell}>
        <CircularProgress size={56} trackColor />
        <Typography variant="labelSmall">spinner: tinted</Typography>
      </div>
    </div>
  );
};
