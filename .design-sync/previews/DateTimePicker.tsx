import React from "react";
import { DateTimePicker } from "@glowup/ui";

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
    <DateTimePicker label="Delivery date" mode="date" value={later} onChange={noop} />
    <DateTimePicker label="Pickup window" mode="time" value={today} onChange={noop} />
    <DateTimePicker
      label="Appointment"
      mode="datetime"
      value={later}
      onChange={noop}
    />
  </div>
);

export const RelativeDays = () => (
  <div style={stack}>
    <DateTimePicker label="Invoice date" mode="date" value={yesterday} onChange={noop} />
    <DateTimePicker label="Invoice date" mode="date" value={today} onChange={noop} />
    <DateTimePicker label="Invoice date" mode="date" value={tomorrow} onChange={noop} />
    <DateTimePicker label="Invoice date" mode="date" value={later} onChange={noop} />
  </div>
);

// The device locale drives the relative day words by default (it-IT here);
// `relativeLabels` overrides them, e.g. with strings from i18n.
const englishLabels = {
  today: "Today",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
};

export const LabelOverrides = () => (
  <div style={stack}>
    <DateTimePicker
      label="Invoice date"
      mode="date"
      value={today}
      relativeLabels={englishLabels}
      onChange={noop}
    />
    <DateTimePicker
      label="Payment due"
      mode="datetime"
      value={tomorrow}
      relativeLabels={englishLabels}
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
