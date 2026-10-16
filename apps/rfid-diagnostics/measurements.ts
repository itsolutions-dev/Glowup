import type { HoneywellDiagnostic } from "@its/rfid-honeywell";

/**
 * What the spike measures, gathered from the module's raw events: the
 * answers the plan's "not verified" list waits for.
 */
export interface Measurements {
  since: number;
  events: number;
  reads: {
    batches: number;
    reads: number;
    largestBatch: number;
    /** Threads the SDK delivered reads on. */
    threads: string[];
    rssiMin: number | null;
    rssiMax: number | null;
    readCountMax: number;
    /** Whether any EPC arrived with lowercase hex. */
    lowercaseEpc: boolean;
    /** Whether the SDK's tag time was 0 (the module then uses the arrival time). */
    zeroTime: boolean;
    firstAt: number | null;
    lastAt: number | null;
    sample: Record<string, unknown> | null;
  };
  /** The SDK's own locate value (`onReceivedFindingTag`), beside the module's RSSI. */
  findingTag: { count: number; min: number | null; max: number | null };
  battery: string[];
  syncReads: { windowMs: number; size: number }[];
  /** Every device a discovery heard, filtered or not. */
  adverts: Record<
    string,
    {
      name: string | null;
      rssi: number;
      serviceUuids: string[];
      manufacturerIds: number[];
      likelyReader: boolean;
    }
  >;
  /** Connection and trigger events, in order. */
  timeline: { type: string; at: number; detail: string }[];
  log: HoneywellDiagnostic[];
}

const TIMELINE = new Set([
  "managerCreated",
  "connectStarted",
  "connectThrew",
  "deviceConnected",
  "readerCreated",
  "deviceDisconnected",
  "trigger",
  "triggerMode",
  "triggerModeFailed",
]);
const LOG_SIZE = 200;
const TIMELINE_SIZE = 100;

export function emptyMeasurements(now = Date.now()): Measurements {
  return {
    since: now,
    events: 0,
    reads: {
      batches: 0,
      reads: 0,
      largestBatch: 0,
      threads: [],
      rssiMin: null,
      rssiMax: null,
      readCountMax: 0,
      lowercaseEpc: false,
      zeroTime: false,
      firstAt: null,
      lastAt: null,
      sample: null,
    },
    findingTag: { count: 0, min: null, max: null },
    battery: [],
    syncReads: [],
    adverts: {},
    timeline: [],
    log: [],
  };
}

const num = (value: unknown) => (typeof value === "number" ? value : null);
const min = (a: number | null, b: number) => (a === null ? b : Math.min(a, b));
const max = (a: number | null, b: number) => (a === null ? b : Math.max(a, b));

function detailOf(event: HoneywellDiagnostic): string {
  const { type: _type, at: _at, thread: _thread, ...rest } = event;
  return JSON.stringify(rest);
}

/** `measurements` with `event` counted in; the input is left as it was. */
export function record(
  measurements: Measurements,
  event: HoneywellDiagnostic,
): Measurements {
  const next: Measurements = {
    ...measurements,
    events: measurements.events + 1,
    log: [...measurements.log, event].slice(-LOG_SIZE),
  };
  switch (event.type) {
    case "tags": {
      const size = num(event.size) ?? 0;
      const sample = (event.sample ?? null) as Record<string, unknown> | null;
      const rssi = num(sample?.rssi);
      const epc = typeof sample?.epc === "string" ? sample.epc : "";
      const reads = measurements.reads;
      next.reads = {
        batches: reads.batches + 1,
        reads: reads.reads + size,
        largestBatch: Math.max(reads.largestBatch, size),
        threads: reads.threads.includes(event.thread)
          ? reads.threads
          : [...reads.threads, event.thread],
        rssiMin: rssi === null ? reads.rssiMin : min(reads.rssiMin, rssi),
        rssiMax: rssi === null ? reads.rssiMax : max(reads.rssiMax, rssi),
        readCountMax: Math.max(reads.readCountMax, num(sample?.readCount) ?? 0),
        lowercaseEpc: reads.lowercaseEpc || /[a-f]/.test(epc),
        zeroTime: reads.zeroTime || sample?.time === 0,
        firstAt: reads.firstAt ?? event.at,
        lastAt: event.at,
        sample: sample ?? reads.sample,
      };
      break;
    }
    case "findingTag": {
      const value = num(event.value);
      if (value !== null) {
        const finding = measurements.findingTag;
        next.findingTag = {
          count: finding.count + 1,
          min: min(finding.min, value),
          max: max(finding.max, value),
        };
      }
      break;
    }
    case "battery": {
      const raw = String(event.raw ?? "");
      if (!measurements.battery.includes(raw)) {
        next.battery = [...measurements.battery, raw];
      }
      break;
    }
    case "syncRead":
      next.syncReads = [
        ...measurements.syncReads,
        { windowMs: num(event.windowMs) ?? 0, size: num(event.size) ?? 0 },
      ];
      break;
    case "advert": {
      const id = String(event.id ?? "");
      next.adverts = {
        ...measurements.adverts,
        [id]: {
          name: typeof event.name === "string" ? event.name : null,
          rssi: num(event.rssi) ?? 0,
          serviceUuids: Array.isArray(event.serviceUuids)
            ? (event.serviceUuids as string[])
            : [],
          manufacturerIds: Array.isArray(event.manufacturerIds)
            ? (event.manufacturerIds as number[])
            : [],
          likelyReader: event.likelyReader === true,
        },
      };
      break;
    }
  }
  if (TIMELINE.has(event.type)) {
    next.timeline = [
      ...measurements.timeline,
      { type: event.type, at: event.at, detail: detailOf(event) },
    ].slice(-TIMELINE_SIZE);
  }
  return next;
}

/** Batches per second over the time reads arrived. */
export function batchRate(measurements: Measurements): number | null {
  const { batches, firstAt, lastAt } = measurements.reads;
  if (batches < 2 || firstAt === null || lastAt === null || lastAt <= firstAt) {
    return null;
  }
  return (batches - 1) / ((lastAt - firstAt) / 1000);
}

/** What the team sends back: the measurements and the context they were taken in. */
export function toReport(
  measurements: Measurements,
  context: Record<string, unknown>,
) {
  return {
    generatedAt: new Date().toISOString(),
    context,
    readsPerSecondBatches: batchRate(measurements),
    ...measurements,
  };
}
