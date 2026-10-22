import React from "react";
import { Snackbar, Typography, Card } from "@its/glowup-ui";

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
      action={{ label: "Undo", onClick: () => {} }}
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
        severity="success"
        message="Published @its/glowup-ui 0.1.0 to the registry."
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        severity="warning"
        message="Storage is almost full: 92% of 5 GB used."
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        severity="info"
        message="A new version of the app is available."
        action={{ label: "Update", onClick: () => {} }}
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        severity="error"
        message="Upload failed — the token file is larger than 2 MB."
        action={{ label: "Retry", onClick: () => {} }}
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
      action={{ label: "Details", onClick: () => {} }}
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

export const Outlined = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        variant="outlined"
        message="Changes saved."
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        variant="outlined"
        severity="success"
        message="Published @its/glowup-ui 0.1.0 to the registry."
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        variant="outlined"
        severity="warning"
        message="Storage is almost full: 92% of 5 GB used."
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        variant="outlined"
        severity="info"
        message="A new version of the app is available."
        action={{ label: "Update", onClick: () => {} }}
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        variant="outlined"
        severity="error"
        message="Upload failed — the token file is larger than 2 MB."
        action={{ label: "Retry", onClick: () => {} }}
        onDismiss={() => {}}
      />
    </div>
  </div>
);

export const Positions = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        position="top-left"
        message="Top left."
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        position="top-center"
        message="Top center."
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        position="top-right"
        message="Top right."
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        position="bottom-left"
        message="Bottom left."
        onDismiss={() => {}}
      />
    </div>
    <div style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        position="bottom-right"
        message="Bottom right."
        onDismiss={() => {}}
      />
    </div>
  </div>
);

// onClose adds the close button and keeps the snackbar up until it is used.
export const Closable = () => (
  <div style={frame(120)}>
    <Snackbar
      visible
      severity="info"
      message="3 edits are waiting to sync."
      action={{ label: "Sync now", onClick: () => {} }}
      onClose={() => {}}
    />
  </div>
);
