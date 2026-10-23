import React from "react";
import DateTimePicker from "./DateTimePicker";
import { SingleDateTimePickerProps } from "./DateTimePicker.shared";

export type TimePickerProps = Omit<
  SingleDateTimePickerProps,
  "mode" | "selectionMode"
>;

/**
 * `DateTimePicker` locked to time-of-day selection on the M3 clock dial. With
 * `variant="static"` it is the clock alone, inline in the page.
 */
const TimePicker = ({ showOkButton = true, ...props }: TimePickerProps) => (
  <DateTimePicker {...props} showOkButton={showOkButton} mode="time" />
);

export default TimePicker;
