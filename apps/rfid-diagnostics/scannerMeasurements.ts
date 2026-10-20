/** A raw scanner SDK event, as the vendor module sends it while diagnostics are on. */
export interface ScannerDiagnostic {
  type: string;
  at: number;
  thread: string;
  [detail: string]: unknown;
}

/** What each symbology looked like as the SDK reported it. */
export interface SymbologySeen {
  codeId: string | null;
  aimId: string | null;
  charsets: string[];
  count: number;
  /** The SDK's own timestamp string, the last one seen. */
  timestamp: string | null;
  /** The last decoded text, escaped, to see control characters. */
  sample: string;
}

export interface ScannerMeasurements {
  startedAt: number;
  events: number;
  reads: number;
  /** Decodes the SDK reported as failed (a trigger without a code). */
  noReads: number;
  /** By code id and AIM id. */
  symbologies: Record<string, SymbologySeen>;
  threads: string[];
  /** Trigger events as the SDK reported them, whether claimed or not. */
  triggers: { pressed: number; released: number; whileReleased: number };
  /** The claim's life: created, claimed, released, applied, devices. */
  timeline: { type: string; at: number; detail: string }[];
  log: ScannerDiagnostic[];
}

const LOG_SIZE = 200;
const TIMELINE_SIZE = 60;
const TIMELINE_TYPES = new Set([
  "managerCreated",
  "readerCreated",
  "claimed",
  "released",
  "releaseFailed",
  "applied",
  "device",
  "triggerFailed",
]);

export function emptyScannerMeasurements(
  now = Date.now(),
): ScannerMeasurements {
  return {
    startedAt: now,
    events: 0,
    reads: 0,
    noReads: 0,
    symbologies: {},
    threads: [],
    triggers: { pressed: 0, released: 0, whileReleased: 0 },
    timeline: [],
    log: [],
  };
}

const text = (value: unknown) => (typeof value === "string" ? value : null);

function detailOf(event: ScannerDiagnostic): string {
  const { type: _type, at: _at, thread: _thread, ...detail } = event;
  return JSON.stringify(detail);
}

/** The measurements with one more event in them. */
export function recordScanner(
  m: ScannerMeasurements,
  event: ScannerDiagnostic,
): ScannerMeasurements {
  const next: ScannerMeasurements = {
    ...m,
    events: m.events + 1,
    log: [...m.log, event].slice(-LOG_SIZE),
  };
  if (event.thread && !m.threads.includes(event.thread)) {
    next.threads = [...m.threads, event.thread];
  }
  if (event.type === "read") {
    const codeId = text(event.codeId);
    const aimId = text(event.aimId);
    const key = `${codeId ?? "?"} ${aimId ?? "?"}`;
    const seen = m.symbologies[key];
    const charset = text(event.charset);
    next.reads = m.reads + 1;
    next.symbologies = {
      ...m.symbologies,
      [key]: {
        codeId,
        aimId,
        charsets:
          charset && !seen?.charsets.includes(charset)
            ? [...(seen?.charsets ?? []), charset]
            : (seen?.charsets ?? []),
        count: (seen?.count ?? 0) + 1,
        timestamp: text(event.timestamp),
        sample: JSON.stringify(text(event.data) ?? ""),
      },
    };
  } else if (event.type === "noRead") {
    next.noReads = m.noReads + 1;
  } else if (event.type === "trigger") {
    const pressed = event.pressed === true;
    next.triggers = {
      pressed: m.triggers.pressed + (pressed ? 1 : 0),
      released: m.triggers.released + (pressed ? 0 : 1),
      whileReleased: m.triggers.whileReleased + (event.claimed ? 0 : 1),
    };
  }
  if (TIMELINE_TYPES.has(event.type)) {
    next.timeline = [
      ...m.timeline,
      { type: event.type, at: event.at, detail: detailOf(event) },
    ].slice(-TIMELINE_SIZE);
  }
  return next;
}

export function toScannerReport(
  m: ScannerMeasurements,
  context: Record<string, unknown>,
) {
  return { kind: "barcode-scanner", context, ...m };
}
