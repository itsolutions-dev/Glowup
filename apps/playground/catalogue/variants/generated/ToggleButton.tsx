// GENERATED — do not edit.
// Source: .design-sync/previews/ToggleButton.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { ToggleButton, Typography } from "@its/glowup-ui";

// ToggleButton is the segment leaf: isFirst/isLast round the outer ends, so it is
// only ever true-to-life inside a row of siblings.
const segments: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
};

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 8,
  alignItems: "flex-start",
};

export const Segments = () => (
  <View style={stack}>
    <Typography variant="labelLarge">View</Typography>
    <View style={segments}>
      <ToggleButton
        label="List"
        icon="format-list-bulleted"
        active
        isFirst
        onPress={() => {}}
      />
      <ToggleButton
        label="Grid"
        icon="view-grid-outline"
        active={false}
        onPress={() => {}}
      />
      <ToggleButton
        label="Cards"
        icon="card-outline"
        active={false}
        isLast
        onPress={() => {}}
      />
    </View>
  </View>
);

export const IconOnly = () => (
  <View style={stack}>
    <Typography variant="labelLarge">Text alignment</Typography>
    <View style={segments}>
      <ToggleButton
        icon="format-align-left"
        active
        isFirst
        onPress={() => {}}
      />
      <ToggleButton
        icon="format-align-center"
        active={false}
        onPress={() => {}}
      />
      <ToggleButton
        icon="format-align-right"
        active={false}
        onPress={() => {}}
      />
      <ToggleButton
        icon="format-align-justify"
        active={false}
        isLast
        onPress={() => {}}
      />
    </View>
  </View>
);

export const LabelOnly = () => (
  <View style={segments}>
    <ToggleButton label="Day" active={false} isFirst onPress={() => {}} />
    <ToggleButton label="Week" active onPress={() => {}} />
    <ToggleButton label="Month" active={false} onPress={() => {}} />
    <ToggleButton label="Year" active={false} isLast onPress={() => {}} />
  </View>
);

export const Standalone = () => (
  <View
    style={{
      flexDirection: "row",
      gap: 16,
      alignItems: "center",
      flexWrap: "wrap",
    }}
  >
    <ToggleButton
      label="Notifications"
      icon="bell-outline"
      active
      isFirst
      isLast
      onPress={() => {}}
    />
    <ToggleButton
      label="Do not disturb"
      icon="bell-off-outline"
      active={false}
      isFirst
      isLast
      onPress={() => {}}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Segments",
    title: "Segments",
    render: Segments,
  },
  {
    name: "IconOnly",
    title: "Icon only",
    render: IconOnly,
  },
  {
    name: "LabelOnly",
    title: "Label only",
    render: LabelOnly,
  },
  {
    name: "Standalone",
    title: "Standalone",
    render: Standalone,
  },
];
