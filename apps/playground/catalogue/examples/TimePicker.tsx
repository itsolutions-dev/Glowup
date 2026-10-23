import { useState } from "react";
import {
  Button,
  TimePicker,
  Typography,
  VStack,
  type TimePickerProps,
} from "@its/glowup-ui";

const props: Partial<TimePickerProps> = {
  label: "Arrival time",
  placeholder: "Pick a time",
  helperText: "Tables are held for 15 minutes.",
  minuteInterval: 15,
};

export default function TimePickerExample() {
  // Only the clock matters; the day is fixed so the page prerenders the same.
  const [time, setTime] = useState<Date | null>(
    () => new Date(2026, 9, 22, 19, 30),
  );
  const [reserved, setReserved] = useState(false);

  const text = time?.toLocaleTimeString(props.locale || undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: props.use24HourClock ? false : undefined,
  });

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Reserve a table</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {reserved
            ? `Table for four at ${text}.`
            : "Dinner for four, tonight."}
        </Typography>
      </VStack>
      <TimePicker
        {...props}
        value={time}
        onChange={(date) => {
          setTime(date);
          setReserved(false);
        }}
      />
      <Button disabled={!time || reserved} onClick={() => setReserved(true)}>
        {reserved ? "Reserved" : "Reserve"}
      </Button>
    </VStack>
  );
}
