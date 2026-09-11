// GENERATED — do not edit.
// Source: .design-sync/previews/IconButton.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { IconButton, Paper, Typography } from "@its/glowup-ui";

const row: ViewStyle = {
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const column: ViewStyle = {
  flexDirection: "column",
  gap: 12,
  width: 380,
};

const caption: ViewStyle = {
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
};

export const Modes = () => (
  <View style={row}>
    {(["standard", "filled", "tonal", "outlined"] as const).map((mode) => (
      <View key={mode} style={caption}>
        <IconButton
          icon="pencil-outline"
          mode={mode}
          accessibilityLabel="Edit"
          onPress={() => {}}
        />
        <Typography variant="labelSmall">{mode}</Typography>
      </View>
    ))}
  </View>
);

export const Sizes = () => (
  <View style={row}>
    {(["small", "medium", "large"] as const).map((size) => (
      <View key={size} style={caption}>
        <IconButton
          icon="magnify"
          mode="tonal"
          size={size}
          accessibilityLabel="Search"
          onPress={() => {}}
        />
        <Typography variant="labelSmall">{size}</Typography>
      </View>
    ))}
  </View>
);

export const States = () => (
  <View style={row}>
    <View style={caption}>
      <IconButton
        icon="heart-outline"
        mode="tonal"
        accessibilityLabel="Save"
        onPress={() => {}}
      />
      <Typography variant="labelSmall">default</Typography>
    </View>
    <View style={caption}>
      <IconButton
        icon="heart"
        mode="tonal"
        selected
        accessibilityLabel="Saved"
        onPress={() => {}}
      />
      <Typography variant="labelSmall">selected</Typography>
    </View>
    <View style={caption}>
      <IconButton
        icon="refresh"
        mode="filled"
        loading
        accessibilityLabel="Refreshing"
        onPress={() => {}}
      />
      <Typography variant="labelSmall">loading</Typography>
    </View>
    <View style={caption}>
      <IconButton
        icon="delete-outline"
        mode="outlined"
        disabled
        accessibilityLabel="Delete"
      />
      <Typography variant="labelSmall">disabled</Typography>
    </View>
  </View>
);

export const InAToolbar = () => (
  <View style={column}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <Typography variant="titleMedium">Component audit.xlsx</Typography>
      <Typography variant="bodySmall">Shared drive · 2.4 MB</Typography>
      <View style={{ height: 12 }} />
      <View style={row}>
        <IconButton
          icon="download"
          mode="tonal"
          accessibilityLabel="Download"
          onPress={() => {}}
        />
        <IconButton
          icon="share-variant"
          accessibilityLabel="Share"
          onPress={() => {}}
        />
        <IconButton
          icon="pencil-outline"
          accessibilityLabel="Rename"
          onPress={() => {}}
        />
        <IconButton
          icon="delete-outline"
          accessibilityLabel="Delete"
          onPress={() => {}}
        />
      </View>
    </Paper>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Modes",
    title: "Modes",
    render: Modes,
  },
  {
    name: "Sizes",
    title: "Sizes",
    render: Sizes,
  },
  {
    name: "States",
    title: "States",
    render: States,
  },
  {
    name: "InAToolbar",
    title: "In a toolbar",
    render: InAToolbar,
  },
];
