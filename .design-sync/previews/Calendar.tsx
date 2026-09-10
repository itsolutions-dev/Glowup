import React from "react";
import { Calendar, Paper } from "@its/glowup-ui";

const noop = () => {};

// The capture clock is pinned to 2024-05-15, so these read deterministically.
const today = new Date(2024, 4, 15);
const soon = new Date(2024, 4, 22);
const later = new Date(2024, 4, 27);

// The grid is a fixed 7x40 wide, so a surface behind it keeps it from floating
// on the card background.
const surface = (children: React.ReactNode) => (
  <Paper elevation={0} outline style={{ alignSelf: "flex-start" }}>
    {children}
  </Paper>
);

const row: React.CSSProperties = {
  display: "flex",
  gap: 24,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

/**
 * `endless` virtualizes every month into one scroller and titles each one;
 * `paged` shows a single month behind the chevrons, with a month dropdown and
 * the neighbouring months' days greyed in.
 */
export const ScrollModes = () => (
  <div style={row}>
    {surface(<Calendar scrollMode="endless" value={soon} onChange={noop} />)}
    {surface(<Calendar scrollMode="paged" value={soon} onChange={noop} />)}
  </div>
);

export const SelectionModes = () => (
  <div style={row}>
    {surface(
      <Calendar
        scrollMode="paged"
        selectionMode="single"
        value={soon}
        onChange={noop}
      />,
    )}
    {surface(
      <Calendar
        scrollMode="paged"
        selectionMode="range"
        range={{ startDate: soon, endDate: later }}
        onRangeChange={noop}
      />,
    )}
    {surface(
      <Calendar
        scrollMode="paged"
        selectionMode="multiple"
        dates={[today, soon, later]}
        onDatesChange={noop}
      />,
    )}
  </div>
);

/**
 * `validRange` closes the window — days outside it, and the chevrons that would
 * page into dead ground, drop to 38%. `isDateDisabled` handles rules the range
 * cannot express.
 */
export const Constrained = () => (
  <div style={row}>
    {surface(
      <Calendar
        scrollMode="paged"
        value={soon}
        validRange={{ startDate: today, endDate: new Date(2024, 4, 24) }}
        onChange={noop}
      />,
    )}
    {surface(
      <Calendar
        scrollMode="paged"
        value={soon}
        isDateDisabled={(date) => date.getDay() === 0 || date.getDay() === 6}
        onChange={noop}
      />,
    )}
  </div>
);

// Month names, weekday names and the week start all come from Intl.
export const Locales = () => (
  <div style={row}>
    {surface(
      <Calendar
        scrollMode="paged"
        locale="it-IT"
        value={soon}
        showToday={false}
        onChange={noop}
      />,
    )}
    {surface(
      <Calendar
        scrollMode="paged"
        locale="en-US"
        value={soon}
        showToday={false}
        onChange={noop}
      />,
    )}
    {surface(
      <Calendar
        scrollMode="paged"
        locale="ja-JP"
        value={soon}
        showToday={false}
        onChange={noop}
      />,
    )}
  </div>
);
