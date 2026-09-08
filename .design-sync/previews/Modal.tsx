import React from "react";
import { Modal, Typography, Button, Divider } from "@glowup/ui";

// Modal renders through react-native-web's Modal, which is a real portal into
// document.body with a position: fixed scrim — so it fills the capture
// viewport rather than the card. Needs cfg.overrides
// { cardMode: "single", viewport: "560x440" }.
//
// RNW's Modal focus-traps and focuses the first focusable child on open, so
// the sheets show a focus ring on it. That is the product's real open state.
const backdrop: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  width: 460,
};

const lines: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

export const Dialog = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Component library</Typography>
    <Typography variant="bodyMedium">34 components · last synced 4 minutes ago</Typography>
    <Modal visible title="Publish 0.1.0" closeText="Close" onClose={() => {}}>
      Publishing makes every component in this library available to the
      Glowup playground and to any workspace that depends on it.
    </Modal>
  </div>
);

export const RichContent = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Team</Typography>
    <Typography variant="bodyMedium">3 members · 2 pending invites</Typography>
    <Modal visible title="Invite your team">
      <div style={lines}>
        <Typography variant="bodyMedium">
          Everyone you invite gets read access to the shared component library.
          You can raise their role later from Settings.
        </Typography>
        <div style={{ height: 12 }} />
        <Typography variant="labelLarge">Invitees</Typography>
        <Typography variant="bodySmall">marta@itsol.it · Viewer</Typography>
        <Typography variant="bodySmall">luca@itsol.it · Viewer</Typography>
        <div style={{ height: 12 }} />
        <Divider contentSpacing={0} />
        <div style={{ height: 12 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button mode="text" onPress={() => {}}>
            Not now
          </Button>
          <Button mode="filled" iconName="account-plus-outline" onPress={() => {}}>
            Send invites
          </Button>
        </div>
      </div>
    </Modal>
  </div>
);

export const Untitled = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Release notes</Typography>
    <Typography variant="bodyMedium">@glowup/ui 0.1.0</Typography>
    <Modal visible closeText="Got it" onClose={() => {}}>
      Dark mode contrast was corrected across every tonal surface.
    </Modal>
  </div>
);
