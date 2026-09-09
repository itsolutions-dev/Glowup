import React from "react";
import { Menu, Button, Avatar } from "@glowup/ui";

// Menu renders its list inside Popover, which portals into document.body with
// a position: fixed layer positioned from the anchor's measured window
// coordinates — it fills the capture viewport, not the card. Needs
// cfg.overrides { cardMode: "single", viewport: "480x460" }.
const host: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: 320,
};

export const ContextMenu = () => (
  <div style={host}>
    <Menu
      visible
      onDismiss={() => {}}
      anchor={
        <Button mode="tonal" iconName="dots-vertical" onPress={() => {}}>
          Chip
        </Button>
      }
      items={[
        { id: "edit", label: "Edit props", icon: "pencil-outline", onPress: () => {} },
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
  </div>
);

export const WithDisabledItems = () => (
  <div style={host}>
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
  </div>
);

export const AccountMenu = () => (
  <div style={host}>
    <Menu
      visible
      closeOnSelect={false}
      onDismiss={() => {}}
      anchor={<Avatar name="Marta Rossi" size={40} status="online" onPress={() => {}} />}
      items={[
        { id: "profile", label: "Marta Rossi", icon: "account-outline", onPress: () => {} },
        { id: "theme", label: "Appearance", icon: "theme-light-dark", onPress: () => {} },
        { id: "lang", label: "Language", icon: "translate", trailing: "IT", onPress: () => {} },
        { id: "settings", label: "Settings", icon: "cog", onPress: () => {} },
        {
          id: "logout",
          label: "Sign out",
          icon: "logout",
          onPress: () => {},
        },
      ]}
    />
  </div>
);
