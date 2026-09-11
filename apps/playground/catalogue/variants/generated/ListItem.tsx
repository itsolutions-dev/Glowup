// GENERATED — do not edit.
// Source: .design-sync/previews/ListItem.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Avatar, Icon, ListItem, Toggle, Typography } from "@its/glowup-ui";

const list: ViewStyle = {
  flexDirection: "column",
  width: 340,
};

const chevron = <Icon source="chevron-right" size={20} color="#79747E" />;

export const SettingsList = () => (
  <View style={list}>
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
  </View>
);

export const Slots = () => (
  <View style={list}>
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
  </View>
);

export const WithAvatars = () => (
  <View style={list}>
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
  </View>
);

export const CustomSurface = () => (
  <View style={list}>
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
  </View>
);

/** No slots at all: the original single-line centred tile is still what you get. */
export const TextOnly = () => (
  <View style={list}>
    <ListItem onPress={() => {}}>Q1 revenue report</ListItem>
    <ListItem onPress={() => {}}>Warehouse capacity plan</ListItem>
    <ListItem onPress={() => {}}>Supplier contract renewal</ListItem>
  </View>
);

export const variants: Variant[] = [
  {
    name: "SettingsList",
    title: "Settings list",
    render: SettingsList,
  },
  {
    name: "Slots",
    title: "Slots",
    render: Slots,
  },
  {
    name: "WithAvatars",
    title: "With avatars",
    render: WithAvatars,
  },
  {
    name: "CustomSurface",
    title: "Custom surface",
    render: CustomSurface,
  },
  {
    name: "TextOnly",
    title: "Text only",
    description:
      "No slots at all: the original single-line centred tile is still what you get.",
    render: TextOnly,
  },
];
