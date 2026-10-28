import React from "react";
import { Popover, Button, Typography, Avatar, Divider } from "@its/glowup-ui";

// Popover's floating card renders through react-native-web's Modal — a real
// portal into document.body, positioned from the anchor's measured window
// coordinates. It fills the capture viewport, not the card, so it needs
// cfg.overrides { cardMode: "single", viewport: "480x420" }.
//
// Without `matchAnchorWidth` the card sizes to its content (capped by the
// window minus a 16px margin). Anchors keep their intrinsic width.
const host: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
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
          density="dense"
          fullWidth
          iconName="cog-outline"
          onClick={() => {}}
        >
          Settings
        </Button>
        <Button
          variant="text"
          density="dense"
          fullWidth
          iconName="logout"
          onClick={() => {}}
        >
          Sign out
        </Button>
      </div>
    </Popover>
  </div>
);

// A full-width select-style trigger; the card takes exactly its width.
export const MatchAnchorWidth = () => (
  <div style={{ ...host, alignItems: "stretch" }}>
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
        {[
          "Buttons & actions",
          "Inputs & forms",
          "Feedback & overlays",
          "Navigation",
        ].map((group) => (
          <Button
            key={group}
            variant="text"
            density="dense"
            fullWidth
            onClick={() => {}}
          >
            {group}
          </Button>
        ))}
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

// The anchor sits low and centred in the card so the popover has room above
// it. anchorPosition puts the card over its anchor; near an edge it flips or
// slides to stay on screen.
export const AboveAnchor = () => (
  <div
    style={{
      ...host,
      alignItems: "center",
      justifyContent: "flex-end",
      height: 320,
    }}
  >
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
        <Typography variant="titleSmall">Keyboard shortcut</Typography>
        <Typography variant="bodySmall">
          Press / anywhere to jump straight to search.
        </Typography>
      </div>
    </Popover>
  </div>
);
