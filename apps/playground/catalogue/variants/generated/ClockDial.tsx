// GENERATED — do not edit.
// Source: .design-sync/previews/ClockDial.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { ClockDial, Paper, Typography } from "@its/glowup-ui";

const noop = () => {};

const row: ViewStyle = {
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
 * `unit` decides which value the face edits: the hand swings to it and the ring
 * relabels. Both `hours` and `minutes` are always passed in — the unit only
 * says which of the two a drag writes to, so the hand can point at 25 minutes
 * while the caller still knows the hour is 9.
 */
export const Units = () => (
  <View style={row}>
    {cell(
      "Editing hours",
      <ClockDial
        unit="hours"
        hours={9}
        minutes={25}
        onChangeHours={noop}
        onChangeMinutes={noop}
      />,
    )}
    {cell(
      "Editing minutes",
      <ClockDial
        unit="minutes"
        hours={9}
        minutes={25}
        onChangeHours={noop}
        onChangeMinutes={noop}
      />,
    )}
  </View>
);

/**
 * The 12-hour face is a single ring of 1–12. `use24HourClock` adds an inner
 * ring for 13–00 and the hand shortens to reach it, which is how the same dial
 * covers a whole day without a second surface. `hours` is always 0–23 whichever
 * face is showing.
 */
export const ClockFormats = () => (
  <View style={row}>
    {cell(
      "12-hour · one ring",
      <ClockDial
        unit="hours"
        hours={9}
        minutes={0}
        onChangeHours={noop}
        onChangeMinutes={noop}
      />,
    )}
    {cell(
      "24-hour · hand on the inner ring",
      <ClockDial
        unit="hours"
        use24HourClock
        hours={16}
        minutes={0}
        onChangeHours={noop}
        onChangeMinutes={noop}
      />,
    )}
  </View>
);

/**
 * The minute face labels only the multiples of five, but every minute in
 * between stays selectable by angle — exactly like a real clock. A hand landing
 * on an unlabelled minute shrinks its knob to a dot instead of covering a bare
 * spot on the face.
 */
export const Granularity = () => (
  <View style={row}>
    {cell(
      "Every minute · knob on :07",
      <ClockDial
        unit="minutes"
        hours={10}
        minutes={7}
        onChangeHours={noop}
        onChangeMinutes={noop}
      />,
    )}
    {cell(
      "Snapped to 15 · knob on :30",
      <ClockDial
        unit="minutes"
        minuteInterval={15}
        hours={10}
        minutes={30}
        onChangeHours={noop}
        onChangeMinutes={noop}
      />,
    )}
  </View>
);

/**
 * `isTimeDisabled` is asked about a candidate, not about the current value:
 * on the hour face it receives the hour being considered with the current
 * minutes, on the minute face the current hour with the candidate minute.
 * Refused values grey out and a drag onto them is ignored.
 */
export const DisabledTimes = () => (
  <View style={row}>
    {cell(
      "Office hours only",
      <ClockDial
        unit="hours"
        use24HourClock
        hours={14}
        minutes={0}
        isTimeDisabled={(hours) => hours < 9 || hours > 17}
        onChangeHours={noop}
        onChangeMinutes={noop}
      />,
    )}
    {cell(
      "Quarter hours only",
      <ClockDial
        unit="minutes"
        hours={14}
        minutes={30}
        isTimeDisabled={(_hours, minutes) => minutes % 15 !== 0}
        onChangeHours={noop}
        onChangeMinutes={noop}
      />,
    )}
  </View>
);

export const variants: Variant[] = [
  {
    name: "Units",
    title: "Units",
    description:
      "`unit` decides which value the face edits: the hand swings to it and the ring relabels. Both `hours` and `minutes` are always passed in — the unit only says which of the two a drag writes to, so the hand can point at 25 minutes while the caller still knows the hour is 9.",
    render: Units,
  },
  {
    name: "ClockFormats",
    title: "Clock formats",
    description:
      "The 12-hour face is a single ring of 1–12. `use24HourClock` adds an inner ring for 13–00 and the hand shortens to reach it, which is how the same dial covers a whole day without a second surface. `hours` is always 0–23 whichever face is showing.",
    render: ClockFormats,
  },
  {
    name: "Granularity",
    title: "Granularity",
    description:
      "The minute face labels only the multiples of five, but every minute in between stays selectable by angle — exactly like a real clock. A hand landing on an unlabelled minute shrinks its knob to a dot instead of covering a bare spot on the face.",
    render: Granularity,
  },
  {
    name: "DisabledTimes",
    title: "Disabled times",
    description:
      "`isTimeDisabled` is asked about a candidate, not about the current value: on the hour face it receives the hour being considered with the current minutes, on the minute face the current hour with the candidate minute. Refused values grey out and a drag onto them is ignored.",
    render: DisabledTimes,
  },
];
