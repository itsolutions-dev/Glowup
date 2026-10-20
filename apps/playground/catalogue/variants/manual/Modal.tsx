import { View } from "react-native";
import {
  Button,
  Divider,
  Dialog as GlowupDialog,
  Typography,
} from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo, useOverlayDemo } from "./shared";

// Hand-written because the authored preview mounts the dialog already open: the
// right shape for a screenshot, the wrong one for a page. See `useOverlayDemo`.
// Same demos, opened from a trigger and closed by their own buttons.

const Dialog = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Typography variant="headlineSmall">Component library</Typography>
      <Typography variant="bodyMedium">
        34 components · last synced 4 minutes ago
      </Typography>
      <Button variant="filled" iconName="publish" onClick={show}>
        Publish 0.1.0
      </Button>
      <GlowupDialog
        visible={open}
        title="Publish 0.1.0"
        closeText="Close"
        onClose={hide}
      >
        Publishing makes every component in this library available to the Glowup
        playground and to any workspace that depends on it.
      </GlowupDialog>
    </View>
  );
};

const RichContent = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Typography variant="headlineSmall">Team</Typography>
      <Typography variant="bodyMedium">
        3 members · 2 pending invites
      </Typography>
      <Button variant="tonal" iconName="account-plus-outline" onClick={show}>
        Invite your team
      </Button>
      <GlowupDialog visible={open} title="Invite your team" onClose={hide}>
        <View style={demo.stack}>
          <Typography variant="bodyMedium">
            Everyone you invite gets read access to the shared component
            library. You can raise their role later from Settings.
          </Typography>
          <Typography variant="labelLarge">Invitees</Typography>
          <Typography variant="bodySmall">marta@itsol.it · Viewer</Typography>
          <Typography variant="bodySmall">luca@itsol.it · Viewer</Typography>
          <Divider contentSpacing={0} />
          <View
            style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}
          >
            <Button variant="text" onClick={hide}>
              Not now
            </Button>
            <Button
              variant="filled"
              iconName="account-plus-outline"
              onClick={hide}
            >
              Send invites
            </Button>
          </View>
        </View>
      </GlowupDialog>
    </View>
  );
};

const Untitled = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Typography variant="headlineSmall">Release notes</Typography>
      <Typography variant="bodyMedium">@its/glowup-ui 0.1.0</Typography>
      <Button variant="outlined" iconName="text-box-outline" onClick={show}>
        What changed
      </Button>
      <GlowupDialog visible={open} closeText="Got it" onClose={hide}>
        Dark mode contrast was corrected across every tonal surface.
      </GlowupDialog>
    </View>
  );
};

export const variants: Variant[] = [
  {
    name: "Dialog",
    title: "Dialog",
    description: "A title, a body and a single close action.",
    render: Dialog,
  },
  {
    name: "RichContent",
    title: "Rich content",
    description:
      "Children instead of a string, with the dialog's own action row.",
    render: RichContent,
  },
  { name: "Untitled", title: "Untitled", render: Untitled },
];
