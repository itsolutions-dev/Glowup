import React from "react";
import DateTimePicker from "./DateTimePicker";
import { SingleDateTimePickerProps } from "./DateTimePicker.shared";

export type DatePickerInputProps = Omit<
  SingleDateTimePickerProps,
  "mode" | "selectionMode" | "inputEnabled"
>;

/**
 * Text-first date entry: the field is typed in the locale's own order
 * (DD/MM/YYYY in it-IT, MM/DD/YYYY in en-US) and the trailing icon still opens
 * the calendar. Typed text is validated against `validRange` on blur.
 */
const DatePickerInput = (props: DatePickerInputProps) => (
  <DateTimePicker {...props} mode="date" inputEnabled />
);

export default DatePickerInput;
