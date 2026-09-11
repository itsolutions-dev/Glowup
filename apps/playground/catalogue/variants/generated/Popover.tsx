// GENERATED — do not edit.
// Source: .design-sync/previews/Popover.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Popover, Button, Typography, Avatar, Divider } from "@its/glowup-ui";

// Popover's floating card renders through react-native-web's Modal — a real
// portal into document.body, positioned from the anchor's measured window
// coordinates. It fills the capture viewport, not the card, so it needs
// cfg.overrides { cardMode: "single", viewport: "480x420" }.
//
// Without `matchAnchorWidth` the card is 200px wide (Popover seeds its own
// width with a 200 fallback before measuring, so the measurement never grows
// past it) — compose short labels for the default width.
const host: ViewStyle = {
  flexDirection: "column",
  width: 320,
};

const pad: ViewStyle = {
  flexDirection: "column",
  padding: 12,
  gap: 6,
};

export const AccountCard = () => (
  <View style={host}>
    <Popover
      visible
      onDismiss={() => {}}
      anchor={
        <Button mode="tonal" iconName="account-outline" onPress={() => {}}>
          Marta Rossi
        </Button>
      }
    >
      <View style={pad}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Avatar name="Marta Rossi" size={36} status="online" />
          <View style={{ flexDirection: "column", gap: 2 }}>
            <Typography variant="titleSmall">Marta Rossi</Typography>
            <Typography variant="bodySmall">marta@itsol.it</Typography>
          </View>
        </View>
        <Divider contentSpacing={0} />
        <Button mode="text" fullWidth iconName="cog-outline" onPress={() => {}}>
          Settings
        </Button>
        <Button mode="text" fullWidth iconName="logout" onPress={() => {}}>
          Sign out
        </Button>
      </View>
    </Popover>
  </View>
);

export const MatchAnchorWidth = () => (
  <View style={host}>
    <Popover
      visible
      matchAnchorWidth
      onDismiss={() => {}}
      anchor={
        <Button
          mode="outlined"
          fullWidth
          iconName="chevron-down"
          iconPosition="right"
          onPress={() => {}}
        >
          Buttons &amp; actions
        </Button>
      }
    >
      <View style={{ flexDirection: "column", padding: 8 }}>
        <Button mode="text" fullWidth onPress={() => {}}>
          Buttons &amp; actions
        </Button>
        <Button mode="text" fullWidth onPress={() => {}}>
          Inputs &amp; forms
        </Button>
        <Button mode="text" fullWidth onPress={() => {}}>
          Feedback &amp; overlays
        </Button>
        <Button mode="text" fullWidth onPress={() => {}}>
          Navigation
        </Button>
      </View>
    </Popover>
  </View>
);

export const HelpBubble = () => (
  <View style={host}>
    <Popover
      visible
      onDismiss={() => {}}
      anchor={
        <Button
          mode="outlined"
          iconName="help-circle-outline"
          onPress={() => {}}
        >
          Token sets
        </Button>
      }
    >
      <View style={pad}>
        <Typography variant="titleSmall">Token sets</Typography>
        <Typography variant="bodySmall">
          Swapping the set restyles every component at once.
        </Typography>
      </View>
    </Popover>
  </View>
);

export const variants: Variant[] = [
  {
    name: "AccountCard",
    title: "Account card",
    render: AccountCard,
  },
  {
    name: "MatchAnchorWidth",
    title: "Match anchor width",
    render: MatchAnchorWidth,
  },
  {
    name: "HelpBubble",
    title: "Help bubble",
    render: HelpBubble,
  },
];
