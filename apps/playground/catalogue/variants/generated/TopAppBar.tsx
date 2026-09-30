// GENERATED — do not edit.
// Source: .design-sync/previews/TopAppBar.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Avatar, IconButton, TopAppBar } from "@its/glowup-ui";

const bar: ViewStyle = { width: 400, flexDirection: "row" };

const back = (
  <IconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => {}} />
);

const actions = (
  <>
    <IconButton icon="magnify" accessibilityLabel="Search" onPress={() => {}} />
    <IconButton
      icon="dots-vertical"
      accessibilityLabel="More"
      onPress={() => {}}
    />
  </>
);

export const Small = () => (
  <View style={bar}>
    <TopAppBar
      title="Inbox"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </View>
);

export const CenterAligned = () => (
  <View style={bar}>
    <TopAppBar
      variant="center"
      title="Glowup"
      leading={
        <IconButton icon="menu" accessibilityLabel="Menu" onPress={() => {}} />
      }
      actions={<Avatar name="Marta Rossi" size={32} />}
      safeArea={false}
    />
  </View>
);

export const Medium = () => (
  <View style={bar}>
    <TopAppBar
      variant="medium"
      title="Team settings"
      subtitle="12 members"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </View>
);

export const Large = () => (
  <View style={bar}>
    <TopAppBar
      variant="large"
      title="Quarterly report"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </View>
);

export const Elevated = () => (
  <View style={bar}>
    <TopAppBar
      elevated
      title="Invoice #10428"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Small",
    title: "Small",
    render: Small,
  },
  {
    name: "CenterAligned",
    title: "Center aligned",
    render: CenterAligned,
  },
  {
    name: "Medium",
    title: "Medium",
    render: Medium,
  },
  {
    name: "Large",
    title: "Large",
    render: Large,
  },
  {
    name: "Elevated",
    title: "Elevated",
    render: Elevated,
  },
];
