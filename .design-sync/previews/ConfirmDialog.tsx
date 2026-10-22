import React from "react";
import { ConfirmDialog, Typography, useTheme } from "@its/glowup-ui";

// ConfirmDialog wraps Dialog, which portals into document.body with a
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
      destructive
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

export const MustAnswer = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Account</Typography>
    <Typography variant="bodyMedium">3 devices signed in</Typography>
    <ConfirmDialog
      visible
      icon="logout"
      title="Sign out everywhere?"
      message="A click outside and Escape are ignored: the answer has to be one of the buttons."
      confirmText="Sign out"
      cancelText="Stay signed in"
      dismissable={false}
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  </div>
);

export const CustomSlots = () => {
  const { theme } = useTheme();
  return (
    <div style={backdrop}>
      <Typography variant="headlineSmall">Theme</Typography>
      <Typography variant="bodyMedium">Baseline, light</Typography>
      <ConfirmDialog
        visible
        icon="palette-outline"
        title="Apply this theme?"
        message="slotStyles overrides the backdrop, the card, the title and the row of actions."
        confirmText="Apply"
        cancelText="Later"
        slotStyles={{
          backdrop: {
            backgroundColor: theme.colors.primaryContainer,
            opacity: 0.7,
          },
          container: {
            borderRadius: theme.shape.small,
            borderWidth: 2,
            borderColor: theme.colors.primary,
          },
          title: { color: theme.colors.primary },
          actions: { justifyContent: "space-between" },
        }}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    </div>
  );
};
