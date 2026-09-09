import React from "react";
import { Avatar, Typography } from "@glowup/ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 16,
  alignItems: "center",
  flexWrap: "wrap",
};

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  alignItems: "center",
};

export const Sizes = () => (
  <div style={row}>
    <Avatar name="Ada Lovelace" size={28} />
    <Avatar name="Grace Hopper" size={40} />
    <Avatar name="Alan Turing" size={56} />
    <Avatar name="Katherine Johnson" size={72} />
  </div>
);

export const Variants = () => (
  <div style={row}>
    <div style={stack}>
      <Avatar name="Ada Lovelace" size={56} variant="circular" />
      <Typography variant="labelSmall">circular</Typography>
    </div>
    <div style={stack}>
      <Avatar name="Grace Hopper" size={56} variant="rounded" />
      <Typography variant="labelSmall">rounded</Typography>
    </div>
    <div style={stack}>
      <Avatar name="Alan Turing" size={56} variant="square" />
      <Typography variant="labelSmall">square</Typography>
    </div>
  </div>
);

export const Statuses = () => (
  <div style={row}>
    <div style={stack}>
      <Avatar name="Ada Lovelace" size={56} status="online" />
      <Typography variant="labelSmall">online</Typography>
    </div>
    <div style={stack}>
      <Avatar name="Grace Hopper" size={56} status="busy" />
      <Typography variant="labelSmall">busy</Typography>
    </div>
    <div style={stack}>
      <Avatar name="Alan Turing" size={56} status="away" />
      <Typography variant="labelSmall">away</Typography>
    </div>
    <div style={stack}>
      <Avatar name="Katherine Johnson" size={56} status="offline" />
      <Typography variant="labelSmall">offline</Typography>
    </div>
  </div>
);

export const Fallbacks = () => (
  <div style={row}>
    <div style={stack}>
      <Avatar name="Marie Curie" size={56} />
      <Typography variant="labelSmall">initials</Typography>
    </div>
    <div style={stack}>
      <Avatar size={56} />
      <Typography variant="labelSmall">default icon</Typography>
    </div>
    <div style={stack}>
      <Avatar size={56} icon="office-building-outline" variant="rounded" />
      <Typography variant="labelSmall">icon</Typography>
    </div>
    <div style={stack}>
      <Avatar
        name="Design Ops"
        size={56}
        backgroundColor="#00629E"
        textColor="#FFFFFF"
      />
      <Typography variant="labelSmall">custom colors</Typography>
    </div>
  </div>
);

export const TeamRoster = () => (
  <div
    style={{ display: "flex", flexDirection: "column", gap: 14, width: 300 }}
  >
    {[
      { name: "Ada Lovelace", role: "Engineering lead", status: "online" },
      { name: "Grace Hopper", role: "Platform architect", status: "busy" },
      { name: "Katherine Johnson", role: "Data science", status: "away" },
    ].map((member) => (
      <div
        key={member.name}
        style={{ display: "flex", gap: 12, alignItems: "center" }}
      >
        <Avatar name={member.name} size={44} status={member.status as any} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="titleSmall">{member.name}</Typography>
          <Typography variant="bodySmall">{member.role}</Typography>
        </div>
      </div>
    ))}
  </div>
);
