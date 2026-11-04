import { useState } from "react";
import {
  DayTimeline,
  Typography,
  VStack,
  WeekStrip,
  type DayTimelineEvent,
  type DayTimelineProps,
} from "@its/glowup-ui";

const props: Partial<DayTimelineProps> = {
  loading: false,
};

const at = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m);

// A few appointments, invented.
const EVENTS: DayTimelineEvent[] = [
  {
    id: 1,
    title: "Brightside Studio",
    overline: "Appointment",
    start: at(3, 9, 30),
    end: at(3, 10),
    note: "Contract review",
    color: "#1D5B9D",
  },
  {
    id: 2,
    title: "Northgate Ltd",
    overline: "Call back",
    start: at(3, 11),
    end: at(3, 11, 15),
    color: "#61B340",
  },
  {
    id: 3,
    title: "Riverside branch",
    overline: "Appointment",
    start: at(3, 15),
    end: at(3, 16),
    canceled: true,
  },
  {
    id: 4,
    title: "Harbour & Co",
    overline: "Appointment",
    start: at(5, 10),
    end: at(5, 11),
    color: "#1D5B9D",
  },
];

export default function DayTimelineExample() {
  const [day, setDay] = useState(new Date(2026, 10, 3));
  const [opened, setOpened] = useState<string>();
  const events = EVENTS.filter((e) => e.start.getDate() === day.getDate());
  return (
    <VStack spacing="m">
      <WeekStrip value={day} onChange={setDay} />
      <DayTimeline
        {...props}
        events={events}
        onEventPress={(e) => setOpened(e.title)}
      />
      {!!opened && (
        <Typography variant="bodySmall" color="onSurfaceVariant">
          Opened: {opened}
        </Typography>
      )}
    </VStack>
  );
}
