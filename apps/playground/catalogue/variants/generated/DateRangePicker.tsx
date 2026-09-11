// GENERATED — do not edit.
// Source: .design-sync/previews/DateRangePicker.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { DateRangePicker, EMPTY_RANGE } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  width: 340,
};

const noop = () => {};

const today = new Date(2024, 4, 15);
const later = new Date(2024, 5, 3);

/**
 * `DatePicker` with both `mode` and `selectionMode` locked, so `value` is
 * always a `{ startDate, endDate }` pair. A half-picked range is a legal
 * value — the field shows the start and waits for the end — and `EMPTY_RANGE`
 * is the exported empty pair to initialise state with.
 */
export const Basic = () => (
  <View style={stack}>
    <DateRangePicker
      label="Reporting period"
      value={{ startDate: today, endDate: later }}
      onChange={noop}
    />
    <DateRangePicker
      label="Reporting period"
      value={{ startDate: today, endDate: null }}
      onChange={noop}
    />
    <DateRangePicker
      label="Reporting period"
      value={EMPTY_RANGE}
      placeholder="Whole year"
      onChange={noop}
    />
  </View>
);

/**
 * The range types its two ends inside the dialog rather than in the field, so
 * the field itself is display-only. Everything else — bounds, helper text,
 * errors, the disabled treatment — is `DateTimePicker`'s.
 */
export const States = () => (
  <View style={stack}>
    <DateRangePicker
      label="Stay"
      value={{ startDate: today, endDate: later }}
      validRange={{ startDate: today }}
      helperText="Check-out must follow check-in"
      onChange={noop}
    />
    <DateRangePicker
      label="Stay"
      value={{ startDate: later, endDate: null }}
      error="Pick a check-out date"
      onChange={noop}
    />
    <DateRangePicker
      label="Fiscal year"
      value={{
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31),
      }}
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
      "`DatePicker` with both `mode` and `selectionMode` locked, so `value` is always a `{ startDate, endDate }` pair. A half-picked range is a legal value — the field shows the start and waits for the end — and `EMPTY_RANGE` is the exported empty pair to initialise state with.",
    render: Basic,
  },
  {
    name: "States",
    title: "States",
    description:
      "The range types its two ends inside the dialog rather than in the field, so the field itself is display-only. Everything else — bounds, helper text, errors, the disabled treatment — is `DateTimePicker`'s.",
    render: States,
  },
];
