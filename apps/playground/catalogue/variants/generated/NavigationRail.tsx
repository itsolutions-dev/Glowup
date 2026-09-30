// GENERATED — do not edit.
// Source: .design-sync/previews/NavigationRail.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { FAB, IconButton, NavigationRail } from "@its/glowup-ui";

const frame: ViewStyle = { height: 400, flexDirection: "row" };

const ITEMS = [
  { id: "home", label: "Home", icon: "home-outline" as const },
  { id: "search", label: "Search", icon: "magnify" as const },
  {
    id: "inbox",
    label: "Inbox",
    icon: "inbox-outline" as const,
    badgeCount: 4,
  },
  { id: "settings", label: "Settings", icon: "cog-outline" as const },
];

export const Default = () => (
  <View style={frame}>
    <NavigationRail items={ITEMS} activeId="inbox" onItemPress={() => {}} />
  </View>
);

export const WithFab = () => (
  <View style={frame}>
    <NavigationRail
      items={ITEMS}
      activeId="home"
      onItemPress={() => {}}
      alignment="top"
      header={
        <>
          <IconButton
            icon="menu"
            accessibilityLabel="Menu"
            onPress={() => {}}
          />
          <FAB icon="pencil-outline" placement="inline" onPress={() => {}} />
        </>
      }
    />
  </View>
);

export const SelectedLabelOnly = () => (
  <View style={frame}>
    <NavigationRail
      items={ITEMS}
      activeId="search"
      onItemPress={() => {}}
      showLabels="selected"
    />
  </View>
);

export const IconsOnly = () => (
  <View style={frame}>
    <NavigationRail
      items={ITEMS}
      activeId="settings"
      onItemPress={() => {}}
      showLabels="none"
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
    name: "WithFab",
    title: "With FAB",
    render: WithFab,
  },
  {
    name: "SelectedLabelOnly",
    title: "Selected label only",
    render: SelectedLabelOnly,
  },
  {
    name: "IconsOnly",
    title: "Icons only",
    render: IconsOnly,
  },
];
