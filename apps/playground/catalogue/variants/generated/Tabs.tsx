// GENERATED — do not edit.
// Source: .design-sync/previews/Tabs.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Tabs } from "@its/glowup-ui";

const wrap: ViewStyle = { width: 400, flexDirection: "row" };

export const TextTabs = () => (
  <View style={wrap}>
    <Tabs
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={0}
      onChange={() => {}}
    />
  </View>
);

export const IconTabs = () => (
  <View style={wrap}>
    <Tabs
      activeTab={0}
      onChange={() => {}}
      tabs={[
        { label: "Home", icon: "home" },
        { label: "Reports", icon: "chart-box" },
        { label: "Team", icon: "account-group" },
        { label: "Settings", icon: "cog" },
      ]}
    />
  </View>
);

export const FourTabs = () => (
  <View style={wrap}>
    <Tabs
      tabs={["Details", "Activity", "Files", "Notes"]}
      activeTab={2}
      onChange={() => {}}
    />
  </View>
);

export const TwoTabs = () => (
  <View style={wrap}>
    <Tabs
      tabs={["Sign in", "Create account"]}
      activeTab={0}
      onChange={() => {}}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "TextTabs",
    title: "Text tabs",
    render: TextTabs,
  },
  {
    name: "IconTabs",
    title: "Icon tabs",
    render: IconTabs,
  },
  {
    name: "FourTabs",
    title: "Four tabs",
    render: FourTabs,
  },
  {
    name: "TwoTabs",
    title: "Two tabs",
    render: TwoTabs,
  },
];
