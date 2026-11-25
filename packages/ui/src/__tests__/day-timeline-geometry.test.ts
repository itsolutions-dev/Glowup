import {
  dropMinutes,
  monthWeeks,
  overlapLanes,
  verticalPlacement,
} from "../components/internal/timeGrid";

const at = (h: number, m = 0, day = 4) => new Date(2026, 10, day, h, m);
const span = (h1: number, m1: number, h2: number, m2: number) => ({
  start: at(h1, m1),
  end: at(h2, m2),
});

describe("overlapLanes", () => {
  it("gives events that do not overlap the whole width", () => {
    expect(overlapLanes([span(9, 0, 10, 0), span(10, 0, 11, 0)])).toEqual([
      { lane: 0, lanes: 1 },
      { lane: 0, lanes: 1 },
    ]);
  });

  it("puts overlapping events side by side, in the order given", () => {
    expect(
      overlapLanes([span(9, 30, 10, 0), span(9, 0, 10, 0), span(9, 45, 11, 0)]),
    ).toEqual([
      { lane: 1, lanes: 3 },
      { lane: 0, lanes: 3 },
      { lane: 2, lanes: 3 },
    ]);
  });

  it("reuses a lane freed inside a group, which keeps its lane count", () => {
    // 9-10 and 9:30-11 overlap; 10-10:30 takes the first lane back.
    expect(
      overlapLanes([
        span(9, 0, 10, 0),
        span(9, 30, 11, 0),
        span(10, 0, 10, 30),
      ]),
    ).toEqual([
      { lane: 0, lanes: 2 },
      { lane: 1, lanes: 2 },
      { lane: 0, lanes: 2 },
    ]);
  });
});

describe("verticalPlacement", () => {
  it("places an event by its start and length", () => {
    expect(verticalPlacement(span(9, 30, 10, 0), 8, 20, 48, 20)).toEqual({
      top: 72,
      height: 24,
    });
  });

  it("clips to the grid's hours, keeps a minimum height, and drops what is outside", () => {
    expect(verticalPlacement(span(7, 0, 9, 0), 8, 20, 48, 20)).toEqual({
      top: 0,
      height: 48,
    });
    expect(verticalPlacement(span(9, 0, 9, 5), 8, 20, 48, 20)).toEqual({
      top: 48,
      height: 20,
    });
    expect(verticalPlacement(span(20, 0, 21, 0), 8, 20, 48, 20)).toBeNull();
  });
});

describe("dropMinutes", () => {
  it("snaps the drop to the step", () => {
    // 100 dp down from 8:00 at 48 dp an hour is 10:05, snapped to 10:00.
    expect(dropMinutes(100, 30, 8, 20, 48, 30)).toBe(600);
  });

  it("keeps the event inside the hours", () => {
    expect(dropMinutes(-50, 30, 8, 20, 48, 30)).toBe(480);
    expect(dropMinutes(9999, 60, 8, 20, 48, 30)).toBe(1140);
  });
});

describe("monthWeeks", () => {
  it("covers the month from the first day of the week, without a week wholly in the next month", () => {
    // November 2026 starts on a Sunday; from Monday that is six rows.
    const weeks = monthWeeks(new Date(2026, 10, 15), 1, [0, 1, 2, 3, 4, 5, 6]);
    expect(weeks).toHaveLength(6);
    expect(weeks[0][0]).toEqual(new Date(2026, 9, 26));
    expect(weeks[5][6]).toEqual(new Date(2026, 11, 6));
    // February 2027 starts on a Monday and has 28 days: four rows.
    expect(
      monthWeeks(new Date(2027, 1, 1), 1, [1, 2, 3, 4, 5, 6, 0]),
    ).toHaveLength(4);
  });

  it("keeps only the weekdays asked for", () => {
    const weeks = monthWeeks(new Date(2026, 10, 15), 1, [1, 2, 3, 4, 5]);
    expect(weeks[0].map((d) => d.getDay())).toEqual([1, 2, 3, 4, 5]);
  });
});
