import { scaleTime } from "../vendor/d3";

export type TimeValue = Date | number;

export type TimeScale = {
  /** Time (a `Date` or epoch milliseconds) to pixel. */
  at: (value: TimeValue) => number;
  domain: [Date, Date];
  ticks: Date[];
  /** A tick's label, at a precision that suits the span of the domain. */
  format: (value: TimeValue) => string;
};

type TimeScaleOptions = {
  values: readonly (TimeValue | null | undefined)[];
  range: [number, number];
  /** Fixed ends instead of the data's; the data outside them is drawn off the plot. */
  domain?: [TimeValue, TimeValue];
  tickCount?: number;
  /** BCP 47 tag for the labels. Default "en-US". */
  locale?: string;
};

const HOUR = 3600000;
const DAY = 24 * HOUR;

export const toTime = (v: TimeValue | null | undefined): number | null => {
  const t = v instanceof Date ? v.getTime() : v;
  return typeof t === "number" && Number.isFinite(t) ? t : null;
};

const formats = new Map<string, Intl.DateTimeFormat>();
const formatterFor = (locale: string, options: Intl.DateTimeFormatOptions) => {
  const key = locale + JSON.stringify(options);
  let f = formats.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    formats.set(key, f);
  }
  return f;
};

/** How a tick is written for a domain `span` milliseconds long: hours inside two days, days inside a quarter, months beyond. */
export const tickFormatOptions = (span: number): Intl.DateTimeFormatOptions =>
  span <= 2 * DAY
    ? { hour: "2-digit", minute: "2-digit" }
    : span <= 92 * DAY
      ? { day: "2-digit", month: "2-digit" }
      : { month: "short", year: "numeric" };

/**
 * A moment in full, for a tooltip or a screen reader: the date, and the time when it is not midnight.
 * Read in the device's time zone, as the ticks are.
 */
export const formatMoment = (value: TimeValue, locale = "en-US") => {
  const d = new Date(toTime(value) ?? 0);
  const midnight =
    d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;
  return formatterFor(
    locale,
    midnight
      ? { day: "2-digit", month: "2-digit", year: "numeric" }
      : {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
  ).format(d);
};

/**
 * A time scale over the data, with ticks d3 picks on round moments (hours, days, months). No values or
 * one value still give a usable domain: a single moment is centred in a day.
 */
export const timeScale = ({
  values,
  range,
  domain,
  tickCount = 6,
  locale = "en-US",
}: TimeScaleOptions): TimeScale => {
  const times = values.map(toTime).filter((t): t is number => t !== null);
  let min = domain ? (toTime(domain[0]) ?? 0) : Math.min(...times);
  let max = domain ? (toTime(domain[1]) ?? 0) : Math.max(...times);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0;
    max = DAY;
  }
  if (min === max) {
    min -= DAY / 2;
    max += DAY / 2;
  }
  const scale = scaleTime().domain([min, max]).range(range);
  const span = max - min;
  const f = formatterFor(locale, tickFormatOptions(span));
  return {
    at: (value) => scale(toTime(value) ?? min),
    domain: [new Date(min), new Date(max)],
    ticks: scale.ticks(tickCount),
    format: (value) => f.format(new Date(toTime(value) ?? min)),
  };
};
