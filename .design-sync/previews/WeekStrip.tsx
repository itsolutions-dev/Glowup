import React from "react";
import { WeekStrip } from "@its/glowup-ui";

const box: React.CSSProperties = { width: 360 };
const TUESDAY = new Date(2026, 10, 3);

/** Monday to Friday, the chosen day in `primary`. */
export const WorkWeek = () => (
  <div style={box}>
    <WeekStrip value={TUESDAY} onChange={() => {}} locale="en-GB" />
  </div>
);

/** `weekDays` lists the days to show; the week starts on the locale's first day. */
export const WholeWeek = () => (
  <div style={box}>
    <WeekStrip
      value={TUESDAY}
      onChange={() => {}}
      locale="en-US"
      weekDays={[0, 1, 2, 3, 4, 5, 6]}
    />
  </div>
);

/** `gradient` fills the chosen day with the brand gradient, `primary` into `tertiary`. */
export const BrandGradient = () => (
  <div style={box}>
    <WeekStrip value={TUESDAY} onChange={() => {}} locale="it-IT" gradient />
  </div>
);
