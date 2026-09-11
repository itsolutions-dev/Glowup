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

export const variants: Variant[] = [
  {
    name: "Positions",
    title: "Positions",
    description: "Hover on web, long-press on native. Try each side.",
    render: Positions,
  },
  { name: "OnIconButtons", title: "On icon buttons", render: OnIconButtons },
  { name: "Delays", title: "Delays and disabled", render: Delays },
];
