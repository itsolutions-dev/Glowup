import { useState } from "react";
import {
  Divider,
  Typography,
  VStack,
  WeekStrip,
  type WeekStripProps,
} from "@its/glowup-ui";

const props: Partial<WeekStripProps> = {
  gradient: true,
};

// A few appointments by day of the month, invented.
const AGENDA: Record<number, string[]> = {
  2: ["09:30 · Call with Brightside Studio", "15:00 · Contract review"],
  3: ["11:00 · Demo for Northgate Ltd"],
  5: ["10:00 · Branch visit, Riverside", "12:30 · Lunch with the team"],
};

export default function WeekStripExample() {
  const [day, setDay] = useState(new Date(2026, 10, 3));
  const items = AGENDA[day.getDate()] ?? [];
  return (
    <VStack spacing="s">
      <WeekStrip {...props} value={day} onChange={setDay} />
      <Divider />
      {items.length ? (
        items.map((item) => (
          <Typography key={item} variant="bodyMedium">
            {item}
          </Typography>
        ))
      ) : (
        <Typography variant="bodyMedium" color="onSurfaceVariant">
          Nothing planned.
        </Typography>
      )}
    </VStack>
  );
}
