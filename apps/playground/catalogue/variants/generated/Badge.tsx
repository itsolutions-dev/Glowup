// GENERATED — do not edit.
// Source: .design-sync/previews/Badge.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Badge, Avatar, IconButton, Typography } from "@its/glowup-ui";

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

/** `position="top-right"` pins the badge to the anchor's corner, overlapping it slightly. (`IconButton` also has its own `badge` prop.) */
export const OnIconButtons = () => (
  <View style={row}>
    {(
      [
        ["email-outline", "Inbox", 3],
        ["bell-outline", "Alerts", 12],
        ["cart-outline", "Cart", 128],
      ] as const
    ).map(([icon, label, count]) => (
      <View key={label} style={stack}>
        <View style={anchor}>
          <IconButton
            variant="tonal"
            icon={icon}
            accessibilityLabel={label}
            onClick={() => {}}
          />
          <Badge count={count} position="top-right" />
        </View>
        <Typography variant="labelSmall">{label}</Typography>
      </View>
    ))}
  </View>
);

/** `size="large"` carries a count; `size="small"` (or no `count`) is a 6 px dot that only says "something new". */
export const Sizes = () => (
  <View style={row}>
    <View style={stack}>
      <View style={anchor}>
        <IconButton
          variant="outlined"
          icon="message-outline"
          accessibilityLabel="Messages"
          onClick={() => {}}
        />
        <Badge count={7} size="large" position="top-right" />
      </View>
      <Typography variant="labelSmall">large (count)</Typography>
    </View>
    <View style={stack}>
      <View style={anchor}>
        <IconButton
          variant="outlined"
          icon="message-outline"
          accessibilityLabel="Messages"
          onClick={() => {}}
        />
        <Badge size="small" style={{ top: 6, right: 6 }} />
      </View>
      <Typography variant="labelSmall">small (dot)</Typography>
    </View>
  </View>
);

/** `color` takes a colour role; `error` is the default. */
export const Colors = () => (
  <View style={row}>
    {(
      [
        ["error", "bell-outline"],
        ["primary", "email-outline"],
        ["tertiary", "message-outline"],
        ["success", "cloud-check-outline"],
        ["warning", "alert-outline"],
        ["info", "information-outline"],
        ["neutral", "inbox-outline"],
      ] as const
    ).map(([color, icon]) => (
      <View key={color} style={stack}>
        <View style={anchor}>
          <IconButton
            variant="tonal"
            icon={icon}
            accessibilityLabel={color}
            onClick={() => {}}
          />
          <Badge count={4} color={color} position="top-right" />
        </View>
        <Typography variant="labelSmall">{color}</Typography>
      </View>
    ))}
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
    description:
      '`position="top-right"` pins the badge to the anchor\'s corner, overlapping it slightly. (`IconButton` also has its own `badge` prop.)',
    render: OnIconButtons,
  },
  {
    name: "Sizes",
    title: "Sizes",
    description:
      '`size="large"` carries a count; `size="small"` (or no `count`) is a 6 px dot that only says "something new".',
    render: Sizes,
  },
  {
    name: "Colors",
    title: "Colors",
    description: "`color` takes a colour role; `error` is the default.",
    render: Colors,
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
