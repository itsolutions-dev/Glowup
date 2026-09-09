import React from "react";
import { SpeedDial, Paper, Typography, Divider } from "@glowup/ui";

// SpeedDial's root is an absolutely-positioned overlay that fills its nearest
// positioned ancestor, so it needs a sized surface to float over.
const screen: React.CSSProperties = {
  width: 380,
  height: 260,
  display: "flex",
};

const actions = [
  { id: "doc", label: "New document", icon: "file-document-outline", onPress: () => {} },
  { id: "upload", label: "Upload file", icon: "upload-outline", onPress: () => {} },
  { id: "folder", label: "New folder", icon: "folder-plus-outline", onPress: () => {} },
];

export const OnASurface = () => (
  <div style={screen}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <Typography variant="titleMedium">Shared drive</Typography>
      <Typography variant="bodySmall">Team Design · 128 files</Typography>
      <div style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <div style={{ height: 12 }} />
      <Typography variant="bodyMedium">Brand guidelines.pdf</Typography>
      <div style={{ height: 8 }} />
      <Typography variant="bodyMedium">Q3 roadmap.key</Typography>
      <div style={{ height: 8 }} />
      <Typography variant="bodyMedium">Component audit.xlsx</Typography>
      <SpeedDial mainIcon="plus" actions={actions} />
    </Paper>
  </div>
);

export const BottomLeft = () => (
  <div style={{ ...screen, height: 200 }}>
    <Paper elevation={1} outline style={{ flex: 1 }}>
      <Typography variant="labelMedium">position=&quot;bottom-left&quot;</Typography>
      <div style={{ height: 8 }} />
      <Typography variant="bodySmall">
        The trigger anchors to the chosen corner; the labelled actions expand above it on
        press.
      </Typography>
      <SpeedDial mainIcon="dots-horizontal" actions={actions} position="bottom-left" />
    </Paper>
  </div>
);
