import { useState } from "react";
import { View } from "react-native";
import { Avatar, Button, Menu } from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo, useOverlayDemo } from "./shared";

// Hand-written because the authored preview mounts the menu already open, and
// Menu renders its list through Popover — a portal whose transparent scrim
// covers the page until something dismisses it. See `useOverlayDemo`. The
// anchor opens it here, as it does in real use.

const ContextMenu = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Menu
        visible={open}
        onClose={hide}
        anchor={
          <Button variant="tonal" iconName="dots-vertical" onClick={show}>
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
    </View>
  );
};

const WithDisabledItems = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Menu
        visible={open}
        onClose={hide}
        anchor={
          <Button variant="outlined" iconName="export-variant" onClick={show}>
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
    </View>
  );
};

const Selected = () => {
  const { open, show, hide } = useOverlayDemo();
  const [chosen, setChosen] = useState(["system"]);

  return (
    <View style={demo.panel}>
      <Menu
        visible={open}
        onClose={hide}
        selected={chosen}
        onClick={(item) => setChosen([item.id])}
        anchor={
          <Button variant="outlined" iconName="theme-light-dark" onClick={show}>
            Appearance
          </Button>
        }
        items={[
          { id: "light", label: "Light", icon: "white-balance-sunny" },
          { id: "dark", label: "Dark", icon: "weather-night" },
          { id: "system", label: "System", icon: "laptop" },
        ]}
      />
    </View>
  );
};

const Dividers = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Menu
        visible={open}
        onClose={hide}
        dividers
        anchor={
          <Button variant="tonal" iconName="sort" onClick={show}>
            Sort by
          </Button>
        }
        items={[
          { id: "name", label: "Name", icon: "sort-alphabetical-ascending" },
          { id: "date", label: "Date modified", icon: "calendar-outline" },
          { id: "size", label: "Size", icon: "file-outline" },
        ]}
      />
    </View>
  );
};

const AnchorPosition = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Menu
        visible={open}
        onClose={hide}
        anchorPosition={{ vertical: "top", horizontal: "right" }}
        anchor={
          <Button variant="outlined" iconName="dots-vertical" onClick={show}>
            More
          </Button>
        }
        items={[
          { id: "pin", label: "Pin to top", icon: "pin-outline" },
          { id: "archive", label: "Archive", icon: "archive-outline" },
          { id: "mute", label: "Mute", icon: "bell-off-outline" },
        ]}
      />
    </View>
  );
};

const AccountMenu = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Menu
        visible={open}
        closeOnSelect={false}
        onClose={hide}
        anchor={
          <Avatar name="Marta Rossi" size={40} status="online" onClick={show} />
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
          { id: "logout", label: "Sign out", icon: "logout", onClick: hide },
        ]}
      />
    </View>
  );
};

export const variants: Variant[] = [
  { name: "ContextMenu", title: "Context menu", render: ContextMenu },
  {
    name: "WithDisabledItems",
    title: "With disabled items",
    render: WithDisabledItems,
  },
  {
    name: "Selected",
    title: "Selected",
    description:
      "selected marks items with a check; the menu's onClick moves the mark.",
    render: Selected,
  },
  {
    name: "Dividers",
    title: "Dividers",
    description: "dividers draws a rule between every pair of items.",
    render: Dividers,
  },
  {
    name: "AnchorPosition",
    title: "Anchor position",
    description:
      "anchorPosition opens the menu above the anchor, right edges aligned.",
    render: AnchorPosition,
  },
  {
    name: "AccountMenu",
    title: "Account menu",
    description:
      "closeOnSelect={false} keeps the menu open while items are pressed.",
    render: AccountMenu,
  },
];
