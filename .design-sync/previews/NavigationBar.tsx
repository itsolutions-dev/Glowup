import React from "react";
import { NavBar } from "@its/glowup-ui";
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
    <NavBar items={items} activeId="home" onClick={() => {}} />
  </div>
);

export const LabelsOnSelected = () => (
  <div style={bar}>
    <NavBar
      items={items}
      activeId="inbox"
      showLabels="selected"
      onClick={() => {}}
    />
  </div>
);

export const WithDisabledItem = () => (
  <div style={bar}>
    <NavBar
      activeId="library"
      onClick={() => {}}
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
