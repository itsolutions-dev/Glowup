import React from "react";
import DateTimePicker from "./DateTimePicker";
import { DateTimePickerProps, DistributiveOmit } from "./DateTimePicker.shared";

export type DatePickerProps = DistributiveOmit<DateTimePickerProps, "mode">;

/**
 * `DateTimePicker` locked to calendar-date selection. Still accepts
 * `selectionMode` for a range (`"range"`) or a set of days (`"multiple"`), and
 * `inputEnabled` for typing a date into the field. With `variant="static"` it is
 * the calendar alone, inline in the page.
 */
const DatePicker = (props: DatePickerProps) => (
  // The cast re-attaches the discriminant that `DistributiveOmit` widened.
  <DateTimePicker {...(props as DateTimePickerProps)} mode="date" />
);

export default DatePicker;
