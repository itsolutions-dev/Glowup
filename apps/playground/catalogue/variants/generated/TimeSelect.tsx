// GENERATED — do not edit.
// Source: .design-sync/previews/TimeSelect.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Paper, TimeSelect, Typography } from "@its/glowup-ui";

const noop = () => {};

// The capture clock is pinned to 2024-05-15, so the columns scroll to the same
// rows on every run.
const midMorning = new Date(2024, 4, 15, 9, 25);
const afternoon = new Date(2024, 4, 15, 14, 30);

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
 * The compact alternative to `ClockPicker`: scrollable columns instead of a
 * dial, for places where 256px of clock face does not fit. The locale decides
 * the format — a 12-hour one grows a third column for the day period, a
 * 24-hour one drops it. `use12Hour` forces either format.
 */
export const ClockFormats = () => (
  <View style={row}>
    {cell(
      "12-hour (en-US) · three columns",
      <TimeSelect locale="en-US" value={midMorning} onChange={noop} />,
    )}
    {cell(
      "24-hour (it-IT) · two columns",
      <TimeSelect locale="it-IT" value={afternoon} onChange={noop} />,
    )}
  </View>
);

/**
 * `minuteInterval` thins out the minute column. The highlighted row snaps to
 * the nearest step, so a value of 14:30 still lights up a row when the column
 * only offers quarters.
 */
export const Granularity = () => (
  <View style={row}>
    {cell(
      "Every minute",
      <TimeSelect locale="it-IT" value={afternoon} onChange={noop} />,
    )}
    {cell(
      "Every 15 minutes",
      <TimeSelect
        locale="it-IT"
        minuteInterval={15}
        value={afternoon}
        onChange={noop}
      />,
    )}
  </View>
);

/**
 * `minimumDate` and `maximumDate` only bite on their own day: a minimum of
 * "today 09:00" greys the earlier rows out today and leaves every hour
 * selectable tomorrow. Both are compared at minute granularity.
 */
export const Clamped = () => (
  <View style={row}>
    {cell(
      "Not before 09:00",
      <TimeSelect
        locale="it-IT"
        value={midMorning}
        minimumDate={new Date(2024, 4, 15, 9, 0)}
        onChange={noop}
      />,
    )}
    {cell(
      "Between 09:00 and 17:30",
      <TimeSelect
        locale="it-IT"
        value={afternoon}
        minimumDate={new Date(2024, 4, 15, 9, 0)}
        maximumDate={new Date(2024, 4, 15, 17, 30)}
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
      "The compact alternative to `ClockPicker`: scrollable columns instead of a dial, for places where 256px of clock face does not fit. The locale decides the format — a 12-hour one grows a third column for the day period, a 24-hour one drops it. `use12Hour` forces either format.",
    render: ClockFormats,
  },
  {
    name: "Granularity",
    title: "Granularity",
    description:
      "`minuteInterval` thins out the minute column. The highlighted row snaps to the nearest step, so a value of 14:30 still lights up a row when the column only offers quarters.",
    render: Granularity,
  },
  {
    name: "Clamped",
    title: "Clamped",
    description:
      '`minimumDate` and `maximumDate` only bite on their own day: a minimum of "today 09:00" greys the earlier rows out today and leaves every hour selectable tomorrow. Both are compared at minute granularity.',
    render: Clamped,
  },
];
