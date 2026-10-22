import React from "react";
import { Popover, Button, Typography, Avatar, Divider } from "@its/glowup-ui";

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
        <Button variant="tonal" iconName="account-outline" onClick={() => {}}>
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
        <Button
          variant="text"
          fullWidth
          iconName="cog-outline"
          onClick={() => {}}
        >
          Settings
        </Button>
        <Button variant="text" fullWidth iconName="logout" onClick={() => {}}>
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
          variant="outlined"
          fullWidth
          iconName="chevron-down"
          iconPosition="end"
          onClick={() => {}}
        >
          Buttons &amp; actions
        </Button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", padding: 8 }}>
        <Button variant="text" fullWidth onClick={() => {}}>
          Buttons &amp; actions
        </Button>
        <Button variant="text" fullWidth onClick={() => {}}>
          Inputs &amp; forms
        </Button>
        <Button variant="text" fullWidth onClick={() => {}}>
          Feedback &amp; overlays
        </Button>
        <Button variant="text" fullWidth onClick={() => {}}>
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
          variant="outlined"
          iconName="help-circle-outline"
          onClick={() => {}}
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

// The anchor sits low in the card so the popover has room above it.
export const AboveAnchor = () => (
  <div style={{ ...host, justifyContent: "flex-end", height: 320 }}>
    <Popover
      visible
      onDismiss={() => {}}
      anchorPosition={{ vertical: "top", horizontal: "center" }}
      anchor={
        <Button
          variant="outlined"
          iconName="lightbulb-outline"
          onClick={() => {}}
        >
          Tip
        </Button>
      }
    >
      <div style={pad}>
        <Typography variant="titleSmall">Above, centred</Typography>
        <Typography variant="bodySmall">
          anchorPosition puts the card over its anchor; near an edge it flips or
          slides to stay on screen.
        </Typography>
      </div>
    </Popover>
  </div>
);
