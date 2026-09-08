import React from "react";
import { ListItem } from "@glowup/ui";

const list: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 340,
};

export const SettingsList = () => (
  <div style={list}>
    <ListItem onPress={() => {}}>Account settings</ListItem>
    <ListItem onPress={() => {}}>Notifications</ListItem>
    <ListItem onPress={() => {}}>Privacy and security</ListItem>
    <ListItem onPress={() => {}}>Connected apps</ListItem>
  </div>
);

export const LeftAligned = () => (
  <div style={list}>
    {[
      "Q1 revenue report",
      "Warehouse capacity plan",
      "Supplier contract renewal",
    ].map((label) => (
      <ListItem
        key={label}
        onPress={() => {}}
        itemTextStyle={{ textAlign: "left", paddingVertical: 12 }}
      >
        {label}
      </ListItem>
    ))}
  </div>
);

export const CustomSurface = () => (
  <div style={list}>
    {[
      { label: "Milan — Hub 01", tint: "#D7E3FF" },
      { label: "Turin — Hub 02", tint: "#E8DEF8" },
      { label: "Genoa — Hub 03", tint: "#FFD8E4" },
    ].map((hub) => (
      <ListItem
        key={hub.label}
        onPress={() => {}}
        itemContainerStyle={{ backgroundColor: hub.tint }}
        itemTextStyle={{ textAlign: "left", color: "#1D1B20" }}
      >
        {hub.label}
      </ListItem>
    ))}
  </div>
);
