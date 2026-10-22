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
      action={{ label: "Undo", onClick: () => {} }}
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
        severity="success"
        message="Published @its/glowup-ui 0.1.0 to the registry."
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        severity="warning"
        message="Storage is almost full: 92% of 5 GB used."
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        severity="info"
        message="A new version of the app is available."
        action={{ label: "Update", onClick: () => {} }}
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        severity="error"
        message="Upload failed — the token file is larger than 2 MB."
        action={{ label: "Retry", onClick: () => {} }}
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
      action={{ label: "Details", onClick: () => {} }}
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

export const Outlined = () => (
  <View style={{ flexDirection: "column", gap: 12 }}>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        variant="outlined"
        message="Changes saved."
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        variant="outlined"
        severity="success"
        message="Published @its/glowup-ui 0.1.0 to the registry."
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        variant="outlined"
        severity="warning"
        message="Storage is almost full: 92% of 5 GB used."
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        variant="outlined"
        severity="info"
        message="A new version of the app is available."
        action={{ label: "Update", onClick: () => {} }}
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        variant="outlined"
        severity="error"
        message="Upload failed — the token file is larger than 2 MB."
        action={{ label: "Retry", onClick: () => {} }}
        onDismiss={() => {}}
      />
    </View>
  </View>
);

export const Positions = () => (
  <View style={{ flexDirection: "column", gap: 12 }}>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        position="top-left"
        message="Top left."
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        position="top-center"
        message="Top center."
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        position="top-right"
        message="Top right."
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        position="bottom-left"
        message="Bottom left."
        onDismiss={() => {}}
      />
    </View>
    <View style={frame(96)}>
      <Snackbar
        visible
        duration={0}
        position="bottom-right"
        message="Bottom right."
        onDismiss={() => {}}
      />
    </View>
  </View>
);

// onClose adds the close button and keeps the snackbar up until it is used.
export const Closable = () => (
  <View style={frame(120)}>
    <Snackbar
      visible
      severity="info"
      message="3 edits are waiting to sync."
      action={{ label: "Sync now", onClick: () => {} }}
      onClose={() => {}}
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
  {
    name: "Outlined",
    title: "Outlined",
    render: Outlined,
  },
  {
    name: "Positions",
    title: "Positions",
    render: Positions,
  },
  {
    name: "Closable",
    title: "Closable",
    render: Closable,
  },
];
