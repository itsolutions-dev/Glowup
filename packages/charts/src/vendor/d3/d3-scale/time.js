import {
  timeYear,
  timeMonth,
  timeWeek,
  timeDay,
  timeHour,
  timeMinute,
  timeSecond,
  timeTicks,
  timeTickInterval,
} from "../d3-time/index.js";
import continuous, { copy } from "./continuous.js";
import { initRange } from "./init.js";
import nice from "./nice.js";

function date(t) {
  return new Date(t);
}

function number(t) {
  return t instanceof Date ? +t : +new Date(+t);
}

export function calendar(
  ticks,
  tickInterval,
  year,
  month,
  week,
  day,
  hour,
  minute,
  second,
) {
  var scale = continuous(),
    invert = scale.invert,
    domain = scale.domain;

  scale.invert = function (y) {
    return new Date(invert(y));
  };

  scale.domain = function (_) {
    return arguments.length
      ? domain(Array.from(_, number))
      : domain().map(date);
  };

  scale.ticks = function (interval) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], interval == null ? 10 : interval);
  };

  scale.nice = function (interval) {
    var d = domain();
    if (!interval || typeof interval.range !== "function")
      interval = tickInterval(
        d[0],
        d[d.length - 1],
        interval == null ? 10 : interval,
      );
    return interval ? domain(nice(d, interval)) : scale;
  };

  scale.copy = function () {
    return copy(
      scale,
      calendar(
        ticks,
        tickInterval,
        year,
        month,
        week,
        day,
        hour,
        minute,
        second,
      ),
    );
  };

  return scale;
}

export default function time() {
  return initRange.apply(
    calendar(
      timeTicks,
      timeTickInterval,
      timeYear,
      timeMonth,
      timeWeek,
      timeDay,
      timeHour,
      timeMinute,
      timeSecond,
    ).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]),
    arguments,
  );
}
