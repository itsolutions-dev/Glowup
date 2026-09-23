// GENERATED — do not edit.
// Source: .design-sync/previews/DateTimePicker.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { DateTimePicker } from "@its/glowup-ui";

const stack: ViewStyle = {
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
  <View style={stack}>
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
  </View>
);

// `selectionMode` changes the shape of `value` and `onChange` with it: one
// Date, a { startDate, endDate } pair, or an array.
export const SelectionModes = () => (
  <View style={stack}>
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
  </View>
);

// The field accepts a typed date in the locale's own field order — the capture
// browser is it-IT, so this reads DD/MM/YYYY.
export const TypedEntry = () => (
  <View style={stack}>
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
      placeholder="Not set"
      onChange={noop}
    />
    <DateTimePicker
      label="Date of birth"
      value={new Date(2031, 2, 14)}
      inputEnabled
      error="Can't be in the future"
      onChange={noop}
    />
  </View>
);

export const Constrained = () => (
  <View style={stack}>
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
  </View>
);

export const RelativeDays = () => (
  <View style={stack}>
    <DateTimePicker
      label="Invoice date"
      mode="date"
      value={yesterday}
      onChange={noop}
    />
    <DateTimePicker
      label="Invoice date"
      mode="date"
      value={today}
      onChange={noop}
    />
    <DateTimePicker
      label="Invoice date"
      mode="date"
      value={tomorrow}
      onChange={noop}
    />
    <DateTimePicker
      label="Invoice date"
      mode="date"
      value={later}
      onChange={noop}
    />
  </View>
);

// The device locale drives the relative day words by default (it-IT here);
// `relativeLabels` overrides them, e.g. with strings from i18n.
const englishLabels = {
  today: "Today",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
};

export const LabelOverrides = () => (
  <View style={stack}>
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
  </View>
);

export const Disabled = () => (
  <View style={stack}>
    <DateTimePicker
      label="Contract start (locked)"
      mode="date"
      value={new Date(2024, 0, 8)}
      disabled
      onChange={noop}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Modes",
    title: "Modes",
    render: Modes,
  },
  {
    name: "SelectionModes",
    title: "Selection modes",
    render: SelectionModes,
  },
  {
    name: "TypedEntry",
    title: "Typed entry",
    render: TypedEntry,
  },
  {
    name: "Constrained",
    title: "Constrained",
    render: Constrained,
  },
  {
    name: "RelativeDays",
    title: "Relative days",
    render: RelativeDays,
  },
  {
    name: "LabelOverrides",
    title: "Label overrides",
    render: LabelOverrides,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
];
