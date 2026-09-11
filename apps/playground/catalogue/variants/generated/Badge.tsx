// GENERATED — do not edit.
// Source: .design-sync/previews/Badge.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Badge, Avatar, Button, Typography } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  gap: 28,
  alignItems: "center",
  flexWrap: "wrap",
};

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 8,
  alignItems: "center",
};

/** Badge is absolutely positioned — it needs a relatively-positioned anchor. */
const anchor: ViewStyle = {
  position: "relative",
  flexDirection: "row",
};

export const OnIconButtons = () => (
  <View style={row}>
    <View style={stack}>
      <View style={anchor}>
        <Button mode="tonal" iconName="email-outline" onPress={() => {}} />
        <Badge count={3} style={{ top: -2, right: -2 }} />
      </View>
      <Typography variant="labelSmall">Inbox</Typography>
    </View>
    <View style={stack}>
      <View style={anchor}>
        <Button mode="tonal" iconName="bell-outline" onPress={() => {}} />
        <Badge count={12} style={{ top: -2, right: -2 }} />
      </View>
      <Typography variant="labelSmall">Alerts</Typography>
    </View>
    <View style={stack}>
      <View style={anchor}>
        <Button mode="tonal" iconName="cart-outline" onPress={() => {}} />
        <Badge count={128} style={{ top: -2, right: -2 }} />
      </View>
      <Typography variant="labelSmall">Cart</Typography>
    </View>
  </View>
);

export const Sizes = () => (
  <View style={row}>
    <View style={stack}>
      <View style={anchor}>
        <Button mode="outlined" iconName="message-outline" onPress={() => {}} />
        <Badge count={7} size="large" style={{ top: -2, right: -2 }} />
      </View>
      <Typography variant="labelSmall">large (count)</Typography>
    </View>
    <View style={stack}>
      <View style={anchor}>
        <Button mode="outlined" iconName="message-outline" onPress={() => {}} />
        <Badge size="small" style={{ top: 2, right: 2 }} />
      </View>
      <Typography variant="labelSmall">small (dot)</Typography>
    </View>
  </View>
);

export const OverflowAndZero = () => (
  <View style={row}>
    <View style={stack}>
      <View style={anchor}>
        <Avatar name="Ada Lovelace" size={44} variant="rounded" />
        <Badge count={250} max={99} style={{ top: -4, right: -8 }} />
      </View>
      <Typography variant="labelSmall">250, max 99</Typography>
    </View>
    <View style={stack}>
      <View style={anchor}>
        <Avatar name="Grace Hopper" size={44} variant="rounded" />
        <Badge count={9} max={5} style={{ top: -4, right: -8 }} />
      </View>
      <Typography variant="labelSmall">9, max 5</Typography>
    </View>
    <View style={stack}>
      <View style={anchor}>
        <Avatar name="Alan Turing" size={44} variant="rounded" />
        <Badge count={0} showZero style={{ top: -4, right: -8 }} />
      </View>
      <Typography variant="labelSmall">0, showZero</Typography>
    </View>
    <View style={stack}>
      <View style={anchor}>
        <Avatar name="Marie Curie" size={44} variant="rounded" />
        <Badge count={0} style={{ top: -4, right: -8 }} />
      </View>
      <Typography variant="labelSmall">0, hidden</Typography>
    </View>
  </View>
);

export const OnAvatar = () => (
  <View
    style={{ flexDirection: "row", gap: 12, alignItems: "center", width: 300 }}
  >
    <View style={anchor}>
      <Avatar name="Katherine Johnson" size={48} />
      <Badge count={4} style={{ top: 0, right: -4 }} />
    </View>
    <View style={{ flexDirection: "column" }}>
      <Typography variant="titleSmall">Katherine Johnson</Typography>
      <Typography variant="bodySmall">4 unread messages</Typography>
    </View>
  </View>
);

export const variants: Variant[] = [
  {
    name: "OnIconButtons",
    title: "On icon buttons",
    render: OnIconButtons,
  },
  {
    name: "Sizes",
    title: "Sizes",
    render: Sizes,
  },
  {
    name: "OverflowAndZero",
    title: "Overflow and zero",
    render: OverflowAndZero,
  },
  {
    name: "OnAvatar",
    title: "On avatar",
    render: OnAvatar,
  },
];
