import React from "react";
import { DatePickerInput } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 340,
};

const noop = () => {};

const today = new Date(2024, 4, 15);

/**
 * Text-first date entry: `inputEnabled` is locked on, so the field is typed
 * directly and the trailing icon is the way into the calendar rather than the
 * only way in. Field order follows the locale — the capture browser is it-IT,
 * so this reads DD/MM/YYYY and `22/11/2026` parses as 22 November.
 */
export const TypedEntry = () => (
  <div style={stack}>
    <DatePickerInput
      label="Date of birth"
      value={new Date(1988, 2, 14)}
      onChange={noop}
    />
    <DatePickerInput
      label="Date of birth"
      value={null}
      placeholder="DD/MM/YYYY"
      helperText="Type it, or pick it from the calendar"
      onChange={noop}
    />
  </div>
);

/**
 * Typed text is validated against `validRange` on blur, not on every
 * keystroke — a half-typed date is never an error. What fails validation comes
 * back through the same `error` prop the rest of the kit uses.
 */
export const Validation = () => (
  <div style={stack}>
    <DatePickerInput
      label="Hire date"
      value={today}
      validRange={{ startDate: new Date(2020, 0, 1), endDate: today }}
      helperText="2020 to today"
      onChange={noop}
    />
    <DatePickerInput
      label="Hire date"
      value={new Date(2031, 7, 9)}
      error="That date is in the future"
      onChange={noop}
    />
  </div>
);
