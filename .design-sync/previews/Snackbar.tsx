import React from "react";
import { Snackbar, Typography, Card } from "@glowup/ui";

// Snackbar is NOT a portal — it is an absolutely-positioned sibling
// (bottom: 24, left/right: 16). A plain <div> is position: static, so it needs
// position: relative plus a real height to become the containing block.
const frame = (height: number): React.CSSProperties => ({
  position: "relative",
  width: 420,
  height,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

// duration={0} disables the auto-hide timer so the resting state is captured.
export const WithAction = () => (
  <div style={frame(180)}>
    <Card variant="outlined">
      <Typography variant="titleSmall">Chip</Typography>
      <Typography variant="bodySmall">
        Moved to Buttons &amp; actions.
      </Typography>
    </Card>
    <Snackbar
      visible
      duration={0}
      message="Chip moved to Buttons & actions."
      action={{ label: "Undo", onPress: () => {} }}
      onDismiss={() => {}}
    />
  </div>
);

export const Types = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        message="Changes saved."
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        type="success"
        message="Published @glowup/ui 0.1.0 to the registry."
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        type="error"
        message="Upload failed — the token file is larger than 2 MB."
        action={{ label: "Retry", onPress: () => {} }}
        onDismiss={() => {}}
      />
    </div>
  </div>
);

export const CustomIcon = () => (
  <div style={frame(120)}>
    <Snackbar
      visible
      duration={0}
      icon="cloud-off-outline"
      message="Offline — 3 edits queued."
      action={{ label: "Details", onPress: () => {} }}
      onDismiss={() => {}}
    />
  </div>
);

export const LongMessage = () => (
  <div style={frame(140)}>
    <Snackbar
      visible
      duration={0}
      message="Marta Rossi was invited to the shared component library and will receive read access once she signs in."
      onDismiss={() => {}}
    />
  </div>
);
