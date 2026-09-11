// GENERATED — do not edit.
// Source: .design-sync/previews/ConfirmDialog.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { ConfirmDialog, Typography } from "@its/glowup-ui";

// ConfirmDialog wraps Modal, which portals into document.body with a
// position: fixed scrim — it fills the capture viewport, not the card.
// Needs cfg.overrides { cardMode: "single", viewport: "560x400" }.
const backdrop: ViewStyle = {
  flexDirection: "column",
  gap: 4,
  width: 460,
};

export const Destructive = () => (
  <View style={backdrop}>
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
  </View>
);

export const Confirm = () => (
  <View style={backdrop}>
    <ConfirmDialog
      visible
      title="Publish 0.1.0?"
      message="34 components will be pushed to the registry and every dependent workspace will see the update."
      confirmText="Publish"
      cancelText="Not yet"
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  </View>
);

export const DefaultLabels = () => (
  <View style={backdrop}>
    <ConfirmDialog
      visible
      title="Discard draft?"
      message="Your unsaved changes to the login screen will be lost."
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Destructive",
    title: "Destructive",
    render: Destructive,
  },
  {
    name: "Confirm",
    title: "Confirm",
    render: Confirm,
  },
  {
    name: "DefaultLabels",
    title: "Default labels",
    render: DefaultLabels,
  },
];
