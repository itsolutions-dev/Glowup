// GENERATED — do not edit.
// Source: .design-sync/previews/TimePicker.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { TimePicker } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  width: 340,
};

const noop = () => {};

const morning = new Date(2024, 4, 15, 9, 25);
const afternoon = new Date(2024, 4, 15, 16, 40);

/**
 * `DateTimePicker` locked to `mode="time"`: the field holds a time of day and
 * the dialog opens on the Material 3 clock face, skipping the calendar
 * entirely. The date part of `value` is carried through untouched, so the
 * component is safe to point at a full `Date`.
 */
export const Basic = () => (
  <View style={stack}>
    <TimePicker label="Pickup time" value={afternoon} onChange={noop} />
    <TimePicker
      label="Pickup time"
      value={null}
      placeholder="Any time"
      onChange={noop}
    />
    <TimePicker
      label="Closing time"
      value={new Date(2024, 4, 15, 18, 0)}
      disabled
      onChange={noop}
    />
  </View>
);

/**
 * The clock format follows the locale — the capture browser is it-IT, which is
 * 24-hour — and `minuteInterval` is the granularity the dial snaps to.
 * `use24HourClock` can force the 24-hour face but cannot force the 12-hour one;
 * that takes a 12-hour `locale`.
 */
export const Formats = () => (
  <View style={stack}>
    <TimePicker label="Appointment (it-IT)" value={morning} onChange={noop} />
    <TimePicker
      label="Appointment (en-US)"
      locale="en-US"
      value={morning}
      onChange={noop}
    />
    <TimePicker
      label="Slot"
      minuteInterval={15}
      value={new Date(2024, 4, 15, 10, 30)}
      helperText="Quarter-hour slots"
      onChange={noop}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Basic",
    title: "Basic",
    description:
      '`DateTimePicker` locked to `mode="time"`: the field holds a time of day and the dialog opens on the Material 3 clock face, skipping the calendar entirely. The date part of `value` is carried through untouched, so the component is safe to point at a full `Date`.',
    render: Basic,
  },
  {
    name: "Formats",
    title: "Formats",
    description:
      "The clock format follows the locale — the capture browser is it-IT, which is 24-hour — and `minuteInterval` is the granularity the dial snaps to. `use24HourClock` can force the 24-hour face but cannot force the 12-hour one; that takes a 12-hour `locale`.",
    render: Formats,
  },
];
