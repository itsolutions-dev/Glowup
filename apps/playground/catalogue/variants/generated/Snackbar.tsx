// GENERATED — do not edit.
// Source: .design-sync/previews/Snackbar.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Snackbar, Typography, Card } from "@its/glowup-ui";

// Snackbar is NOT a portal — it is an absolutely-positioned sibling
// (bottom: 24, left/right: 16). A plain <View> is position: static, so it needs
// position: relative plus a real height to become the containing block.
const frame = (height: number): ViewStyle => ({
  position: "relative",
  width: 420,
  height,
  flexDirection: "column",
  overflow: "hidden",
});

// duration={0} disables the auto-hide timer so the resting state is captured.
export const WithAction = () => (
  <View style={frame(180)}>
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
  </View>
);

export const Types = () => (
  <View style={{ flexDirection: "column", gap: 12 }}>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        message="Changes saved."
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        type="success"
        message="Published @its/glowup-ui 0.1.0 to the registry."
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        type="error"
        message="Upload failed — the token file is larger than 2 MB."
        action={{ label: "Retry", onPress: () => {} }}
        onDismiss={() => {}}
      />
    </View>
  </View>
);

export const CustomIcon = () => (
  <View style={frame(120)}>
    <Snackbar
      visible
      duration={0}
      icon="cloud-off-outline"
      message="Offline — 3 edits queued."
      action={{ label: "Details", onPress: () => {} }}
      onDismiss={() => {}}
    />
  </View>
);

export const LongMessage = () => (
  <View style={frame(140)}>
    <Snackbar
      visible
      duration={0}
      message="Marta Rossi was invited to the shared component library and will receive read access once she signs in."
      onDismiss={() => {}}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "WithAction",
    title: "With action",
    render: WithAction,
  },
  {
    name: "Types",
    title: "Types",
    render: Types,
  },
  {
    name: "CustomIcon",
    title: "Custom icon",
    render: CustomIcon,
  },
  {
    name: "LongMessage",
    title: "Long message",
    render: LongMessage,
  },
];
