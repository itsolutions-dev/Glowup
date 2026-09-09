import React from "react";
import DateTimePicker from "./DateTimePicker";
import { DateTimePickerProps } from "./DateTimePicker.shared";

export type DatePickerProps = Omit<DateTimePickerProps, "mode">;

/** `DateTimePicker` locked to calendar-date selection. */
const DatePicker = (props: DatePickerProps) => (
  <DateTimePicker {...props} mode="date" />
);

export default DatePicker;
