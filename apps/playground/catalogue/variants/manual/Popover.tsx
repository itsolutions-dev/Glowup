import { View } from "react-native";
import { Avatar, Button, Divider, Popover, Typography } from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo, useOverlayDemo } from "./shared";

// Hand-written because the authored preview mounts the card already open. Its
// floating layer is a portal whose scrim, transparent here, still swallows
// every click on the page — and the preview's no-op onDismiss never lifts it.
// See `useOverlayDemo`. The anchor is the trigger, as it is in real use.
//
// Without `matchAnchorWidth` the card is 200px wide (Popover seeds its own
// width with a 200 fallback before measuring, so the measurement never grows
// past it) — compose short labels for the default width.

const AccountCard = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Popover
        visible={open}
        onDismiss={hide}
        anchor={
          <Button variant="tonal" iconName="account-outline" onClick={show}>
            Marta Rossi
          </Button>
        }
      >
        <View style={{ flexDirection: "column", padding: 12, gap: 6 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Avatar name="Marta Rossi" size={36} status="online" />
            <View style={{ flexDirection: "column", gap: 2 }}>
              <Typography variant="titleSmall">Marta Rossi</Typography>
              <Typography variant="bodySmall">marta@itsol.it</Typography>
            </View>
          </View>
          <Divider contentSpacing={0} />
          <Button
            variant="text"
            fullWidth
            iconName="cog-outline"
            onClick={hide}
          >
            Settings
          </Button>
          <Button variant="text" fullWidth iconName="logout" onClick={hide}>
            Sign out
          </Button>
        </View>
      </Popover>
    </View>
  );
};

const MatchAnchorWidth = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Popover
        visible={open}
        matchAnchorWidth
        onDismiss={hide}
        anchor={
          <Button
            variant="outlined"
            fullWidth
            iconName="chevron-down"
            iconPosition="end"
            onClick={show}
          >
            Buttons & actions
          </Button>
        }
      >
        <View style={{ flexDirection: "column", padding: 8 }}>
          <Button variant="text" fullWidth onClick={hide}>
            Buttons & actions
          </Button>
          <Button variant="text" fullWidth onClick={hide}>
            Inputs & forms
          </Button>
          <Button variant="text" fullWidth onClick={hide}>
            Feedback & overlays
          </Button>
          <Button variant="text" fullWidth onClick={hide}>
            Navigation
          </Button>
        </View>
      </Popover>
    </View>
  );
};

const HelpBubble = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Popover
        visible={open}
        onDismiss={hide}
        anchor={
          <Button
            variant="outlined"
            iconName="help-circle-outline"
            onClick={show}
          >
            Token sets
          </Button>
        }
      >
        <View style={{ flexDirection: "column", padding: 12, gap: 6 }}>
          <Typography variant="titleSmall">Token sets</Typography>
          <Typography variant="bodySmall">
            Swapping the set restyles every component at once.
          </Typography>
        </View>
      </Popover>
    </View>
  );
};

const AboveAnchor = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Popover
        visible={open}
        onDismiss={hide}
        anchorPosition={{ vertical: "top", horizontal: "center" }}
        anchor={
          <Button
            variant="outlined"
            iconName="lightbulb-outline"
            onClick={show}
          >
            Tip
          </Button>
        }
      >
        <View style={{ flexDirection: "column", padding: 12, gap: 6 }}>
          <Typography variant="titleSmall">Above, centred</Typography>
          <Typography variant="bodySmall">
            anchorPosition puts the card over its anchor; near an edge it flips
            or slides to stay on screen.
          </Typography>
        </View>
      </Popover>
    </View>
  );
};

export const variants: Variant[] = [
  { name: "AccountCard", title: "Account card", render: AccountCard },
  {
    name: "MatchAnchorWidth",
    title: "Match anchor width",
    description: "The card takes the anchor's width instead of its content's.",
    render: MatchAnchorWidth,
  },
  { name: "HelpBubble", title: "Help bubble", render: HelpBubble },
  {
    name: "AboveAnchor",
    title: "Above the anchor",
    description: "anchorPosition: vertical top, horizontal center.",
    render: AboveAnchor,
  },
];
