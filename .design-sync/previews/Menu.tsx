import React from "react";
import { Menu, Button, Avatar } from "@its/glowup-ui";

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
      onClose={() => {}}
      anchor={
        <Button variant="tonal" iconName="dots-vertical" onClick={() => {}}>
          Chip
        </Button>
      }
      items={[
        {
          id: "edit",
          label: "Edit props",
          icon: "pencil-outline",
          onClick: () => {},
        },
        {
          id: "duplicate",
          label: "Duplicate",
          icon: "content-copy",
          trailing: "Ctrl+D",
          onClick: () => {},
        },
        {
          id: "share",
          label: "Copy link",
          icon: "link-variant",
          onClick: () => {},
        },
        {
          id: "delete",
          label: "Delete",
          icon: "delete-outline",
          destructive: true,
          onClick: () => {},
        },
      ]}
    />
  </div>
);

export const WithDisabledItems = () => (
  <div style={host}>
    <Menu
      visible
      onClose={() => {}}
      anchor={
        <Button variant="outlined" iconName="export-variant" onClick={() => {}}>
          Export
        </Button>
      }
      items={[
        { id: "png", label: "PNG", icon: "image-outline", onClick: () => {} },
        { id: "svg", label: "SVG", icon: "vector-square", onClick: () => {} },
        {
          id: "figma",
          label: "Figma library",
          icon: "shape-outline",
          trailing: "Pro",
          disabled: true,
          onClick: () => {},
        },
        {
          id: "npm",
          label: "npm package",
          icon: "package-variant-closed",
          trailing: "Pro",
          disabled: true,
          onClick: () => {},
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
      onClose={() => {}}
      anchor={
        <Avatar
          name="Marta Rossi"
          size={40}
          status="online"
          onClick={() => {}}
        />
      }
      items={[
        {
          id: "profile",
          label: "Marta Rossi",
          icon: "account-outline",
          onClick: () => {},
        },
        {
          id: "theme",
          label: "Appearance",
          icon: "theme-light-dark",
          onClick: () => {},
        },
        {
          id: "lang",
          label: "Language",
          icon: "translate",
          trailing: "IT",
          onClick: () => {},
        },
        { id: "settings", label: "Settings", icon: "cog", onClick: () => {} },
        {
          id: "logout",
          label: "Sign out",
          icon: "logout",
          onClick: () => {},
        },
      ]}
    />
  </div>
);

export const Selected = () => (
  <div style={host}>
    <Menu
      visible
      onClose={() => {}}
      selected={["system"]}
      onClick={() => {}}
      anchor={
        <Button
          variant="outlined"
          iconName="theme-light-dark"
          onClick={() => {}}
        >
          Appearance
        </Button>
      }
      items={[
        { id: "light", label: "Light", icon: "white-balance-sunny" },
        { id: "dark", label: "Dark", icon: "weather-night" },
        { id: "system", label: "System", icon: "laptop" },
      ]}
    />
  </div>
);

export const Dividers = () => (
  <div style={host}>
    <Menu
      visible
      dividers
      onClose={() => {}}
      anchor={
        <Button variant="tonal" iconName="sort" onClick={() => {}}>
          Sort by
        </Button>
      }
      items={[
        { id: "name", label: "Name", icon: "sort-alphabetical-ascending" },
        { id: "date", label: "Date modified", icon: "calendar-outline" },
        { id: "size", label: "Size", icon: "file-outline" },
      ]}
    />
  </div>
);

// The anchor sits low in the card so the menu has room above it.
export const AnchorPosition = () => (
  <div style={{ ...host, justifyContent: "flex-end", height: 320 }}>
    <Menu
      visible
      onClose={() => {}}
      anchorPosition={{ vertical: "top", horizontal: "right" }}
      anchor={
        <Button variant="outlined" iconName="dots-vertical" onClick={() => {}}>
          More
        </Button>
      }
      items={[
        { id: "pin", label: "Pin to top", icon: "pin-outline" },
        { id: "archive", label: "Archive", icon: "archive-outline" },
        { id: "mute", label: "Mute", icon: "bell-off-outline" },
      ]}
    />
  </div>
);
