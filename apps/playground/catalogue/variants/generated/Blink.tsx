// GENERATED — do not edit.
// Source: .design-sync/previews/Blink.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Blink, Button, StatusBadge, Typography } from "@its/glowup-ui";

const column: ViewStyle = {
  flexDirection: "column",
  gap: 20,
  width: 340,
};

const row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
};

const dot = (color: string): ViewStyle => ({
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: color,
});

/** It fades its children down to `minOpacity` and back, forever: a live indicator or a pending status. */
export const LiveIndicator = () => (
  <View style={column}>
    <Blink>
      <View style={row}>
        <View style={dot("#B00020")} />
        <Typography variant="labelLarge">Recording</Typography>
      </View>
    </Blink>
    <Blink>
      <StatusBadge label="Syncing" type="warning" />
    </Blink>
  </View>
);

/** `interval` is the time of one fade, in ms, 600 by default: 250 is urgent, 1500 calm. */
export const Interval = () => (
  <View style={column}>
    {[250, 600, 1500].map((interval) => (
      <Blink key={interval} interval={interval}>
        <View style={row}>
          <View style={dot("#1B5E20")} />
          <Typography variant="labelLarge">{`${interval} ms`}</Typography>
        </View>
      </Blink>
    ))}
  </View>
);

/** `minOpacity` is the dimmest point, from 0 (it vanishes) to 1 (it does not blink): 0.2 by default. */
export const MinOpacity = () => (
  <View style={column}>
    {[0, 0.2, 0.6].map((minOpacity) => (
      <Blink key={minOpacity} minOpacity={minOpacity}>
        <View style={row}>
          <View style={dot("#6750A4")} />
          <Typography variant="labelLarge">{`minOpacity ${minOpacity}`}</Typography>
        </View>
      </Blink>
    ))}
  </View>
);

/** `active={false}` stops it at full opacity, so the same markup can be a quiet status once the wait is over. */
export const Toggled = () => {
  const [active, setActive] = React.useState(true);
  return (
    <View style={column}>
      <Blink active={active}>
        <View style={row}>
          <View style={dot("#B00020")} />
          <Typography variant="labelLarge">
            {active ? "Waiting for the courier" : "Delivered"}
          </Typography>
        </View>
      </Blink>
      <View>
        <Button variant="tonal" onClick={() => setActive((a) => !a)}>
          {active ? "Stop" : "Start"}
        </Button>
      </View>
    </View>
  );
};

export const variants: Variant[] = [
  {
    name: "LiveIndicator",
    title: "Live indicator",
    description:
      "It fades its children down to `minOpacity` and back, forever: a live indicator or a pending status.",
    render: LiveIndicator,
  },
  {
    name: "Interval",
    title: "Interval",
    description:
      "`interval` is the time of one fade, in ms, 600 by default: 250 is urgent, 1500 calm.",
    render: Interval,
  },
  {
    name: "MinOpacity",
    title: "Min opacity",
    description:
      "`minOpacity` is the dimmest point, from 0 (it vanishes) to 1 (it does not blink): 0.2 by default.",
    render: MinOpacity,
  },
  {
    name: "Toggled",
    title: "Toggled",
    description:
      "`active={false}` stops it at full opacity, so the same markup can be a quiet status once the wait is over.",
    render: Toggled,
  },
];
