// GENERATED — do not edit.
// Source: .design-sync/previews/IconBadge.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { IconBadge, Typography } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  gap: 28,
  alignItems: "center",
  flexWrap: "wrap",
};

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 10,
  alignItems: "center",
};

export const NotificationCounts = () => (
  <View style={row}>
    <View style={stack}>
      <IconBadge iconName="bell-outline" badgeCount={3} onPress={() => {}} />
      <Typography variant="labelSmall">Alerts</Typography>
    </View>
    <View style={stack}>
      <IconBadge iconName="email-outline" badgeCount={12} onPress={() => {}} />
      <Typography variant="labelSmall">Inbox</Typography>
    </View>
    <View style={stack}>
      <IconBadge iconName="cart-outline" badgeCount={128} onPress={() => {}} />
      <Typography variant="labelSmall">Cart</Typography>
    </View>
    <View style={stack}>
      <IconBadge
        iconName="calendar-outline"
        badgeCount={0}
        onPress={() => {}}
      />
      <Typography variant="labelSmall">Nothing due</Typography>
    </View>
  </View>
);

export const Sizes = () => (
  <View style={row}>
    <IconBadge
      iconName="bell-outline"
      badgeCount={5}
      size={32}
      onPress={() => {}}
    />
    <IconBadge
      iconName="bell-outline"
      badgeCount={5}
      size={40}
      onPress={() => {}}
    />
    <IconBadge
      iconName="bell-outline"
      badgeCount={5}
      size={56}
      onPress={() => {}}
    />
    <IconBadge
      iconName="bell-outline"
      badgeCount={5}
      size={72}
      onPress={() => {}}
    />
  </View>
);

export const Colors = () => (
  <View style={row}>
    <View style={stack}>
      <IconBadge
        iconName="message-alert-outline"
        badgeCount={2}
        size={40}
        onPress={() => {}}
      />
      <Typography variant="labelSmall">default</Typography>
    </View>
    <View style={stack}>
      <IconBadge
        iconName="cloud-upload-outline"
        badgeCount={6}
        size={40}
        badgeColor="#1B873B"
        onPress={() => {}}
      />
      <Typography variant="labelSmall">success</Typography>
    </View>
    <View style={stack}>
      <IconBadge
        iconName="download-outline"
        badgeCount={9}
        size={40}
        color="#00629E"
        badgeColor="#B26A00"
        onPress={() => {}}
      />
      <Typography variant="labelSmall">custom pair</Typography>
    </View>
  </View>
);

export const AppBarActions = () => (
  <View
    style={{
      flexDirection: "row",
      gap: 24,
      alignItems: "center",
      justifyContent: "flex-end",
      width: 320,
      paddingVertical: 12,
      paddingHorizontal: 20,
    }}
  >
    <IconBadge iconName="magnify" badgeCount={0} size={36} onPress={() => {}} />
    <IconBadge
      iconName="bell-outline"
      badgeCount={4}
      size={36}
      onPress={() => {}}
    />
    <IconBadge
      iconName="email-outline"
      badgeCount={112}
      size={36}
      onPress={() => {}}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "NotificationCounts",
    title: "Notification counts",
    render: NotificationCounts,
  },
  {
    name: "Sizes",
    title: "Sizes",
    render: Sizes,
  },
  {
    name: "Colors",
    title: "Colors",
    render: Colors,
  },
  {
    name: "AppBarActions",
    title: "App bar actions",
    render: AppBarActions,
  },
];
