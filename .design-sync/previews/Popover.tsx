import React from "react";
import { Popover, Button, Typography, Avatar, Divider } from "@glowup/ui";

// Popover's floating card renders through react-native-web's Modal — a real
// portal into document.body, positioned from the anchor's measured window
// coordinates. It fills the capture viewport, not the card, so it needs
// cfg.overrides { cardMode: "single", viewport: "480x420" }.
//
// Without `matchAnchorWidth` the card is 200px wide (Popover seeds its own
// width with a 200 fallback before measuring, so the measurement never grows
// past it) — compose short labels for the default width.
const host: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 320,
};

const pad: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 12,
  gap: 6,
};

export const AccountCard = () => (
  <div style={host}>
    <Popover
      visible
      onDismiss={() => {}}
      anchor={
        <Button mode="tonal" iconName="account-outline" onPress={() => {}}>
          Marta Rossi
        </Button>
      }
    >
      <div style={pad}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Avatar name="Marta Rossi" size={36} status="online" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="titleSmall">Marta Rossi</Typography>
            <Typography variant="bodySmall">marta@itsol.it</Typography>
          </div>
        </div>
        <Divider contentSpacing={0} />
        <Button mode="text" fullWidth iconName="cog-outline" onPress={() => {}}>
          Settings
        </Button>
        <Button mode="text" fullWidth iconName="logout" onPress={() => {}}>
          Sign out
        </Button>
      </div>
    </Popover>
  </div>
);

export const MatchAnchorWidth = () => (
  <div style={host}>
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
      <div style={{ display: "flex", flexDirection: "column", padding: 8 }}>
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
      </div>
    </Popover>
  </div>
);

export const HelpBubble = () => (
  <div style={host}>
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
      <div style={pad}>
        <Typography variant="titleSmall">Token sets</Typography>
        <Typography variant="bodySmall">
          Swapping the set restyles every component at once.
        </Typography>
      </div>
    </Popover>
  </div>
);
