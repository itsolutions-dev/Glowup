// The zones of the field panel and the pure edits it applies to its draft slice: a port of AuraPivot's
// `components/FieldList/sliceEdits.ts` (see docs/pivot-upstream.md). The drag itself is the library's
// DragDropProvider, not the HTML5 drag of the original, so there is no drag payload to write or read
// back: the payload travels as the Draggable's data. `dropTarget` turns the library's drop index into
// the chip index the original's edits take.

export type ZoneId = "filters" | "rows" | "columns" | "measures";

/** A slice entry as the zones hold it: a field, a measure or a filter. */
export interface ZoneField {
  uniqueName: string;
  aggregation?: string;
  hidden?: boolean;
  availableAggregations?: string[];
  sort?: string;
  caption?: string;
  members?: unknown[];
  exclude?: unknown[];
  value?: unknown;
  range?: { min?: unknown; max?: unknown };
}

/** The panel's draft: every zone as a list of entries, the rest of the slice kept as it was. */
export type LocalSlice = Partial<Record<ZoneId, ZoneField[]>> &
  Record<string, unknown>;

/** What is being dragged: a field of the list, or the chip at `idx` of a zone. */
export type DragPayload =
  | { source: "all"; uniqueName: string }
  | { source: ZoneId; uniqueName: string; idx: number };

export const ZONES: { id: ZoneId; labelKey: string; fallback: string }[] = [
  { id: "filters", labelKey: "filters", fallback: "Filters" },
  { id: "rows", labelKey: "rows", fallback: "Rows" },
  { id: "columns", labelKey: "columns", fallback: "Columns" },
  { id: "measures", labelKey: "values", fallback: "Values" },
];

/** The measure axis needs an anchor field on one of the two zones. */
export const ensureMeasuresAnchor = (
  s: LocalSlice,
  measuresAxis: "rows" | "columns" | undefined,
): LocalSlice => {
  const inRows = (s.rows || []).some((f) => f.uniqueName === "Measures");
  const inCols = (s.columns || []).some((f) => f.uniqueName === "Measures");
  if (inRows || inCols) return s;
  // Default placement honors `measuresAxis`; columns otherwise.
  if (measuresAxis === "rows") {
    return { ...s, rows: [...(s.rows || []), { uniqueName: "Measures" }] };
  }
  return { ...s, columns: [...(s.columns || []), { uniqueName: "Measures" }] };
};

const without = (
  list: ZoneField[] | undefined,
  uniqueName: string,
): ZoneField[] => (list || []).filter((f) => f.uniqueName !== uniqueName);

/** Drop a field from every zone of the draft. */
export const stripFromSlice = (
  s: LocalSlice,
  uniqueName: string,
): LocalSlice => ({
  ...s,
  rows: without(s.rows, uniqueName),
  columns: without(s.columns, uniqueName),
  measures: without(s.measures, uniqueName),
  filters: without(s.filters, uniqueName),
});

/** What a drop needs to know about a field; the panel asks the engine. */
export interface FieldLookup {
  /** A drop may only name a known field. */
  isKnownField: (uniqueName: string) => boolean;
  /** The aggregations a field dragged into Values can take. */
  allowedAggsFor: (uniqueName: string) => readonly string[];
  /** A calculated field aggregates as `formula`. */
  isCalculated: (uniqueName: string) => boolean;
}

/**
 * The chip index a drop lands before, in the zone's own array, from the library's drop index (the
 * position among the zone's chips with the dragged one left out); null to append. The Measures
 * anchor has a slot in the array but no chip.
 */
export const dropTarget = (
  items: readonly ZoneField[],
  zone: ZoneId,
  payload: DragPayload,
  index: number,
): number | null => {
  const chips = items
    .map((_, i) => i)
    .filter(
      (i) =>
        items[i].uniqueName !== "Measures" &&
        !(payload.source === zone && i === payload.idx),
    );
  return index < chips.length ? chips[index] : null;
};

/**
 * Applies a drop on `zone`. `targetIdx` is the chip the payload was dropped on (insert before it),
 * or null for the end of the zone. Returns the next slice, or null when the drop does nothing.
 */
export const applyZoneDrop = (
  slice: LocalSlice,
  zone: ZoneId,
  payload: DragPayload,
  targetIdx: number | null,
  { isKnownField, allowedAggsFor, isCalculated }: FieldLookup,
): LocalSlice | null => {
  const { source, uniqueName } = payload;
  const sourceIdx = payload.source === "all" ? null : payload.idx;
  // The Measures anchor's axis is set by the "Show totals" toggle alone.
  if (uniqueName === "Measures") return null;
  // Act only on a known field or, for a chip move, on the chip that really sits at that index.
  const moving: ZoneField | undefined =
    payload.source === "all"
      ? { uniqueName }
      : slice[payload.source]?.[payload.idx];
  if (moving?.uniqueName !== uniqueName) return null;
  if (source === "all" && !isKnownField(uniqueName)) return null;

  // Into measures from elsewhere: the first aggregation no other entry of the same field uses
  // yet. With all of them in use, the drop does nothing.
  let chosenAgg: string | undefined;
  if (zone === "measures" && source !== "measures") {
    const usedAgg = new Set(
      (slice.measures || [])
        .filter((m) => m.uniqueName === uniqueName)
        .map((m) => m.aggregation),
    );
    chosenAgg = allowedAggsFor(uniqueName).find((a) => !usedAgg.has(a));
    if (!chosenAgg) return null;
  }

  const next: LocalSlice = { ...slice };
  if (source !== "all") {
    next[source] = (next[source] || []).filter((_, i) => i !== sourceIdx);
  }
  const insertInto = (list: ZoneField[], entry: ZoneField): ZoneField[] => {
    let at = targetIdx ?? list.length;
    // Moving down within one zone: taking the chip out shifted the target up by one.
    if (
      source === zone &&
      sourceIdx != null &&
      targetIdx != null &&
      sourceIdx < targetIdx
    ) {
      at = targetIdx - 1;
    }
    const out = [...list];
    out.splice(at, 0, entry);
    return out;
  };

  if (zone === "filters") {
    // Filters never strip from rows/columns/measures and never duplicate. A moved filter chip
    // keeps its predicate, and so does a field dragged in that already is a filter.
    const existing =
      source === "filters"
        ? moving
        : (next.filters || []).find((f) => f.uniqueName === uniqueName);
    next.filters = insertInto(
      without(next.filters, uniqueName),
      existing || { uniqueName },
    );
  } else if (zone === "measures") {
    // One entry per aggregation of the same field, so siblings stay; a field arriving from
    // elsewhere leaves rows / columns.
    if (source !== "measures") {
      next.rows = without(next.rows, uniqueName);
      next.columns = without(next.columns, uniqueName);
    }
    next.measures = insertInto(
      next.measures || [],
      source === "measures"
        ? {
            ...moving,
            aggregation:
              moving.aggregation ||
              (isCalculated(uniqueName) ? "formula" : "sum"),
          }
        : { uniqueName, aggregation: chosenAgg },
    );
  } else {
    // Rows / columns: a dimension here, so it leaves the other axis and every measure entry.
    if (source !== zone) {
      next.rows = without(next.rows, uniqueName);
      next.columns = without(next.columns, uniqueName);
      next.measures = without(next.measures, uniqueName);
    }
    next[zone] = insertInto(without(next[zone], uniqueName), { uniqueName });
  }
  return next;
};
