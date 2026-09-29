import { View } from "react-native";
import { Button, IconButton, Tooltip, Typography } from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo } from "./shared";

// Hand-written rather than generated: the authored preview dispatches a
// synthetic pointerenter to force the tooltip open for a screenshot. On a live
// page the real interaction is the demo — hover on web, long-press on native.

const Positions = () => (
  <View style={demo.row}>
    {(["top", "bottom", "left", "right"] as const).map((position) => (
      <Tooltip
        key={position}
        content={`Opens on the ${position}`}
        position={position}
      >
        <Button mode="tonal" onPress={() => {}}>
          {position}
        </Button>
      </Tooltip>
    ))}
  </View>
);

const OnIconButtons = () => (
  <View style={demo.row}>
    <Tooltip content="Duplicate">
      <IconButton
        icon="content-copy"
        accessibilityLabel="Duplicate"
        onPress={() => {}}
      />
    </Tooltip>
    <Tooltip content="Archive">
      <IconButton
        icon="archive-outline"
        accessibilityLabel="Archive"
        onPress={() => {}}
      />
    </Tooltip>
    <Tooltip content="Delete — this cannot be undone" position="bottom">
      <IconButton
        icon="delete-outline"
        accessibilityLabel="Delete"
        onPress={() => {}}
      />
    </Tooltip>
    <Typography variant="bodySmall">
      The label an icon-only control cannot show on its own.
    </Typography>
  </View>
);

const Delays = () => (
  <View style={demo.row}>
    <Tooltip content="Opens at once" enterDelay={0}>
      <Button mode="outlined" onPress={() => {}}>
        No delay
      </Button>
    </Tooltip>
    <Tooltip content="Waits a second first" enterDelay={1000}>
      <Button mode="outlined" onPress={() => {}}>
        Slow
      </Button>
    </Tooltip>
    <Tooltip content="Never shown" disabled>
      <Button mode="outlined" onPress={() => {}}>
        Disabled
      </Button>
    </Tooltip>
  </View>
);

const Rich = () => (
  <View style={demo.row}>
    <Tooltip
      variant="rich"
      title="Offline sync"
      content="Changes are kept on this device and uploaded when the connection returns."
    >
      <IconButton
        icon="cloud-sync-outline"
        accessibilityLabel="Offline sync"
        onPress={() => {}}
      />
    </Tooltip>
    <Tooltip
      variant="rich"
      title="Two-step verification"
      content="Adds a code from your phone to every sign-in."
      action={{ label: "Learn more", onPress: () => {} }}
    >
      <Button mode="outlined" onPress={() => {}}>
        Security
      </Button>
    </Tooltip>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Positions",
    title: "Positions",
    description: "Hover on web, long-press on native. Try each side.",
    render: Positions,
  },
  { name: "OnIconButtons", title: "On icon buttons", render: OnIconButtons },
  { name: "Delays", title: "Delays and disabled", render: Delays },
  {
    name: "Rich",
    title: "Rich",
    description:
      "A title, a body and an optional action. With an action it stays open while you move into it — Tab reaches it from the anchor, Escape closes it.",
    render: Rich,
  },
];
