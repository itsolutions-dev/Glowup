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
  layout: "list",
  loading: false,
  resizable: true,
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
    start: at(3, 9, 45),
    end: at(3, 10, 15),
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

// Monday to Friday of the week `day` falls in.
const workWeek = (day: Date) => {
  const monday = new Date(day);
  monday.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return Array.from(
    { length: 5 },
    (_, i) =>
      new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
  );
};

export default function DayTimelineExample() {
  const [day, setDay] = useState(new Date(2026, 10, 3));
  const [events, setEvents] = useState(EVENTS);
  const [opened, setOpened] = useState<string>();
  const list = props.layout === "list" || !props.layout;
  return (
    <VStack spacing="m">
      <WeekStrip value={day} onChange={setDay} />
      <DayTimeline
        {...props}
        events={
          list
            ? events.filter((e) => e.start.getDate() === day.getDate())
            : events
        }
        days={workWeek(day)}
        month={day}
        firstDayOfWeek={1}
        onEventPress={(e) => setOpened(e.title)}
        onEventChange={(moved, { start, end }) =>
          setEvents((all) =>
            all.map((e) => (e.id === moved.id ? { ...e, start, end } : e)),
          )
        }
        onDayPress={setDay}
        style={list ? undefined : { height: 480 }}
      />
      {!!opened && (
        <Typography variant="bodySmall" color="onSurfaceVariant">
          Opened: {opened}
        </Typography>
      )}
    </VStack>
  );
}
