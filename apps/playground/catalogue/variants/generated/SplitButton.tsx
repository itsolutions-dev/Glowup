// GENERATED — do not edit.
// Source: .design-sync/previews/SplitButton.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { SplitButton } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  gap: 16,
  alignItems: "center",
};

const SAVE_ITEMS = [
  { id: "copy", label: "Save a copy", icon: "content-copy", onPress: () => {} },
  {
    id: "draft",
    label: "Save as draft",
    icon: "file-outline",
    onPress: () => {},
  },
  {
    id: "discard",
    label: "Discard",
    icon: "delete-outline",
    destructive: true,
    dividerAbove: true,
    onPress: () => {},
  },
] as const;

export const Filled = () => (
  <SplitButton
    iconName="content-save-outline"
    items={[...SAVE_ITEMS]}
    onPress={() => {}}
    menuAccessibilityLabel="More save options"
  >
    Save
  </SplitButton>
);

export const Modes = () => (
  <View style={row}>
    {(["filled", "tonal", "outlined"] as const).map((mode) => (
      <SplitButton
        key={mode}
        mode={mode}
        items={[...SAVE_ITEMS]}
        onPress={() => {}}
        menuAccessibilityLabel="More save options"
      >
        Save
      </SplitButton>
    ))}
  </View>
);

export const Disabled = () => (
  <SplitButton
    disabled
    iconName="send-outline"
    items={[
      {
        id: "schedule",
        label: "Schedule send",
        icon: "clock-outline",
        onPress: () => {},
      },
    ]}
    onPress={() => {}}
    menuAccessibilityLabel="More send options"
  >
    Send
  </SplitButton>
);

export const variants: Variant[] = [
  {
    name: "Filled",
    title: "Filled",
    render: Filled,
  },
  {
    name: "Modes",
    title: "Modes",
    render: Modes,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
];
