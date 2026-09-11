// GENERATED — do not edit.
// Source: .design-sync/previews/Modal.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Modal, Typography, Button, Divider } from "@its/glowup-ui";

// Modal renders through react-native-web's Modal, which is a real portal into
// document.body with a position: fixed scrim — so it fills the capture
// viewport rather than the card. Needs cfg.overrides
// { cardMode: "single", viewport: "560x440" }.
//
// RNW's Modal focus-traps and focuses the first focusable child on open, so
// the sheets show a focus ring on it. That is the product's real open state.
const backdrop: ViewStyle = {
  flexDirection: "column",
  gap: 6,
  width: 460,
};

const lines: ViewStyle = {
  flexDirection: "column",
  gap: 4,
};

export const Dialog = () => (
  <View style={backdrop}>
    <Typography variant="headlineSmall">Component library</Typography>
    <Typography variant="bodyMedium">
      34 components · last synced 4 minutes ago
    </Typography>
    <Modal visible title="Publish 0.1.0" closeText="Close" onClose={() => {}}>
      Publishing makes every component in this library available to the Glowup
      playground and to any workspace that depends on it.
    </Modal>
  </View>
);

export const RichContent = () => (
  <View style={backdrop}>
    <Typography variant="headlineSmall">Team</Typography>
    <Typography variant="bodyMedium">3 members · 2 pending invites</Typography>
    <Modal visible title="Invite your team">
      <View style={lines}>
        <Typography variant="bodyMedium">
          Everyone you invite gets read access to the shared component library.
          You can raise their role later from Settings.
        </Typography>
        <View style={{ height: 12 }} />
        <Typography variant="labelLarge">Invitees</Typography>
        <Typography variant="bodySmall">marta@itsol.it · Viewer</Typography>
        <Typography variant="bodySmall">luca@itsol.it · Viewer</Typography>
        <View style={{ height: 12 }} />
        <Divider contentSpacing={0} />
        <View style={{ height: 12 }} />
        <View style={{ gap: 8, justifyContent: "flex-end" }}>
          <Button mode="text" onPress={() => {}}>
            Not now
          </Button>
          <Button
            mode="filled"
            iconName="account-plus-outline"
            onPress={() => {}}
          >
            Send invites
          </Button>
        </View>
      </View>
    </Modal>
  </View>
);

export const Untitled = () => (
  <View style={backdrop}>
    <Typography variant="headlineSmall">Release notes</Typography>
    <Typography variant="bodyMedium">@its/glowup-ui 0.1.0</Typography>
    <Modal visible closeText="Got it" onClose={() => {}}>
      Dark mode contrast was corrected across every tonal surface.
    </Modal>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Dialog",
    title: "Dialog",
    render: Dialog,
  },
  {
    name: "RichContent",
    title: "Rich content",
    render: RichContent,
  },
  {
    name: "Untitled",
    title: "Untitled",
    render: Untitled,
  },
];
