import React from "react";
import DateTimePicker from "./DateTimePicker";
import { RangeDateTimePickerProps } from "./DateTimePicker.shared";

export type DateRangePickerProps = Omit<
  RangeDateTimePickerProps,
  "mode" | "selectionMode"
>;

/** `DatePicker` locked to a start/end interval. */
const DateRangePicker = (props: DateRangePickerProps) => (
  <DateTimePicker {...props} mode="date" selectionMode="range" />
);

export default DateRangePicker;
