import React from "react";
import { ConfirmDialog, Typography } from "@its/glowup-ui";

// ConfirmDialog wraps Modal, which portals into document.body with a
// position: fixed scrim — it fills the capture viewport, not the card.
// Needs cfg.overrides { cardMode: "single", viewport: "560x400" }.
const backdrop: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  width: 460,
};

export const Destructive = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Chip</Typography>
    <Typography variant="bodyMedium">
      Buttons &amp; actions · 4 variants
    </Typography>
    <ConfirmDialog
      visible
      title="Delete Chip?"
      message="Chip is used by 6 screens. Deleting it removes those usages and cannot be undone."
      confirmText="Delete"
      cancelText="Keep"
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  </div>
);

export const Confirm = () => (
  <div style={backdrop}>
    <ConfirmDialog
      visible
      title="Publish 0.1.0?"
      message="34 components will be pushed to the registry and every dependent workspace will see the update."
      confirmText="Publish"
      cancelText="Not yet"
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  </div>
);

export const DefaultLabels = () => (
  <div style={backdrop}>
    <ConfirmDialog
      visible
      title="Discard draft?"
      message="Your unsaved changes to the login screen will be lost."
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  </div>
);
