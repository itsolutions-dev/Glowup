import React from "react";
import { TimePicker } from "@glowup/ui";

const stack: React.CSSProperties = {
  display: "flex",
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
  <div style={stack}>
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
  </div>
);

/**
 * The clock format follows the locale — the capture browser is it-IT, which is
 * 24-hour — and `minuteInterval` is the granularity the dial snaps to.
 * `use24HourClock` can force the 24-hour face but cannot force the 12-hour one;
 * that takes a 12-hour `locale`.
 */
export const Formats = () => (
  <div style={stack}>
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
  </div>
);
