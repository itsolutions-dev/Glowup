import React from "react";
import { FAB, IconButton, NavigationRail } from "@its/glowup-ui";

const frame: React.CSSProperties = { height: 400, display: "flex" };
// The header (menu + FAB) adds ~120px above the four destinations.
const tall: React.CSSProperties = { height: 480, display: "flex" };

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
  <div style={frame}>
    <NavigationRail items={ITEMS} activeId="inbox" onItemPress={() => {}} />
  </div>
);

export const WithFab = () => (
  <div style={tall}>
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
            onClick={() => {}}
          />
          <FAB icon="pencil-outline" placement="inline" onClick={() => {}} />
        </>
      }
    />
  </div>
);

export const SelectedLabelOnly = () => (
  <div style={frame}>
    <NavigationRail
      items={ITEMS}
      activeId="search"
      onItemPress={() => {}}
      showLabels="selected"
    />
  </div>
);

export const IconsOnly = () => (
  <div style={frame}>
    <NavigationRail
      items={ITEMS}
      activeId="settings"
      onItemPress={() => {}}
      showLabels="none"
    />
  </div>
);
