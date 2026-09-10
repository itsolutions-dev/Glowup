import React from "react";
import { NavigationBar } from "@its/glowup-ui";
import type { NavigationBarItem } from "@its/glowup-ui";

const bar: React.CSSProperties = { width: 400, display: "flex" };

const items: NavigationBarItem[] = [
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "search", label: "Search", icon: "magnify" },
  { id: "inbox", label: "Inbox", icon: "email-outline", badgeCount: 3 },
  { id: "profile", label: "Profile", icon: "account-outline" },
];

export const Default = () => (
  <div style={bar}>
    <NavigationBar items={items} activeId="home" onItemPress={() => {}} />
  </div>
);

export const LabelsOnSelected = () => (
  <div style={bar}>
    <NavigationBar
      items={items}
      activeId="inbox"
      showLabels="selected"
      onItemPress={() => {}}
    />
  </div>
);

export const WithDisabledItem = () => (
  <div style={bar}>
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
  </div>
);
