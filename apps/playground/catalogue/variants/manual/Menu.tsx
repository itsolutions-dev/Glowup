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
        onDismiss={hide}
        anchor={
          <Button mode="tonal" iconName="dots-vertical" onPress={show}>
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
};

const WithDisabledItems = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Menu
        visible={open}
        onDismiss={hide}
        anchor={
          <Button mode="outlined" iconName="export-variant" onPress={show}>
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
};

const AccountMenu = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Menu
        visible={open}
        closeOnSelect={false}
        onDismiss={hide}
        anchor={
          <Avatar name="Marta Rossi" size={40} status="online" onPress={show} />
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
          { id: "logout", label: "Sign out", icon: "logout", onPress: hide },
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
    name: "AccountMenu",
    title: "Account menu",
    description:
      "closeOnSelect={false} keeps the menu open while items are pressed.",
    render: AccountMenu,
  },
];
