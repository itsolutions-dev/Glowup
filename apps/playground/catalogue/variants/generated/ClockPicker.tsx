// GENERATED — do not edit.
// Source: .design-sync/previews/ClockPicker.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { ClockPicker, Paper, Typography } from "@its/glowup-ui";

const noop = () => {};

const morning = new Date(2024, 4, 15, 9, 25);
const afternoon = new Date(2024, 4, 15, 16, 40);

const row: ViewStyle = {
  flexDirection: "row",
  gap: 32,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const cell = (caption: string, children: React.ReactNode) => (
  <View style={{ flexDirection: "column", gap: 8 }}>
    <Typography variant="labelMedium">{caption}</Typography>
    <Paper elevation={0} outline style={{ padding: 16 }}>
      {children}
    </Paper>
  </View>
);

/**
 * The 12-hour face carries the AM/PM switch; the 24-hour one drops it and adds
 * an inner ring for 13–00. The locale decides which one appears unless
 * `use24HourClock` forces the 24-hour face.
 */
export const ClockFormats = () => (
  <View style={row}>
    {cell(
      "12-hour (en-US)",
      <ClockPicker locale="en-US" value={morning} onChange={noop} />,
    )}
    {cell(
      "24-hour (forced)",
      <ClockPicker use24HourClock value={afternoon} onChange={noop} />,
    )}
  </View>
);

/**
 * The hour and minute readouts double as the unit selector: the highlighted one
 * is what the dial is editing. Tapping the dial for an hour hands over to the
 * minutes on release.
 */
export const Units = () => (
  <View style={row}>
    {cell(
      "Editing hours",
      <ClockPicker locale="en-US" value={morning} onChange={noop} />,
    )}
    {cell(
      "Keyboard entry",
      <ClockPicker
        locale="en-US"
        inputType="keyboard"
        value={morning}
        onChange={noop}
      />,
    )}
  </View>
);

// `minuteInterval` is the granularity the dial snaps to; unlabelled minutes
// shrink the knob to a dot rather than covering an empty spot on the face.
export const Granularity = () => (
  <View style={row}>
    {cell(
      "Every minute",
      <ClockPicker
        locale="en-US"
        value={new Date(2024, 4, 15, 10, 7)}
        onChange={noop}
      />,
    )}
    {cell(
      "Every 15 minutes",
      <ClockPicker
        locale="en-US"
        minuteInterval={15}
        value={new Date(2024, 4, 15, 10, 30)}
        onChange={noop}
      />,
    )}
  </View>
);

export const variants: Variant[] = [
  {
    name: "ClockFormats",
    title: "Clock formats",
    description:
      "The 12-hour face carries the AM/PM switch; the 24-hour one drops it and adds an inner ring for 13–00. The locale decides which one appears unless `use24HourClock` forces the 24-hour face.",
    render: ClockFormats,
  },
  {
    name: "Units",
    title: "Units",
    description:
      "The hour and minute readouts double as the unit selector: the highlighted one is what the dial is editing. Tapping the dial for an hour hands over to the minutes on release.",
    render: Units,
  },
  {
    name: "Granularity",
    title: "Granularity",
    render: Granularity,
  },
];
