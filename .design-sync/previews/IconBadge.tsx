import React from "react";
import { IconBadge, Typography } from "@glowup/ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 28,
  alignItems: "center",
  flexWrap: "wrap",
};

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  alignItems: "center",
};

export const NotificationCounts = () => (
  <div style={row}>
    <div style={stack}>
      <IconBadge iconName="bell-outline" badgeCount={3} onPress={() => {}} />
      <Typography variant="labelSmall">Alerts</Typography>
    </div>
    <div style={stack}>
      <IconBadge iconName="email-outline" badgeCount={12} onPress={() => {}} />
      <Typography variant="labelSmall">Inbox</Typography>
    </div>
    <div style={stack}>
      <IconBadge iconName="cart-outline" badgeCount={128} onPress={() => {}} />
      <Typography variant="labelSmall">Cart</Typography>
    </div>
    <div style={stack}>
      <IconBadge iconName="calendar-outline" badgeCount={0} onPress={() => {}} />
      <Typography variant="labelSmall">Nothing due</Typography>
    </div>
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <IconBadge iconName="bell-outline" badgeCount={5} size={32} onPress={() => {}} />
    <IconBadge iconName="bell-outline" badgeCount={5} size={40} onPress={() => {}} />
    <IconBadge iconName="bell-outline" badgeCount={5} size={56} onPress={() => {}} />
    <IconBadge iconName="bell-outline" badgeCount={5} size={72} onPress={() => {}} />
  </div>
);

export const Colors = () => (
  <div style={row}>
    <div style={stack}>
      <IconBadge
        iconName="message-alert-outline"
        badgeCount={2}
        size={40}
        onPress={() => {}}
      />
      <Typography variant="labelSmall">default</Typography>
    </div>
    <div style={stack}>
      <IconBadge
        iconName="cloud-upload-outline"
        badgeCount={6}
        size={40}
        badgeColor="#1B873B"
        onPress={() => {}}
      />
      <Typography variant="labelSmall">success</Typography>
    </div>
    <div style={stack}>
      <IconBadge
        iconName="download-outline"
        badgeCount={9}
        size={40}
        color="#00629E"
        badgeColor="#B26A00"
        onPress={() => {}}
      />
      <Typography variant="labelSmall">custom pair</Typography>
    </div>
  </div>
);

export const AppBarActions = () => (
  <div
    style={{
      display: "flex",
      gap: 24,
      alignItems: "center",
      justifyContent: "flex-end",
      width: 320,
      padding: "12px 20px",
    }}
  >
    <IconBadge iconName="magnify" badgeCount={0} size={36} onPress={() => {}} />
    <IconBadge iconName="bell-outline" badgeCount={4} size={36} onPress={() => {}} />
    <IconBadge iconName="email-outline" badgeCount={112} size={36} onPress={() => {}} />
  </div>
);
