/**
 * Android (7 and later) silently ignores an app that starts more than five
 * scans in 30 seconds: the scan "runs" and finds nothing, with no error. This
 * counts the starts and says how long the next one must wait to stay inside
 * the limit; a little margin covers the two clocks.
 */
export interface StartThrottle {
  /** Milliseconds to wait before the next start; 0 to start now. */
  delay(): number;
  /** Counts a start made now. */
  record(): void;
}

export const ANDROID_SCAN_LIMIT = 5;
export const ANDROID_SCAN_WINDOW = 30_000;
const MARGIN = 500;

export function createStartThrottle(
  limit = ANDROID_SCAN_LIMIT,
  window = ANDROID_SCAN_WINDOW,
  now: () => number = Date.now,
): StartThrottle {
  let starts: number[] = [];

  function recent(): number[] {
    const since = now() - window - MARGIN;
    starts = starts.filter((time) => time > since);
    return starts;
  }

  return {
    delay() {
      const kept = recent();
      if (kept.length < limit) return 0;
      // The oldest start that keeps the count at the limit must leave the window.
      const oldest = kept[kept.length - limit];
      return Math.max(0, oldest + window + MARGIN - now());
    },
    record() {
      recent();
      starts.push(now());
    },
  };
}
