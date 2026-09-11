// GENERATED — do not edit.
// Source: .design-sync/previews/DatePicker.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { DatePicker } from "@its/glowup-ui";

// `DateTimePicker` carries its own marginBottom, so the column takes no gap.
const stack: ViewStyle = {
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
  <View style={stack}>
    <DatePicker label="Invoice date" value={later} onChange={noop} />
    <DatePicker
      label="Invoice date"
      value={null}
      placeholder="Not set"
      onChange={noop}
    />
  </View>
);

/**
 * Only `mode` is locked, so `selectionMode` still switches the shape of the
 * value: one `Date`, a `{ startDate, endDate }` pair, or an array of days.
 * (`DateRangePicker` is this same component with the range mode fixed too.)
 */
export const SelectionModes = () => (
  <View style={stack}>
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
  </View>
);

export const States = () => (
  <View style={stack}>
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
  </View>
);

export const variants: Variant[] = [
  {
    name: "Basic",
    title: "Basic",
    description:
      "`DateTimePicker` with `mode` locked to `date`: the dialog opens straight on the calendar and neither the field nor the surface ever offers a time. Use it wherever a time-of-day would be meaningless — it is the same component, so every other prop behaves identically.",
    render: Basic,
  },
  {
    name: "SelectionModes",
    title: "Selection modes",
    description:
      "Only `mode` is locked, so `selectionMode` still switches the shape of the value: one `Date`, a `{ startDate, endDate }` pair, or an array of days. (`DateRangePicker` is this same component with the range mode fixed too.)",
    render: SelectionModes,
  },
  {
    name: "States",
    title: "States",
    render: States,
  },
];
