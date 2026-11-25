// The geometry behind DayTimeline's grid and month layouts, kept free of React
// and of the platform so it can be tested on its own. Times are minutes from
// midnight; distances are dp.

import { buildMonthMatrix } from "../DateTimePicker.shared";

interface Span {
  start: Date;
  end: Date;
}

/** Where an event sits across its day's width: lane `lane` of `lanes`. */
export interface Lane {
  lane: number;
  lanes: number;
}

const MINUTE = 60_000;

export const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Length in minutes, never below zero. */
export const durationOf = ({ start, end }: Span) =>
  Math.max(0, Math.round((end.getTime() - start.getTime()) / MINUTE));

/** `day` at `minutes` past its midnight. */
export const atMinutes = (day: Date, minutes: number) =>
  new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
  );

export const addMinutes = (d: Date, minutes: number) =>
  new Date(d.getTime() + minutes * MINUTE);

/** The nearest multiple of `step` (at least 1 minute). */
export const snap = (minutes: number, step: number) => {
  const s = Math.max(1, step);
  return Math.round(minutes / s) * s;
};

/** A distance down the grid turned into minutes past midnight, snapped. */
export const minutesAt = (
  y: number,
  startHour: number,
  hourHeight: number,
  step: number,
) => startHour * 60 + snap((y / hourHeight) * 60, step);

/**
 * Where an event `length` minutes long lands when its top is dropped `y` down
 * the grid: snapped, and kept inside the grid's hours.
 */
export const dropMinutes = (
  y: number,
  length: number,
  startHour: number,
  endHour: number,
  hourHeight: number,
  step: number,
) => {
  const latest = endHour * 60 - Math.min(length, (endHour - startHour) * 60);
  return Math.min(
    Math.max(minutesAt(y, startHour, hourHeight, step), startHour * 60),
    latest,
  );
};

/**
 * Side-by-side lanes for overlapping events, as a desktop calendar draws them:
 * events that overlap, directly or through others, share the width of the
 * group equally, each taking the first lane free at its start. Returns one
 * lane per event, in the order given.
 */
export const overlapLanes = (events: Span[]): Lane[] => {
  const order = events
    .map((e, index) => ({
      index,
      from: e.start.getTime(),
      to: e.end.getTime(),
    }))
    // A zero-length event still takes a sliver, or it would overlap nothing.
    .map((e) => ({ ...e, to: Math.max(e.to, e.from + 1) }))
    .sort((a, b) => a.from - b.from || b.to - a.to);
  const result: Lane[] = new Array(events.length);
  let group: { index: number; lane: number }[] = [];
  let groupEnd = -Infinity;
  // Each lane's last end, inside the current group.
  let laneEnds: number[] = [];

  const close = () => {
    for (const { index, lane } of group)
      result[index] = { lane, lanes: laneEnds.length };
    group = [];
    laneEnds = [];
  };

  for (const e of order) {
    if (e.from >= groupEnd) close();
    let lane = laneEnds.findIndex((end) => end <= e.from);
    if (lane < 0) lane = laneEnds.push(e.to) - 1;
    else laneEnds[lane] = e.to;
    group.push({ index: e.index, lane });
    groupEnd = Math.max(groupEnd, e.to);
  }
  close();
  return result;
};

/**
 * The top and height of an event in a grid running from `startHour` to
 * `endHour`, clipped to it; null when it falls wholly outside.
 */
export const verticalPlacement = (
  { start, end }: Span,
  startHour: number,
  endHour: number,
  hourHeight: number,
  minHeight: number,
) => {
  const from = Math.max(minutesOf(start), startHour * 60);
  const to = Math.min(
    minutesOf(start) + durationOf({ start, end }),
    endHour * 60,
  );
  if (from >= endHour * 60 || to < startHour * 60) return null;
  const top = ((from - startHour * 60) / 60) * hourHeight;
  const height = Math.max(((to - from) / 60) * hourHeight, minHeight);
  return { top, height };
};

/**
 * The weeks of the month `month` falls in, as rows of days from
 * `firstDayOfWeek`, keeping only the days in `weekDays`. A row wholly in the
 * next month is left out, so a month takes four to six rows.
 */
export const monthWeeks = (
  month: Date,
  firstDayOfWeek: number,
  weekDays: number[],
) => {
  const all = buildMonthMatrix(month, firstDayOfWeek);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const days = all.slice(w * 7, w * 7 + 7);
    if (w > 0 && days[0].getMonth() !== month.getMonth()) break;
    weeks.push(days.filter((d) => weekDays.includes(d.getDay())));
  }
  return weeks;
};
