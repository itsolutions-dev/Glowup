import { useState } from "react";
import {
  DatePicker,
  Typography,
  VStack,
  type SingleDateTimePickerProps,
} from "@its/glowup-ui";

// One date. A range or a set of days changes the shape of `value`.
const props: Partial<Omit<SingleDateTimePickerProps, "mode">> = {
  label: "Delivery date",
  placeholder: "Pick a day",
  helperText: "We do not deliver on Sundays.",
  clearable: true,
};

// A fixed day, not today: the page is prerendered and a clock would not match.
const FIRST_DAY = new Date(2026, 9, 22);

export default function DatePickerExample() {
  const [day, setDay] = useState<Date | null>(() => new Date(2026, 9, 24));

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Schedule your delivery</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {day
            ? `Your parcel arrives on ${day.toLocaleDateString(props.locale || undefined, { weekday: "long", day: "numeric", month: "long" })}.`
            : "Pick the day you will be home."}
        </Typography>
      </VStack>
      <DatePicker
        {...props}
        value={day}
        onChange={setDay}
        onClear={() => setDay(null)}
        validRange={{ startDate: FIRST_DAY }}
        isDateDisabled={(date) => date.getDay() === 0}
      />
    </VStack>
  );
}
