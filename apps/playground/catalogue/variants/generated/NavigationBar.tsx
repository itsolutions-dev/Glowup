// GENERATED — do not edit.
// Source: .design-sync/previews/NavigationBar.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { NavigationBar } from "@its/glowup-ui";
import type { NavigationBarItem } from "@its/glowup-ui";

const bar: ViewStyle = { width: 400 };

const items: NavigationBarItem[] = [
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "search", label: "Search", icon: "magnify" },
  { id: "inbox", label: "Inbox", icon: "email-outline", badgeCount: 3 },
  { id: "profile", label: "Profile", icon: "account-outline" },
];

export const Default = () => (
  <View style={bar}>
    <NavigationBar items={items} activeId="home" onItemPress={() => {}} />
  </View>
);

export const LabelsOnSelected = () => (
  <View style={bar}>
    <NavigationBar
      items={items}
      activeId="inbox"
      showLabels="selected"
      onItemPress={() => {}}
    />
  </View>
);

export const WithDisabledItem = () => (
  <View style={bar}>
    <NavigationBar
      activeId="library"
      onItemPress={() => {}}
      items={[
        { id: "library", label: "Library", icon: "bookshelf" },
        {
          id: "downloads",
          label: "Offline",
          icon: "download-outline",
          badgeCount: 12,
        },
        {
          id: "sync",
          label: "Sync",
          icon: "cloud-off-outline",
          disabled: true,
        },
      ]}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Default",
    title: "Default",
    render: Default,
  },
  {
    name: "LabelsOnSelected",
    title: "Labels on selected",
    render: LabelsOnSelected,
  },
  {
    name: "WithDisabledItem",
    title: "With disabled item",
    render: WithDisabledItem,
  },
];
