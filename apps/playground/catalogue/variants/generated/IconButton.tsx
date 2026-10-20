// GENERATED — do not edit.
// Source: .design-sync/previews/IconButton.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { IconButton, Paper, Typography } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
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
          variant={mode}
          accessibilityLabel="Edit"
          onClick={() => {}}
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
          variant="tonal"
          size={size}
          accessibilityLabel="Search"
          onClick={() => {}}
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
        variant="tonal"
        accessibilityLabel="Save"
        onClick={() => {}}
      />
      <Typography variant="labelSmall">default</Typography>
    </View>
    <View style={caption}>
      <IconButton
        icon="heart"
        variant="tonal"
        selected
        accessibilityLabel="Saved"
        onClick={() => {}}
      />
      <Typography variant="labelSmall">selected</Typography>
    </View>
    <View style={caption}>
      <IconButton
        icon="refresh"
        variant="filled"
        loading
        accessibilityLabel="Refreshing"
        onClick={() => {}}
      />
      <Typography variant="labelSmall">loading</Typography>
    </View>
    <View style={caption}>
      <IconButton
        icon="delete-outline"
        variant="outlined"
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
          variant="tonal"
          accessibilityLabel="Download"
          onClick={() => {}}
        />
        <IconButton
          icon="share-variant"
          accessibilityLabel="Share"
          onClick={() => {}}
        />
        <IconButton
          icon="pencil-outline"
          accessibilityLabel="Rename"
          onClick={() => {}}
        />
        <IconButton
          icon="delete-outline"
          accessibilityLabel="Delete"
          onClick={() => {}}
        />
      </View>
    </Paper>
  </View>
);

export const WithBadge = () => (
  <View style={row}>
    <IconButton icon="bell-outline" accessibilityLabel="Alerts" badge={3} />
    <IconButton
      icon="filter-outline"
      variant="tonal"
      accessibilityLabel="Filters"
      badge={12}
    />
    <IconButton
      icon="email-outline"
      variant="outlined"
      accessibilityLabel="Inbox"
      badge={120}
    />
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
  {
    name: "WithBadge",
    title: "With badge",
    render: WithBadge,
  },
];
