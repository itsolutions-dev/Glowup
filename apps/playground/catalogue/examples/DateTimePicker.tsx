import { useState } from "react";
import {
  Button,
  DateTimePicker,
  Typography,
  VStack,
  type SingleDateTimePickerProps,
} from "@its/glowup-ui";

const props: Partial<SingleDateTimePickerProps> = {
  label: "Appointment",
  mode: "datetime",
  placeholder: "Pick a day and a time",
  helperText: "Closed on Sundays.",
  clearable: true,
};

// A fixed day, not today: the page is prerendered and a clock would not match.
const FIRST_DAY = new Date(2026, 9, 22);

export default function DateTimePickerExample() {
  const [when, setWhen] = useState<Date | null>(
    () => new Date(2026, 9, 22, 10, 30),
  );
  const [booked, setBooked] = useState(false);

  // The text follows what the picker collects, in its locale.
  const text = when?.toLocaleString(props.locale || undefined, {
    ...(props.mode !== "time" && {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    ...(props.mode !== "date" && {
      hour: "numeric",
      minute: "2-digit",
      hour12: props.use24HourClock ? false : undefined,
    }),
  });

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Book a check-up</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {booked ? `Booked for ${text}.` : "Choose a day and a time."}
        </Typography>
      </VStack>
      <DateTimePicker
        {...props}
        value={when}
        onChange={(date) => {
          setWhen(date);
          setBooked(false);
        }}
        onClear={() => setWhen(null)}
        validRange={{ startDate: FIRST_DAY }}
        isDateDisabled={(date) => date.getDay() === 0}
      />
      <Button disabled={!when || booked} onClick={() => setBooked(true)}>
        {booked ? "Booked" : "Confirm booking"}
      </Button>
    </VStack>
  );
}
