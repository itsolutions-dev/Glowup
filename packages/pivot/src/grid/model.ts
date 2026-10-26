// The grid of a pivot without any drawing: what the header, the rows and the cells say. The rules
// (what a cell shows, which rows can open, the captions of the totals) are those of AuraPivot's
// compact grid (components/PivotTable/PivotTable.tsx there), so both show the same report alike.
import type { InternalSlice, FormatSnapshot } from "../core/PivotEngine";
import {
  measureKeyOf,
  type AxisLeaf,
  type ComputedMatrix,
} from "../core/matrix/MatrixComputer";
import {
  formatNumberWithFormat,
  getValuesSection,
  type FormatObject,
} from "../core/format/CellFormatter";
import type { LocalizationDictionary } from "../localization/types";
import { INDENT } from "./layout";

export interface GridColumn {
  key: string;
  nodeKey: string;
  label: string;
  isTotal: boolean;
  canToggle: boolean;
  isExpanded: boolean;
}

export interface GridCell {
  key: string;
  text: string;
  value: number | null;
  error: string | null;
}

export interface GridRow {
  key: string;
  nodeKey: string;
  label: string;
  depth: number;
  indent: number;
  isTotal: boolean;
  isGrandTotal: boolean;
  isSubtotal: boolean;
  canToggle: boolean;
  isExpanded: boolean;
  cells: GridCell[];
}

export interface GridModel {
  columns: GridColumn[];
  rows: GridRow[];
  /** No data row reaches the report (none loaded, or the filters leave none), or nothing to lay out. */
  empty: boolean;
}

export interface GridModelInput {
  matrix: ComputedMatrix;
  slice: InternalSlice;
  format: FormatSnapshot;
  metadata?: Record<string, { caption?: string }>;
  locale?: string;
  localization?: LocalizationDictionary;
}

const section = (t: unknown, name: string): Record<string, string> => {
  const value = (t as Record<string, unknown> | null | undefined)?.[name];
  return value && typeof value === "object"
    ? (value as Record<string, string>)
    : {};
};

/** The `grid` captions of a localization dictionary (an absent one reads as empty). */
export const gridStrings = (localization?: LocalizationDictionary) =>
  section(localization, "grid");

const RATIOS = new Set(["ratioTotal", "currentRatio"]);

export const buildGridModel = ({
  matrix,
  slice,
  format,
  metadata,
  locale,
  localization,
}: GridModelInput): GridModel => {
  const grid = section(localization, "grid");

  const hidden = new Set<string>();
  (slice.measures || []).forEach((m) => {
    if (m?.hidden && m.uniqueName) hidden.add(measureKeyOf(m));
  });
  const visible = (leaf: AxisLeaf) =>
    !(leaf.measureKey && hidden.has(leaf.measureKey));

  // A ratio on the grand-total column is always 100%: when it is the only measure, drop that column.
  const shown = (matrix.measures || []).filter(
    (m) => m.aggregation !== "formula" && !hidden.has(measureKeyOf(m)),
  );
  const onlyCurrentRatio =
    shown.length === 1 && shown[0].aggregation === "currentRatio";

  const colLeaves = matrix.colLeaves.filter(
    (c) => visible(c) && !(onlyCurrentRatio && c.isTotal && c.depth === -1),
  );
  const rowLeaves = matrix.rowLeaves.filter(visible);

  const totalCaption = (() => {
    if (matrix.measuresOnColumns) return grid.total || "Total";
    const measures = matrix.measures || [];
    if (measures.length === 0) return grid.grandTotal || "Grand Total";
    return measures
      .map(
        (m) =>
          m.grandTotalCaption ||
          m.caption ||
          metadata?.[m.uniqueName]?.caption ||
          m.uniqueName,
      )
      .join(" · ");
  })();

  const subtotalCaption = (row: AxisLeaf) => {
    const template = grid.subtotalCaptionTemplate || "{member} Total";
    const labelled = template.replace(
      "{member}",
      row.memberCaption ?? row.caption,
    );
    return row.measureCaption
      ? `${labelled} — ${row.measureCaption}`
      : labelled;
  };

  const owns = (leaf: AxisLeaf) =>
    leaf.measureKey == null || leaf.isFirstMeasure === true;
  const hasChildren = (leaf: AxisLeaf) =>
    !!leaf.children && leaf.children.length > 0;

  const columns: GridColumn[] = colLeaves.map((c) => ({
    key: c.key,
    nodeKey: c.nodeKey || c.key,
    label: c.caption,
    isTotal: !!c.isTotal,
    canToggle: hasChildren(c) && !c.isTotal && owns(c),
    isExpanded: c.isExpanded !== false,
  }));

  const cellOf = (row: AxisLeaf, col: AxisLeaf): GridCell => {
    const key = `${row.key}::${col.key}`;
    const cell = matrix.cells.get(key);
    const measureKey = cell?.measureKey ?? null;
    const aggregation = measureKey ? measureKey.split(":")[1] : null;
    // FormatSnapshot is the engine's view of the same object; AuraPivot casts it the same way.
    let values = getValuesSection(
      format as unknown as FormatObject,
      measureKey,
    );
    if (aggregation && RATIOS.has(aggregation) && values) {
      const byMeasure = format?.valuesByMeasure || {};
      const override =
        (measureKey ? byMeasure[measureKey] : undefined) ||
        byMeasure[String(measureKey).split(":")[0]];
      const userSet =
        !!override &&
        Object.prototype.hasOwnProperty.call(override, "percentage");
      if (!userSet) values = { ...values, percentage: true };
    }
    const empty =
      !cell ||
      (aggregation === "currentRatio" && !!col.isTotal) ||
      !!row.totalsHidden ||
      !!col.totalsHidden;
    return {
      key,
      text: empty
        ? ""
        : formatNumberWithFormat(cell.value, values, locale) ||
          cell.formattedValue,
      value: cell?.value ?? null,
      error: cell?.error || null,
    };
  };

  const rows: GridRow[] = rowLeaves.map((r) => {
    const isGrandTotal = !!r.isTotal && r.depth === -1;
    const isSubtotal = !!r.isSubtotal;
    return {
      key: r.key,
      nodeKey: r.nodeKey || r.key,
      label:
        r.isTotal && !r.measureKey
          ? totalCaption
          : isSubtotal
            ? subtotalCaption(r)
            : r.caption,
      depth: r.depth,
      indent: Math.max(0, r.depth) * INDENT,
      isTotal: !!r.isTotal,
      isGrandTotal,
      isSubtotal,
      canToggle: hasChildren(r) && owns(r) && !r.isTotal && !isSubtotal,
      isExpanded: r.isExpanded !== false,
      cells: colLeaves.map((c) => cellOf(r, c)),
    };
  });

  return {
    columns,
    rows,
    empty:
      (matrix.sourceRows || []).length === 0 ||
      rows.length === 0 ||
      columns.length === 0,
  };
};
