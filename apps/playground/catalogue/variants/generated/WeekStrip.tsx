// GENERATED — do not edit.
// Source: .design-sync/previews/WeekStrip.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { WeekStrip } from "@its/glowup-ui";

const box: ViewStyle = { width: 360 };
const TUESDAY = new Date(2026, 10, 3);

/** Monday to Friday, the chosen day in `primary`. */
export const WorkWeek = () => (
  <View style={box}>
    <WeekStrip value={TUESDAY} onChange={() => {}} locale="en-GB" />
  </View>
);

/** `weekDays` lists the days to show; the week starts on the locale's first day. */
export const WholeWeek = () => (
  <View style={box}>
    <WeekStrip
      value={TUESDAY}
      onChange={() => {}}
      locale="en-US"
      weekDays={[0, 1, 2, 3, 4, 5, 6]}
    />
  </View>
);

/** `gradient` fills the chosen day with the brand gradient, `primary` into `tertiary`. */
export const BrandGradient = () => (
  <View style={box}>
    <WeekStrip value={TUESDAY} onChange={() => {}} locale="it-IT" gradient />
  </View>
);

export const variants: Variant[] = [
  {
    name: "WorkWeek",
    title: "Work week",
    description: "Monday to Friday, the chosen day in `primary`.",
    render: WorkWeek,
  },
  {
    name: "WholeWeek",
    title: "Whole week",
    description:
      "`weekDays` lists the days to show; the week starts on the locale's first day.",
    render: WholeWeek,
  },
  {
    name: "BrandGradient",
    title: "Brand gradient",
    description:
      "`gradient` fills the chosen day with the brand gradient, `primary` into `tertiary`.",
    render: BrandGradient,
  },
];
