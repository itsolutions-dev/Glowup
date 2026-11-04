import React from "react";
import { DayTimeline } from "@its/glowup-ui";

const box: React.CSSProperties = { width: 360 };
const at = (h: number, m = 0) => new Date(2026, 10, 3, h, m);

/** The day's events by start time: the time, then a card tinted from `color` with a bar on its edge. */
export const Day = () => (
  <div style={box}>
    <DayTimeline
      onEventPress={() => {}}
      events={[
        {
          id: 2,
          title: "Northgate Ltd",
          overline: "Call back",
          start: at(11),
          end: at(11, 15),
          color: "#61B340",
        },
        {
          id: 1,
          title: "Brightside Studio",
          overline: "Appointment",
          start: at(9, 30),
          end: at(10),
          note: "Contract review",
          color: "#1D5B9D",
        },
      ]}
    />
  </div>
);

/** `canceled` greys the card out and strikes it through. */
export const Canceled = () => (
  <div style={box}>
    <DayTimeline
      events={[
        {
          id: 1,
          title: "Riverside branch",
          overline: "Appointment",
          start: at(15),
          end: at(16),
          canceled: true,
        },
      ]}
    />
  </div>
);

/** `loading` shows a list skeleton in place of the events. */
export const Loading = () => (
  <div style={box}>
    <DayTimeline events={[]} loading />
  </div>
);

/** No events: `emptyState`, "Nothing scheduled" by default. */
export const Empty = () => (
  <div style={box}>
    <DayTimeline events={[]} />
  </div>
);
