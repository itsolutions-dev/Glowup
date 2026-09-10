import React from "react";
import { LinearProgress, Paper, Typography, useTheme } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  width: 380,
};

const labelRow: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 8,
};

const field: React.CSSProperties = { display: "flex", flexDirection: "column" };

export const Determinate = () => (
  <div style={stack}>
    {[
      { label: "brand-guidelines.pdf", value: 0.24 },
      { label: "onboarding-flow.fig", value: 0.61 },
      { label: "release-notes.md", value: 0.93 },
      { label: "icons-v3.zip", value: 1 },
    ].map((file) => (
      <div key={file.label} style={field}>
        <div style={labelRow}>
          <Typography variant="bodyMedium">{file.label}</Typography>
          <Typography variant="labelSmall">
            {Math.round(file.value * 100)}%
          </Typography>
        </div>
        <LinearProgress progress={file.value} />
      </div>
    ))}
  </div>
);

export const Indeterminate = () => (
  <div style={stack}>
    <div style={field}>
      <div style={labelRow}>
        <Typography variant="bodyMedium">Indexing your library</Typography>
        <Typography variant="labelSmall">no ETA</Typography>
      </div>
      <LinearProgress indeterminate />
    </div>
    <div style={field}>
      <div style={labelRow}>
        <Typography variant="bodyMedium">Slower sweep</Typography>
        <Typography variant="labelSmall">3 s cycle</Typography>
      </div>
      <LinearProgress indeterminate height={8} indeterminateDuration={3000} />
    </div>
  </div>
);

export const Heights = () => (
  <div style={stack}>
    {[
      { h: 2, note: "2 — hairline under an app bar" },
      { h: 4, note: "4 — default" },
      { h: 8, note: "8 — inline in a card" },
      { h: 14, note: "14 — quota meter" },
    ].map((item) => (
      <div key={item.h} style={field}>
        <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
          {item.note}
        </Typography>
        <LinearProgress progress={0.55} height={item.h} />
      </div>
    ))}
  </div>
);

export const Colors = () => {
  const { theme } = useTheme();
  return (
    <div style={stack}>
      <div style={field}>
        <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
          primary — default
        </Typography>
        <LinearProgress progress={0.65} height={8} />
      </div>
      <div style={field}>
        <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
          tertiary on a tertiaryContainer track
        </Typography>
        <LinearProgress
          progress={0.65}
          height={8}
          color={theme.colors.tertiary}
          trackColor={theme.colors.tertiaryContainer}
        />
      </div>
      <div style={field}>
        <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
          error — storage almost full
        </Typography>
        <LinearProgress
          progress={0.94}
          height={8}
          color={theme.colors.error}
          trackColor={theme.colors.errorContainer}
        />
      </div>
    </div>
  );
};

export const UploadCard = () => (
  <div style={{ width: 380, display: "flex" }}>
    <Paper
      elevation={1}
      style={{ width: "100%", paddingVertical: 20, paddingHorizontal: 20 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Typography variant="titleMedium">Uploading assets</Typography>
        <Typography variant="bodySmall">
          4.2 MB of 9.3 MB — 12 s left
        </Typography>
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column" }}>
        <LinearProgress progress={0.45} height={8} />
      </div>
    </Paper>
  </div>
);
