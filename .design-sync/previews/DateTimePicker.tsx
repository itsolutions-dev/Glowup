import React from "react";
import { DateTimePicker } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 340,
};

const noop = () => {};

// The capture clock is pinned to 2024-05-15, so these read deterministically.
const today = new Date(2024, 4, 15, 14, 30);
const yesterday = new Date(2024, 4, 14, 9, 0);
const tomorrow = new Date(2024, 4, 16, 8, 15);
const later = new Date(2024, 5, 3, 17, 45);

export const Modes = () => (
  <div style={stack}>
    <DateTimePicker
      label="Delivery date"
      mode="date"
      value={later}
      onChange={noop}
    />
    <DateTimePicker
      label="Pickup window"
      mode="time"
      value={today}
      onChange={noop}
    />
    <DateTimePicker
      label="Appointment"
      mode="datetime"
      value={later}
      onChange={noop}
    />
  </div>
);

// `selectionMode` changes the shape of `value` and `onChange` with it: one
// Date, a { startDate, endDate } pair, or an array.
export const SelectionModes = () => (
  <div style={stack}>
    <DateTimePicker
      label="Invoice date"
      selectionMode="single"
      value={later}
      onChange={noop}
    />
    <DateTimePicker
      label="Reporting period"
      selectionMode="range"
      value={{ startDate: today, endDate: later }}
      onChange={noop}
    />
    <DateTimePicker
      label="Shift days"
      selectionMode="multiple"
      value={[today, tomorrow, later]}
      onChange={noop}
    />
  </div>
);

// A single `date` field accepts a typed date in the locale's own field order
// (DD/MM/YYYY here); while empty it shows that mask, not `placeholder`.
export const TypedEntry = () => (
  <div style={stack}>
    <DateTimePicker
      label="Date of birth"
      value={new Date(1988, 2, 14)}
      inputEnabled
      helperText="Type it, or pick it from the calendar"
      onChange={noop}
    />
    <DateTimePicker
      label="Date of birth"
      value={null}
      inputEnabled
      onChange={noop}
    />
    <DateTimePicker
      label="Date of birth"
      value={new Date(2031, 2, 14)}
      inputEnabled
      error="Can't be in the future"
      onChange={noop}
    />
  </div>
);

export const Constrained = () => (
  <div style={stack}>
    <DateTimePicker
      label="Booking date"
      value={later}
      validRange={{ startDate: today, endDate: new Date(2024, 5, 30) }}
      helperText="Today to the end of June"
      onChange={noop}
    />
    <DateTimePicker
      label="Working day"
      value={later}
      isDateDisabled={(date) => date.getDay() === 0 || date.getDay() === 6}
      helperText="Weekends excluded"
      onChange={noop}
    />
  </div>
);

// The relative prefix only appears on a read-only field: a single `date`
// field is typed into by default, so these opt out with `inputEnabled={false}`.
export const RelativeDays = () => (
  <div style={stack}>
    {[yesterday, today, tomorrow, later].map((value) => (
      <DateTimePicker
        key={value.toISOString()}
        label="Invoice date"
        mode="date"
        value={value}
        inputEnabled={false}
        onChange={noop}
      />
    ))}
  </div>
);

// The device locale drives the relative day words by default;
// `relativeLabels` overrides any of them, e.g. with strings from i18n.
const dueLabels = { today: "Due today", tomorrow: "Due tomorrow" };

export const LabelOverrides = () => (
  <div style={stack}>
    <DateTimePicker
      label="Invoice"
      mode="date"
      value={today}
      inputEnabled={false}
      relativeLabels={dueLabels}
      onChange={noop}
    />
    <DateTimePicker
      label="Payment"
      mode="datetime"
      value={tomorrow}
      relativeLabels={dueLabels}
      onChange={noop}
    />
  </div>
);

export const Disabled = () => (
  <div style={stack}>
    <DateTimePicker
      label="Contract start (locked)"
      mode="date"
      value={new Date(2024, 0, 8)}
      disabled
      onChange={noop}
    />
  </div>
);

/**
 * Static `datetime`: tapping a day moves straight on to the time, and the
 * date readout above the clock goes back.
 */
export const Static = () => (
  <div style={stack}>
    <DateTimePicker
      variant="static"
      mode="datetime"
      value={new Date(2024, 4, 15, 9, 25)}
      onChange={noop}
    />
  </div>
);
