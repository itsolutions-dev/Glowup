import React from "react";
import { Paper, TimeSelect, Typography } from "@glowup/ui";

const noop = () => {};

// The capture clock is pinned to 2024-05-15, so the columns scroll to the same
// rows on every run.
const midMorning = new Date(2024, 4, 15, 9, 25);
const afternoon = new Date(2024, 4, 15, 14, 30);

const row: React.CSSProperties = {
  display: "flex",
  gap: 32,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const cell = (caption: string, children: React.ReactNode) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <Typography variant="labelMedium">{caption}</Typography>
    <Paper elevation={0} outline style={{ padding: 16 }}>
      {children}
    </Paper>
  </div>
);

/**
 * The compact alternative to `ClockPicker`: scrollable columns instead of a
 * dial, for places where 256px of clock face does not fit. The locale decides
 * the format — a 12-hour one grows a third column for the day period, a
 * 24-hour one drops it. `use12Hour` forces either format.
 */
export const ClockFormats = () => (
  <div style={row}>
    {cell(
      "12-hour (en-US) · three columns",
      <TimeSelect locale="en-US" value={midMorning} onChange={noop} />,
    )}
    {cell(
      "24-hour (it-IT) · two columns",
      <TimeSelect locale="it-IT" value={afternoon} onChange={noop} />,
    )}
  </div>
);

/**
 * `minuteInterval` thins out the minute column. The highlighted row snaps to
 * the nearest step, so a value of 14:30 still lights up a row when the column
 * only offers quarters.
 */
export const Granularity = () => (
  <div style={row}>
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
  </div>
);

/**
 * `minimumDate` and `maximumDate` only bite on their own day: a minimum of
 * "today 09:00" greys the earlier rows out today and leaves every hour
 * selectable tomorrow. Both are compared at minute granularity.
 */
export const Clamped = () => (
  <div style={row}>
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
  </div>
);
