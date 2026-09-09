import React from "react";
import DateTimePicker from "./DateTimePicker";
import { DateTimePickerProps } from "./DateTimePicker.shared";

export type TimePickerProps = Omit<DateTimePickerProps, "mode">;

/** `DateTimePicker` locked to time-of-day selection. */
const TimePicker = (props: TimePickerProps) => (
  <DateTimePicker {...props} mode="time" />
);

export default TimePicker;
