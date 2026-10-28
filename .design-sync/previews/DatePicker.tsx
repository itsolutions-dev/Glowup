import React from "react";
import { DatePicker } from "@its/glowup-ui";

// `DateTimePicker` carries its own marginBottom, so the column takes no gap.
const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 340,
};

const noop = () => {};

// The capture clock is pinned to 2024-05-15.
const today = new Date(2024, 4, 15);
const later = new Date(2024, 5, 3);
const nextWeek = new Date(2024, 4, 22);

/**
 * `DateTimePicker` with `mode` locked to `date`: the dialog opens straight on
 * the calendar and neither the field nor the surface ever offers a time. Use it
 * wherever a time-of-day would be meaningless — it is the same component, so
 * every other prop behaves identically.
 */
export const Basic = () => (
  <div style={stack}>
    <DatePicker label="Invoice date" value={later} onChange={noop} />
    {/* Empty, the typed-entry field shows the locale's date mask. */}
    <DatePicker label="Invoice date" value={null} onChange={noop} />
  </div>
);

/**
 * Only `mode` is locked, so `selectionMode` still switches the shape of the
 * value: one `Date`, a `{ startDate, endDate }` pair, or an array of days.
 */
export const SelectionModes = () => (
  <div style={stack}>
    <DatePicker label="Invoice date" value={later} onChange={noop} />
    <DatePicker
      label="Reporting period"
      selectionMode="range"
      value={{ startDate: today, endDate: later }}
      onChange={noop}
    />
    <DatePicker
      label="Shift days"
      selectionMode="multiple"
      value={[today, nextWeek, later]}
      onChange={noop}
    />
  </div>
);

export const States = () => (
  <div style={stack}>
    <DatePicker
      label="Booking date"
      value={later}
      validRange={{ startDate: today, endDate: new Date(2024, 5, 30) }}
      helperText="Today to the end of June"
      onChange={noop}
    />
    <DatePicker
      label="Booking date"
      value={new Date(2024, 6, 12)}
      error="Outside the booking window"
      onChange={noop}
    />
    <DatePicker
      label="Contract start"
      value={new Date(2024, 0, 8)}
      disabled
      onChange={noop}
    />
  </div>
);

/**
 * `variant="static"` draws the calendar inline, in the page: no field, no
 * dialog, no OK. Every tap reports through `onChange` at once, so it is the
 * calendar to put beside a list rather than behind a field.
 */
export const Static = () => (
  <div style={stack}>
    <DatePicker variant="static" value={later} onChange={noop} />
  </div>
);

export const StaticRange = () => (
  <div style={stack}>
    <DatePicker
      variant="static"
      selectionMode="range"
      value={{ startDate: today, endDate: later }}
      onChange={noop}
    />
  </div>
);
