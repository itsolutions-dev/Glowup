import { useState } from "react";
import { View } from "react-native";
import {
  Avatar,
  Button,
  HoverCard,
  Typography,
  type HoverCardProps,
} from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo } from "./shared";

// Every card starts closed: it opens on hover or focus (web) or a long press
// (native), or from the `open` prop. The triggers are plain text, which is not
// pressable, so a long press on touch reaches the card's own handler.

const Trigger = ({ children }: { children: string }) => (
  <Typography variant="labelLarge" color="primary">
    {children}
  </Typography>
);

const Note = ({ children }: { children: string }) => (
  <Typography variant="bodySmall">{children}</Typography>
);

const ProfileCard = () => (
  <View style={demo.panel}>
    <Typography variant="bodyMedium">Hover the name.</Typography>
    <HoverCard
      content={
        <View style={demo.stack}>
          <View style={demo.row}>
            <Avatar name="Marta Rossi" status="online" />
            <View>
              <Typography variant="titleSmall">Marta Rossi</Typography>
              <Typography variant="bodySmall">Design lead</Typography>
            </View>
          </View>
          <Note>Owns the token set. 34 components reviewed this year.</Note>
        </View>
      }
    >
      <Trigger>Marta Rossi</Trigger>
    </HoverCard>
  </View>
);

const SIDES: NonNullable<HoverCardProps["placement"]>[] = [
  "top",
  "bottom",
  "left",
  "right",
];

const Placements = () => (
  <View style={[demo.row, { gap: 32, paddingVertical: 24 }]}>
    {SIDES.map((side) => (
      <HoverCard
        key={side}
        placement={side}
        width={200}
        content={<Note>{`This card sits on the ${side}.`}</Note>}
      >
        <Trigger>{side}</Trigger>
      </HoverCard>
    ))}
  </View>
);

const Delays = () => (
  <View style={[demo.row, { gap: 32 }]}>
    <HoverCard
      openDelay={0}
      closeDelay={0}
      width={200}
      content={<Note>Opens at once and closes at once.</Note>}
    >
      <Trigger>Instant</Trigger>
    </HoverCard>
    <HoverCard
      openDelay={800}
      closeDelay={600}
      width={200}
      content={<Note>Waits 0.8 s to open and 0.6 s to close.</Note>}
    >
      <Trigger>Slow</Trigger>
    </HoverCard>
  </View>
);

const AnchorPosition = () => (
  <View style={[demo.row, { paddingVertical: 24 }]}>
    <HoverCard
      anchorPosition={{ vertical: "top", horizontal: "right" }}
      width={220}
      content={<Note>Above the trigger, right edges aligned.</Note>}
    >
      <Trigger>Above, right</Trigger>
    </HoverCard>
  </View>
);

const Controlled = () => {
  const [open, setOpen] = useState(false);

  return (
    <View style={demo.panel}>
      <View style={demo.row}>
        <HoverCard
          open={open}
          onOpenChange={setOpen}
          width={220}
          content={<Note>Open from the button, or by hovering.</Note>}
        >
          <Trigger>Details</Trigger>
        </HoverCard>
        <Button variant="outlined" onClick={() => setOpen(!open)}>
          {open ? "Close the card" : "Open the card"}
        </Button>
      </View>
    </View>
  );
};

export const variants: Variant[] = [
  {
    name: "ProfileCard",
    title: "Profile card",
    description: "Any content: an avatar, a name and a line about the person.",
    render: ProfileCard,
  },
  {
    name: "Placements",
    title: "Placements",
    description:
      "placement puts the card on a side of the trigger; it flips when there is no room.",
    render: Placements,
  },
  {
    name: "Delays",
    title: "Delays",
    description: "openDelay and closeDelay, in milliseconds.",
    render: Delays,
  },
  {
    name: "AnchorPosition",
    title: "Anchor position",
    description: "anchorPosition places the card as a Popover is placed.",
    render: AnchorPosition,
  },
  {
    name: "Controlled",
    title: "Controlled",
    description:
      "open and onOpenChange: the card follows the state, from the pointer or from a button.",
    render: Controlled,
  },
];
