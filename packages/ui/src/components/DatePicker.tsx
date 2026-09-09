import React from "react";
import DateTimePicker from "./DateTimePicker";
import { DateTimePickerProps, DistributiveOmit } from "./DateTimePicker.shared";

export type DatePickerProps = DistributiveOmit<DateTimePickerProps, "mode">;

/**
 * `DateTimePicker` locked to calendar-date selection. Still accepts
 * `selectionMode` for a range or a set of days.
 */
const DatePicker = (props: DatePickerProps) => (
  // The cast re-attaches the discriminant that `DistributiveOmit` widened.
  <DateTimePicker {...(props as DateTimePickerProps)} mode="date" />
);

export default DatePicker;
