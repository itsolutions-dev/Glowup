import React from "react";
import { ClockPicker, Paper, Typography } from "@its/glowup-ui";

const noop = () => {};

const morning = new Date(2024, 4, 15, 9, 25);
const afternoon = new Date(2024, 4, 15, 16, 40);

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
 * The 12-hour face carries the AM/PM switch; the 24-hour one drops it and adds
 * an inner ring for 13–00. The locale decides which one appears unless
 * `use24HourClock` forces the 24-hour face.
 */
export const ClockFormats = () => (
  <div style={row}>
    {cell(
      "12-hour (en-US)",
      <ClockPicker locale="en-US" value={morning} onChange={noop} />,
    )}
    {cell(
      "24-hour (forced)",
      <ClockPicker use24HourClock value={afternoon} onChange={noop} />,
    )}
  </div>
);

/**
 * The hour and minute readouts double as the unit selector: the highlighted one
 * is what the dial is editing. Tapping the dial for an hour hands over to the
 * minutes on release.
 */
export const Units = () => (
  <div style={row}>
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
  </div>
);

// `minuteInterval` is the granularity the dial snaps to; unlabelled minutes
// shrink the knob to a dot rather than covering an empty spot on the face.
export const Granularity = () => (
  <div style={row}>
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
  </div>
);
