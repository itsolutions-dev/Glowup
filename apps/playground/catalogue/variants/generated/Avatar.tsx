// GENERATED — do not edit.
// Source: .design-sync/previews/Avatar.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Avatar, Typography } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  gap: 16,
  alignItems: "center",
  flexWrap: "wrap",
};

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 6,
  alignItems: "center",
};

export const Sizes = () => (
  <View style={row}>
    <Avatar name="Ada Lovelace" size={28} />
    <Avatar name="Grace Hopper" size={40} />
    <Avatar name="Alan Turing" size={56} />
    <Avatar name="Katherine Johnson" size={72} />
  </View>
);

export const Variants = () => (
  <View style={row}>
    <View style={stack}>
      <Avatar name="Ada Lovelace" size={56} variant="circular" />
      <Typography variant="labelSmall">circular</Typography>
    </View>
    <View style={stack}>
      <Avatar name="Grace Hopper" size={56} variant="rounded" />
      <Typography variant="labelSmall">rounded</Typography>
    </View>
    <View style={stack}>
      <Avatar name="Alan Turing" size={56} variant="square" />
      <Typography variant="labelSmall">square</Typography>
    </View>
  </View>
);

export const Statuses = () => (
  <View style={row}>
    <View style={stack}>
      <Avatar name="Ada Lovelace" size={56} status="online" />
      <Typography variant="labelSmall">online</Typography>
    </View>
    <View style={stack}>
      <Avatar name="Grace Hopper" size={56} status="busy" />
      <Typography variant="labelSmall">busy</Typography>
    </View>
    <View style={stack}>
      <Avatar name="Alan Turing" size={56} status="away" />
      <Typography variant="labelSmall">away</Typography>
    </View>
    <View style={stack}>
      <Avatar name="Katherine Johnson" size={56} status="offline" />
      <Typography variant="labelSmall">offline</Typography>
    </View>
  </View>
);

export const Fallbacks = () => (
  <View style={row}>
    <View style={stack}>
      <Avatar name="Marie Curie" size={56} />
      <Typography variant="labelSmall">initials</Typography>
    </View>
    <View style={stack}>
      <Avatar size={56} />
      <Typography variant="labelSmall">default icon</Typography>
    </View>
    <View style={stack}>
      <Avatar size={56} icon="office-building-outline" variant="rounded" />
      <Typography variant="labelSmall">icon</Typography>
    </View>
    <View style={stack}>
      <Avatar
        name="Design Ops"
        size={56}
        backgroundColor="#00629E"
        textColor="#FFFFFF"
      />
      <Typography variant="labelSmall">custom colors</Typography>
    </View>
  </View>
);

export const TeamRoster = () => (
  <View style={{ flexDirection: "column", gap: 14, width: 300 }}>
    {[
      { name: "Ada Lovelace", role: "Engineering lead", status: "online" },
      { name: "Grace Hopper", role: "Platform architect", status: "busy" },
      { name: "Katherine Johnson", role: "Data science", status: "away" },
    ].map((member) => (
      <View
        key={member.name}
        style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
      >
        <Avatar name={member.name} size={44} status={member.status as any} />
        <View style={{ flexDirection: "column" }}>
          <Typography variant="titleSmall">{member.name}</Typography>
          <Typography variant="bodySmall">{member.role}</Typography>
        </View>
      </View>
    ))}
  </View>
);

export const variants: Variant[] = [
  {
    name: "Sizes",
    title: "Sizes",
    render: Sizes,
  },
  {
    name: "Variants",
    title: "Variants",
    render: Variants,
  },
  {
    name: "Statuses",
    title: "Statuses",
    render: Statuses,
  },
  {
    name: "Fallbacks",
    title: "Fallbacks",
    render: Fallbacks,
  },
  {
    name: "TeamRoster",
    title: "Team roster",
    render: TeamRoster,
  },
];
