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
];
