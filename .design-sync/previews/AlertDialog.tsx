import React from "react";
import { AlertDialog, Typography } from "@its/glowup-ui";

// AlertDialog is a Dialog that asks one question: a title, a message and one or
// two actions. It renders through react-native-web's Modal (a real portal into
// document.body), so the card needs cfg.overrides { cardMode: "single",
// viewport }. RNW's Modal focus-traps on open, so the first action shows the
// focus ring: the product's real open state.
const backdrop: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  width: 460,
};

const Page = ({ title, line }: { title: string; line: string }) => (
  <>
    <Typography variant="headlineSmall">{title}</Typography>
    <Typography variant="bodyMedium">{line}</Typography>
  </>
);

export const Confirm = () => (
  <div style={backdrop}>
    <Page title="Drafts" line="4 drafts · saved 2 minutes ago" />
    <AlertDialog
      visible
      title="Discard this draft?"
      message="The changes you made since 10:42 will be lost."
      cancelText="Keep editing"
      actionText="Discard"
      onCancel={() => {}}
      onAction={() => {}}
    />
  </div>
);

// `destructive` draws the primary action in the error tone.
export const Destructive = () => (
  <div style={backdrop}>
    <Page title="Projects" line="Glowup · 12 members" />
    <AlertDialog
      visible
      severity="error"
      title="Delete the project?"
      message="Glowup and its 34 components will be deleted for everyone. This cannot be undone."
      cancelText="Cancel"
      actionText="Delete project"
      destructive
      onCancel={() => {}}
      onAction={() => {}}
    />
  </div>
);

// One action only, with a status icon from `severity`.
export const Notice = () => (
  <div style={backdrop}>
    <Page title="Sync" line="Last sync failed" />
    <AlertDialog
      visible
      severity="warning"
      title="You are offline"
      message="Your edits are kept on this device and sync when you reconnect."
      onAction={() => {}}
    />
  </div>
);

// `loading` spins the primary action, disables the other and keeps the alert open.
export const Working = () => (
  <div style={backdrop}>
    <Page title="Billing" line="Pro plan · renews on 1 June" />
    <AlertDialog
      visible
      title="Cancel your subscription?"
      message="You keep Pro until 1 June."
      cancelText="Back"
      actionText="Cancel plan"
      loading
      onCancel={() => {}}
      onAction={() => {}}
    />
  </div>
);
