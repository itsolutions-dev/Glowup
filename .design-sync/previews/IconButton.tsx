import React from "react";
import { IconButton, Paper, Typography } from "@glowup/ui";

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const column: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  width: 380,
};

const caption: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
};

export const Modes = () => (
  <div style={row}>
    {(["standard", "filled", "tonal", "outlined"] as const).map((mode) => (
      <div key={mode} style={caption}>
        <IconButton icon="pencil-outline" mode={mode} accessibilityLabel="Edit" onPress={() => {}} />
        <Typography variant="labelSmall">{mode}</Typography>
      </div>
    ))}
  </div>
);

export const Sizes = () => (
  <div style={row}>
    {(["small", "medium", "large"] as const).map((size) => (
      <div key={size} style={caption}>
        <IconButton icon="magnify" mode="tonal" size={size} accessibilityLabel="Search" onPress={() => {}} />
        <Typography variant="labelSmall">{size}</Typography>
      </div>
    ))}
  </div>
);

export const States = () => (
  <div style={row}>
    <div style={caption}>
      <IconButton icon="heart-outline" mode="tonal" accessibilityLabel="Save" onPress={() => {}} />
      <Typography variant="labelSmall">default</Typography>
    </div>
    <div style={caption}>
      <IconButton icon="heart" mode="tonal" selected accessibilityLabel="Saved" onPress={() => {}} />
      <Typography variant="labelSmall">selected</Typography>
    </div>
    <div style={caption}>
      <IconButton icon="refresh" mode="filled" loading accessibilityLabel="Refreshing" onPress={() => {}} />
      <Typography variant="labelSmall">loading</Typography>
    </div>
    <div style={caption}>
      <IconButton icon="delete-outline" mode="outlined" disabled accessibilityLabel="Delete" />
      <Typography variant="labelSmall">disabled</Typography>
    </div>
  </div>
);

export const InAToolbar = () => (
  <div style={column}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <Typography variant="titleMedium">Component audit.xlsx</Typography>
      <Typography variant="bodySmall">Shared drive · 2.4 MB</Typography>
      <div style={{ height: 12 }} />
      <div style={row}>
        <IconButton icon="download" mode="tonal" accessibilityLabel="Download" onPress={() => {}} />
        <IconButton icon="share-variant" accessibilityLabel="Share" onPress={() => {}} />
        <IconButton icon="pencil-outline" accessibilityLabel="Rename" onPress={() => {}} />
        <IconButton icon="delete-outline" accessibilityLabel="Delete" onPress={() => {}} />
      </div>
    </Paper>
  </div>
);
