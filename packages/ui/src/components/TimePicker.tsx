import React from "react";
import DateTimePicker from "./DateTimePicker";
import { SingleDateTimePickerProps } from "./DateTimePicker.shared";

export type TimePickerProps = Omit<
  SingleDateTimePickerProps,
  "mode" | "selectionMode"
>;

/** `DateTimePicker` locked to time-of-day selection on the M3 clock dial. */
const TimePicker = (props: TimePickerProps) => (
  <DateTimePicker {...props} mode="time" />
);

export default TimePicker;
