// GENERATED — do not edit.
// Source: .design-sync/previews/DayTimeline.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { DayTimeline } from "@its/glowup-ui";

const box: ViewStyle = { width: 360 };
const at = (h: number, m = 0) => new Date(2026, 10, 3, h, m);

/** The day's events by start time: the time, then a card tinted from `color` with a bar on its edge. */
export const Day = () => (
  <View style={box}>
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
  </View>
);

/** `canceled` greys the card out and strikes it through. */
export const Canceled = () => (
  <View style={box}>
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
  </View>
);

/** `loading` shows a list skeleton in place of the events. */
export const Loading = () => (
  <View style={box}>
    <DayTimeline events={[]} loading />
  </View>
);

/** No events: `emptyState`, "Nothing scheduled" by default. */
export const Empty = () => (
  <View style={box}>
    <DayTimeline events={[]} />
  </View>
);

const week = [2, 3, 4, 5, 6].map((d) => new Date(2026, 10, d));
const on = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m);

/** `layout="grid"`: a column per day on a grid of hours; overlapping events share the width. */
export const Grid = () => (
  <View style={{ width: 720, height: 420 }}>
    <DayTimeline
      layout="grid"
      days={week}
      startHour={8}
      endHour={14}
      onEventPress={() => {}}
      onEventChange={() => {}}
      resizable
      events={[
        {
          id: 1,
          title: "Brightside Studio",
          start: on(3, 9, 30),
          end: on(3, 10, 30),
          color: "#1D5B9D",
        },
        {
          id: 2,
          title: "Northgate Ltd",
          start: on(3, 10),
          end: on(3, 10, 30),
          color: "#61B340",
        },
        {
          id: 3,
          title: "Harbour & Co",
          start: on(5, 11),
          end: on(5, 12),
          color: "#1D5B9D",
        },
        {
          id: 4,
          title: "Riverside branch",
          start: on(2, 8, 30),
          end: on(2, 9),
          canceled: true,
        },
      ]}
    />
  </View>
);

/** `layout="month"`: a few events per day, "+N" opens the rest. */
export const Month = () => (
  <View style={{ width: "100%", maxWidth: 720 }}>
    <DayTimeline
      layout="month"
      month={on(1, 0)}
      firstDayOfWeek={1}
      maxPerDay={2}
      onEventPress={() => {}}
      events={[9, 10, 11, 15].map((h, i) => ({
        id: i,
        title: ["Brightside", "Northgate", "Harbour", "Riverside"][i],
        start: on(4, h),
        end: on(4, h, 30),
        color: i % 2 ? "#61B340" : "#1D5B9D",
      }))}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Day",
    title: "Day",
    description:
      "The day's events by start time: the time, then a card tinted from `color` with a bar on its edge.",
    render: Day,
  },
  {
    name: "Canceled",
    title: "Canceled",
    description: "`canceled` greys the card out and strikes it through.",
    render: Canceled,
  },
  {
    name: "Loading",
    title: "Loading",
    description: "`loading` shows a list skeleton in place of the events.",
    render: Loading,
  },
  {
    name: "Empty",
    title: "Empty",
    description: 'No events: `emptyState`, "Nothing scheduled" by default.',
    render: Empty,
  },
  {
    name: "Grid",
    title: "Grid",
    description:
      '`layout="grid"`: a column per day on a grid of hours; overlapping events share the width.',
    render: Grid,
  },
  {
    name: "Month",
    title: "Month",
    description: '`layout="month"`: a few events per day, "+N" opens the rest.',
    render: Month,
  },
];
