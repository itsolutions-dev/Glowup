// GENERATED — do not edit.
// Source: .design-sync/previews/Menu.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Menu, Button, Avatar } from "@its/glowup-ui";

// Menu renders its list inside Popover, which portals into document.body with
// a position: fixed layer positioned from the anchor's measured window
// coordinates — it fills the capture viewport, not the card. Needs
// cfg.overrides { cardMode: "single", viewport: "480x460" }.
const host: ViewStyle = {
  flexDirection: "column",
  alignItems: "flex-start",
  width: 320,
};

export const ContextMenu = () => (
  <View style={host}>
    <Menu
      visible
      onDismiss={() => {}}
      anchor={
        <Button mode="tonal" iconName="dots-vertical" onPress={() => {}}>
          Chip
        </Button>
      }
      items={[
        {
          id: "edit",
          label: "Edit props",
          icon: "pencil-outline",
          onPress: () => {},
        },
        {
          id: "duplicate",
          label: "Duplicate",
          icon: "content-copy",
          trailing: "Ctrl+D",
          onPress: () => {},
        },
        {
          id: "share",
          label: "Copy link",
          icon: "link-variant",
          onPress: () => {},
        },
        {
          id: "delete",
          label: "Delete",
          icon: "delete-outline",
          destructive: true,
          onPress: () => {},
        },
      ]}
    />
  </View>
);

export const WithDisabledItems = () => (
  <View style={host}>
    <Menu
      visible
      onDismiss={() => {}}
      anchor={
        <Button mode="outlined" iconName="export-variant" onPress={() => {}}>
          Export
        </Button>
      }
      items={[
        { id: "png", label: "PNG", icon: "image-outline", onPress: () => {} },
        { id: "svg", label: "SVG", icon: "vector-square", onPress: () => {} },
        {
          id: "figma",
          label: "Figma library",
          icon: "shape-outline",
          trailing: "Pro",
          disabled: true,
          onPress: () => {},
        },
        {
          id: "npm",
          label: "npm package",
          icon: "package-variant-closed",
          trailing: "Pro",
          disabled: true,
          onPress: () => {},
        },
      ]}
    />
  </View>
);

export const AccountMenu = () => (
  <View style={host}>
    <Menu
      visible
      closeOnSelect={false}
      onDismiss={() => {}}
      anchor={
        <Avatar
          name="Marta Rossi"
          size={40}
          status="online"
          onPress={() => {}}
        />
      }
      items={[
        {
          id: "profile",
          label: "Marta Rossi",
          icon: "account-outline",
          onPress: () => {},
        },
        {
          id: "theme",
          label: "Appearance",
          icon: "theme-light-dark",
          onPress: () => {},
        },
        {
          id: "lang",
          label: "Language",
          icon: "translate",
          trailing: "IT",
          onPress: () => {},
        },
        { id: "settings", label: "Settings", icon: "cog", onPress: () => {} },
        {
          id: "logout",
          label: "Sign out",
          icon: "logout",
          onPress: () => {},
        },
      ]}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "ContextMenu",
    title: "Context menu",
    render: ContextMenu,
  },
  {
    name: "WithDisabledItems",
    title: "With disabled items",
    render: WithDisabledItems,
  },
  {
    name: "AccountMenu",
    title: "Account menu",
    render: AccountMenu,
  },
];
