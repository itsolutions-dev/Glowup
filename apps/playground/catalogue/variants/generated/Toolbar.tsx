// GENERATED — do not edit.
// Source: .design-sync/previews/Toolbar.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { FAB, IconButton, Toolbar } from "@its/glowup-ui";

const stage: ViewStyle = {
  width: 400,
  flexDirection: "row",
  justifyContent: "center",
};

const formatting = [
  "format-bold",
  "format-italic",
  "format-underline",
  "link",
].map((icon) => (
  <IconButton
    key={icon}
    icon={icon as "format-bold"}
    accessibilityLabel={icon.replace("format-", "")}
    onPress={() => {}}
  />
));

export const Floating = () => (
  <View style={stage}>
    <Toolbar
      variant="floating"
      safeArea={false}
      accessibilityLabel="Formatting"
    >
      {formatting}
    </Toolbar>
  </View>
);

export const Vibrant = () => (
  <View style={stage}>
    <Toolbar
      variant="floating"
      color="vibrant"
      safeArea={false}
      accessibilityLabel="Formatting"
    >
      {formatting}
    </Toolbar>
  </View>
);

export const WithFab = () => (
  <View style={stage}>
    <Toolbar
      variant="floating"
      safeArea={false}
      accessibilityLabel="Formatting"
      fab={<FAB icon="plus" placement="inline" onPress={() => {}} />}
    >
      {formatting}
    </Toolbar>
  </View>
);

export const Docked = () => (
  <View style={{ width: 400, flexDirection: "row" }}>
    <Toolbar
      variant="docked"
      safeArea={false}
      accessibilityLabel="Photo actions"
    >
      {[
        "share-variant-outline",
        "heart-outline",
        "pencil-outline",
        "delete-outline",
      ].map((icon) => (
        <IconButton
          key={icon}
          icon={icon as "heart-outline"}
          accessibilityLabel={icon.replace("-outline", "")}
          onPress={() => {}}
        />
      ))}
    </Toolbar>
  </View>
);

export const Vertical = () => (
  <View style={{ height: 240, flexDirection: "row" }}>
    <Toolbar
      variant="floating"
      orientation="vertical"
      safeArea={false}
      accessibilityLabel="Formatting"
    >
      {formatting}
    </Toolbar>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Floating",
    title: "Floating",
    render: Floating,
  },
  {
    name: "Vibrant",
    title: "Vibrant",
    render: Vibrant,
  },
  {
    name: "WithFab",
    title: "With FAB",
    render: WithFab,
  },
  {
    name: "Docked",
    title: "Docked",
    render: Docked,
  },
  {
    name: "Vertical",
    title: "Vertical",
    render: Vertical,
  },
];
