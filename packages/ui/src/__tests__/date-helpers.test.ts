import {
  addMonths,
  applyRangeSelection,
  EMPTY_RANGE,
  formatDateInput,
  getDeviceLocale,
  parseDateInput,
  toggleMultipleSelection,
} from "../components/DateTimePicker.shared";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);

describe("parseDateInput", () => {
  it("reads the locale's field order", () => {
    expect(parseDateInput("22/11/2023", "it-IT")).toEqual(day(2023, 11, 22));
    expect(parseDateInput("11/22/2023", "en-US")).toEqual(day(2023, 11, 22));
  });

  it("rejects dates that do not exist instead of rolling them over", () => {
    expect(parseDateInput("31/02/2023", "it-IT")).toBeNull();
    expect(parseDateInput("29/02/2023", "it-IT")).toBeNull();
    expect(parseDateInput("29/02/2024", "it-IT")).toEqual(day(2024, 2, 29));
  });

  it("returns null for incomplete or out-of-range input", () => {
    expect(parseDateInput("22/11", "it-IT")).toBeNull();
    expect(parseDateInput("", "it-IT")).toBeNull();
    expect(parseDateInput("00/13/2023", "it-IT")).toBeNull();
  });

  it("reads a 2-digit year as this century", () => {
    expect(parseDateInput("01/02/24", "it-IT")).toEqual(day(2024, 2, 1));
  });

  it("round-trips with formatDateInput", () => {
    const date = day(2023, 1, 5);
    expect(parseDateInput(formatDateInput(date, "it-IT"), "it-IT")).toEqual(
      date,
    );
  });
});

describe("addMonths", () => {
  it("clamps to the last day of a shorter month", () => {
    expect(addMonths(day(2023, 1, 31), 1)).toEqual(day(2023, 2, 28));
    expect(addMonths(day(2024, 1, 31), 1)).toEqual(day(2024, 2, 29));
    expect(addMonths(day(2023, 3, 31), -1)).toEqual(day(2023, 2, 28));
  });

  it("crosses year boundaries", () => {
    expect(addMonths(day(2023, 12, 15), 1)).toEqual(day(2024, 1, 15));
    expect(addMonths(day(2023, 1, 15), -12)).toEqual(day(2022, 1, 15));
  });
});

describe("applyRangeSelection", () => {
  it("starts, closes and restarts a range", () => {
    const start = applyRangeSelection(EMPTY_RANGE, day(2023, 5, 10));
    expect(start).toEqual({ startDate: day(2023, 5, 10), endDate: null });

    const closed = applyRangeSelection(start, day(2023, 5, 14));
    expect(closed).toEqual({
      startDate: day(2023, 5, 10),
      endDate: day(2023, 5, 14),
    });

    // A third pick starts over rather than extending.
    expect(applyRangeSelection(closed, day(2023, 5, 20))).toEqual({
      startDate: day(2023, 5, 20),
      endDate: null,
    });
  });

  it("restarts when the end would come before the start", () => {
    const start = applyRangeSelection(EMPTY_RANGE, day(2023, 5, 10));
    expect(applyRangeSelection(start, day(2023, 5, 1))).toEqual({
      startDate: day(2023, 5, 1),
      endDate: null,
    });
  });
});

describe("toggleMultipleSelection", () => {
  it("adds a missing day and removes a present one", () => {
    const one = toggleMultipleSelection([], day(2023, 5, 10));
    expect(one).toHaveLength(1);
    expect(toggleMultipleSelection(one, day(2023, 5, 10))).toHaveLength(0);
  });
});

describe("getDeviceLocale", () => {
  it("comes from Intl, with a fallback, and needs no native module", () => {
    const locale = getDeviceLocale();
    expect(typeof locale).toBe("string");
    expect(locale.length).toBeGreaterThan(0);
  });
});
