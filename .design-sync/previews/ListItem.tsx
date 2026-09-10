import React from "react";
import { Avatar, Icon, ListItem, Toggle, Typography } from "@its/glowup-ui";

const list: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 340,
};

const chevron = <Icon source="chevron-right" size={20} color="#79747E" />;

export const SettingsList = () => (
  <div style={list}>
    <ListItem
      onPress={() => {}}
      leading={<Icon source="account-multiple-outline" size={24} />}
      secondary="3 members, 1 pending invite"
      trailing={chevron}
    >
      Workspace members
    </ListItem>
    <ListItem
      onPress={() => {}}
      leading={<Icon source="lock-outline" size={24} />}
      secondary="Passkeys and two-factor"
      trailing={chevron}
    >
      Privacy and security
    </ListItem>
    <ListItem
      leading={<Icon source="email-outline" size={24} />}
      secondary="Weekly digest"
      trailing={<Toggle value onValueChange={() => {}} />}
    >
      Email notifications
    </ListItem>
  </div>
);

export const Slots = () => (
  <div style={list}>
    <ListItem leading={<Icon source="folder-multiple-outline" size={24} />}>
      leading only
    </ListItem>
    <ListItem trailing={chevron}>trailing only</ListItem>
    <ListItem secondary="the second line sits under the primary one">
      secondary only
    </ListItem>
    <ListItem
      leading={<Icon source="chart-box" size={24} />}
      secondary="all three slots filled"
      trailing={chevron}
    >
      leading + secondary + trailing
    </ListItem>
  </div>
);

export const WithAvatars = () => (
  <div style={list}>
    {[
      { name: "Ada Lovelace", role: "Engineering lead" },
      { name: "Grace Hopper", role: "Platform architect" },
      { name: "Katherine Johnson", role: "Data science" },
    ].map((m) => (
      <ListItem
        key={m.name}
        onPress={() => {}}
        leading={<Avatar name={m.name} size={40} />}
        secondary={m.role}
        trailing={<Typography variant="labelLarge">Owner</Typography>}
      >
        {m.name}
      </ListItem>
    ))}
  </div>
);

export const CustomSurface = () => (
  <div style={list}>
    {[
      { label: "Milan — Hub 01", parcels: "1.240 parcels", tint: "#D7E3FF" },
      { label: "Turin — Hub 02", parcels: "860 parcels", tint: "#E8DEF8" },
      { label: "Genoa — Hub 03", parcels: "312 parcels", tint: "#FFD8E4" },
    ].map((hub) => (
      <ListItem
        key={hub.label}
        onPress={() => {}}
        leading={<Icon source="domain" size={24} color="#1D1B20" />}
        secondary={hub.parcels}
        itemContainerStyle={{ backgroundColor: hub.tint }}
        itemTextStyle={{ color: "#1D1B20" }}
      >
        {hub.label}
      </ListItem>
    ))}
  </div>
);

/** No slots at all: the original single-line centred tile is still what you get. */
export const TextOnly = () => (
  <div style={list}>
    <ListItem onPress={() => {}}>Q1 revenue report</ListItem>
    <ListItem onPress={() => {}}>Warehouse capacity plan</ListItem>
    <ListItem onPress={() => {}}>Supplier contract renewal</ListItem>
  </div>
);
