// GENERATED — do not edit.
// Source: .design-sync/previews/SpeedDial.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { SpeedDial, Paper, Typography, Divider } from "@its/glowup-ui";
import type { SpeedDialAction } from "@its/glowup-ui";

// SpeedDial's root is an absolutely-positioned overlay that fills its nearest
// positioned ancestor, so it needs a sized surface to float over.
const screen: ViewStyle = {
  width: 380,
  height: 260,
  flexDirection: "row",
};

const actions: SpeedDialAction[] = [
  {
    id: "doc",
    label: "New document",
    icon: "file-document-outline",
    onPress: () => {},
  },
  {
    id: "upload",
    label: "Upload file",
    icon: "upload-outline",
    onPress: () => {},
  },
  {
    id: "folder",
    label: "New folder",
    icon: "folder-plus-outline",
    onPress: () => {},
  },
];

export const OnASurface = () => (
  <View style={screen}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <Typography variant="titleMedium">Shared drive</Typography>
      <Typography variant="bodySmall">Team Design · 128 files</Typography>
      <View style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <View style={{ height: 12 }} />
      <Typography variant="bodyMedium">Brand guidelines.pdf</Typography>
      <View style={{ height: 8 }} />
      <Typography variant="bodyMedium">Q3 roadmap.key</Typography>
      <View style={{ height: 8 }} />
      <Typography variant="bodyMedium">Component audit.xlsx</Typography>
      <SpeedDial mainIcon="plus" actions={actions} />
    </Paper>
  </View>
);

/** `defaultOpen` mounts the stack already expanded - the only way to see the labels statically. */
export const Expanded = () => (
  <View style={{ ...screen, height: 320 }}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <Typography variant="titleMedium">Shared drive</Typography>
      <Typography variant="bodySmall">Team Design · 128 files</Typography>
      <SpeedDial mainIcon="plus" actions={actions} defaultOpen />
    </Paper>
  </View>
);

export const BottomLeft = () => (
  <View style={{ ...screen, height: 200 }}>
    <Paper elevation={1} outline style={{ flex: 1 }}>
      <Typography variant="labelMedium">
        position=&quot;bottom-left&quot;
      </Typography>
      <View style={{ height: 8 }} />
      <Typography variant="bodySmall">
        The trigger anchors to the chosen corner; the labelled actions expand
        above it on press.
      </Typography>
      <SpeedDial
        mainIcon="dots-horizontal"
        actions={actions}
        position="bottom-left"
      />
    </Paper>
  </View>
);

export const variants: Variant[] = [
  {
    name: "OnASurface",
    title: "On a surface",
    render: OnASurface,
  },
  {
    name: "Expanded",
    title: "Expanded",
    description:
      "`defaultOpen` mounts the stack already expanded - the only way to see the labels statically.",
    render: Expanded,
  },
  {
    name: "BottomLeft",
    title: "Bottom left",
    render: BottomLeft,
  },
];
