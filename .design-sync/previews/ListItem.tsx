import React from "react";
import {
  Avatar,
  Icon,
  ListItem,
  StatusBadge,
  Switch,
  Typography,
} from "@its/glowup-ui";

const list: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 340,
};

const chevron = <Icon source="chevron-right" size={20} color="#79747E" />;

export const SettingsList = () => (
  <div style={list}>
    <ListItem
      onClick={() => {}}
      icon={<Icon source="account-multiple-outline" size={24} />}
      secondaryText="3 members, 1 pending invite"
      action={chevron}
      primaryText="Workspace members"
    />
    <ListItem
      onClick={() => {}}
      icon={<Icon source="lock-outline" size={24} />}
      secondaryText="Passkeys and two-factor"
      action={chevron}
      primaryText="Privacy and security"
    />
    <ListItem
      icon={<Icon source="email-outline" size={24} />}
      secondaryText="Weekly digest"
      action={<Switch value onChange={() => {}} />}
      primaryText="Email notifications"
    />
  </div>
);

export const Slots = () => (
  <div style={list}>
    <ListItem
      icon={<Icon source="folder-multiple-outline" size={24} />}
      primaryText="leading only"
    />
    <ListItem action={chevron} primaryText="trailing only" />
    <ListItem
      secondaryText="the second line sits under the primary one"
      primaryText="secondary only"
    />
    <ListItem
      icon={<Icon source="chart-box" size={24} />}
      secondaryText="all three slots filled"
      action={chevron}
      primaryText="leading + secondary + trailing"
    />
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
        onClick={() => {}}
        icon={<Avatar name={m.name} size={40} />}
        secondaryText={m.role}
        action={<Typography variant="labelLarge">Owner</Typography>}
        primaryText={m.name}
      />
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
        onClick={() => {}}
        icon={<Icon source="domain" size={24} color="#1D1B20" />}
        secondaryText={hub.parcels}
        itemContainerStyle={{ backgroundColor: hub.tint }}
        itemTextStyle={{ color: "#1D1B20" }}
        primaryText={hub.label}
      />
    ))}
  </div>
);

/** No slots at all: the original single-line centred tile is still what you get. */
export const TextOnly = () => (
  <div style={list}>
    <ListItem onClick={() => {}} primaryText="Q1 revenue report" />
    <ListItem onClick={() => {}} primaryText="Warehouse capacity plan" />
    <ListItem onClick={() => {}} primaryText="Supplier contract renewal" />
  </div>
);

export const StatusRows = () => (
  <div style={list}>
    <ListItem
      indicatorColor="#B00020"
      secondaryText="Call back before Friday"
      action={<StatusBadge label="Urgent" type="error" />}
      trailingWidth={112}
      primaryText={
        <>
          <Typography variant="titleMedium">Marta Bianchi</Typography>
        </>
      }
    />
    <ListItem
      indicatorColor="#61B340"
      secondaryText="Quote accepted"
      action={<StatusBadge label="Won" />}
      trailingWidth={112}
      primaryText={
        <>
          <Typography variant="titleMedium">Luca Verdi</Typography>
        </>
      }
    />
    <ListItem
      dimmed
      secondaryText="Removed on 12 Oct"
      action={<StatusBadge label="Removed" type="warning" />}
      trailingWidth={112}
      primaryText={
        <>
          <Typography variant="titleMedium">Anna Neri</Typography>
        </>
      }
    />
  </div>
);
