// The field panel (the toolbar's Fields button): AuraPivot's FieldList dialog rebuilt on the library.
// Drag a field from All fields, or a chip from one zone, into Filters, Rows, Columns or Values; Apply
// writes the slice to the engine. The drag is the library's DragDropProvider (a press that moves on the
// web, a long press on a phone); a tap on a field or a chip opens a menu that does the same moves, so a
// keyboard and a screen reader reach every one. The edits are the original's (`sliceEdits.ts`).
// Left out from the original, which the grid does not draw yet: calculated fields, renaming a field,
// date formats and the drill-through columns.
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DragDropProvider,
  Draggable,
  Droppable,
  IconButton,
  ListItem,
  Menu,
  ToggleButtonGroup,
  Typography,
  type DragEndEvent,
  type MenuItem,
} from "@its/glowup-ui";
import type PivotEngine from "../core/PivotEngine";
import type { InternalSlice } from "../core/PivotEngine";
import {
  MEASURE_AGGREGATIONS,
  aggregationLabel,
} from "../core/aggregation/labels";
import { hasOwn } from "../core/utils";
import type { LocalizationDictionary } from "../localization/types";
import { caption } from "../grid/caption";
import {
  ZONES,
  applyZoneDrop,
  dropTarget,
  ensureMeasuresAnchor,
  type DragPayload,
  type FieldLookup,
  type LocalSlice,
  type ZoneField,
  type ZoneId,
} from "./sliceEdits";

const DATE_PART = /^(.+)\.(Year|Quarter|Month|Week|Day|Weekday|Hour|Minute)$/;

interface FieldNode {
  uniqueName: string;
  caption: string;
  /** A date field: its parts (Year, Month, Day…) are listed under it. */
  parts?: FieldNode[];
  /** The date field itself is in a zone, only its parts are offered. */
  parentUsed?: boolean;
}

export interface FieldPanelProps {
  engine: PivotEngine;
  localization?: LocalizationDictionary;
  visible: boolean;
  onClose: () => void;
}

/** Mounted on open, so its draft starts from the engine every time and an engine event never overwrites an edit. */
const FieldPanel = (props: FieldPanelProps) =>
  props.visible ? <FieldPanelBody {...props} /> : null;

const FieldPanelBody = ({ engine, localization, onClose }: FieldPanelProps) => {
  const [slice, setSlice] = useState<LocalSlice>(() =>
    ensureMeasuresAnchor(engine.getSlice() as unknown as LocalSlice, undefined),
  );
  const [menu, setMenu] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const t = (key: string, fallback: string) =>
    caption(localization, "fieldsList", key, fallback);
  const tb = (key: string, fallback: string) =>
    caption(localization, "buttons", key, fallback);

  const meta = engine.getMetadata() as Record<
    string,
    { type?: string; caption?: string; availableAggregations?: string[] }
  >;
  const calculated = engine.getCalculatedFields();
  const isCalculated = (name: string) =>
    calculated.some((c) => c.uniqueName === name);
  const lookup: FieldLookup = {
    isKnownField: (name) => hasOwn(meta, name) || isCalculated(name),
    allowedAggsFor: (name) =>
      isCalculated(name)
        ? ["formula"]
        : meta[name]?.availableAggregations || MEASURE_AGGREGATIONS,
    isCalculated,
  };
  const captionFor = (name: string) =>
    meta[name]?.caption ||
    calculated.find((c) => c.uniqueName === name)?.caption ||
    name;

  // On rows, columns or filters: still listed, but dimmed and not draggable again. A measure stays
  // listed until each of its aggregations is placed.
  const usedAsDimension = new Set(
    [
      ...(slice.rows || []),
      ...(slice.columns || []),
      ...(slice.filters || []),
    ].map((f) => f.uniqueName),
  );

  const tree = useMemo<FieldNode[]>(() => {
    const aggs = new Map<string, Set<string>>();
    (slice.measures || []).forEach((m) => {
      if (!aggs.has(m.uniqueName)) aggs.set(m.uniqueName, new Set());
      aggs.get(m.uniqueName)!.add(m.aggregation || "");
    });
    const available = engine.getAvailableFields().filter((f) => {
      if (f.uniqueName === "Measures") return false;
      if (usedAsDimension.has(f.uniqueName)) return true;
      const used = aggs.get(f.uniqueName);
      return (
        !used || lookup.allowedAggsFor(f.uniqueName).some((a) => !used.has(a))
      );
    });
    const parts = new Map<string, FieldNode[]>();
    const top: FieldNode[] = [];
    available.forEach((f) => {
      const m = DATE_PART.exec(f.uniqueName);
      if (m && meta[m[1]]?.type === "date") {
        const label = caption(
          localization?.dates as LocalizationDictionary | undefined,
          "hierarchyParts",
          m[2].toLowerCase(),
          m[2],
        );
        parts.set(m[1], [
          ...(parts.get(m[1]) || []),
          { uniqueName: f.uniqueName, caption: label },
        ]);
      } else top.push({ uniqueName: f.uniqueName, caption: f.caption });
    });
    const nodes: FieldNode[] = top.map((f) => {
      if (meta[f.uniqueName]?.type !== "date") return f;
      const node = { ...f, parts: parts.get(f.uniqueName) || [] };
      parts.delete(f.uniqueName);
      return node;
    });
    // A date field moved to a zone keeps its remaining parts under its name.
    parts.forEach((list, parent) =>
      nodes.push({
        uniqueName: parent,
        caption: meta[parent]?.caption || parent,
        parts: list,
        parentUsed: true,
      }),
    );
    const order = engine.getFieldOrder();
    if (order.length) {
      const rank = new Map(order.map((n, i) => [n, i]));
      nodes.sort(
        (a, b) =>
          (rank.get(a.uniqueName) ?? Infinity) -
          (rank.get(b.uniqueName) ?? Infinity),
      );
    }
    return nodes;
    // The draft is what changes; the engine's fields are fixed while the panel is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slice]);

  const drop = (zone: ZoneId, payload: DragPayload, target: number | null) => {
    const next = applyZoneDrop(slice, zone, payload, target, lookup);
    if (next) setSlice(next);
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const zone = over.id as ZoneId;
    const payload = active.data as DragPayload;
    drop(
      zone,
      payload,
      dropTarget(slice[zone] || [], zone, payload, over.index),
    );
  };
  const remove = (zone: ZoneId, idx: number) =>
    setSlice({
      ...slice,
      [zone]: (slice[zone] || []).filter((_, i) => i !== idx),
    });
  const updateMeasure = (idx: number, patch: Partial<ZoneField>) =>
    setSlice({
      ...slice,
      measures: (slice.measures || []).map((m, i) =>
        i === idx ? { ...m, ...patch } : m,
      ),
    });

  // The zones a field or chip can move to, as menu items.
  const moveItems = (payload: DragPayload): MenuItem[] =>
    ZONES.filter((z) => z.id !== payload.source).map((z) => ({
      id: `move-${z.id}`,
      label: t(z.labelKey, z.fallback),
      icon: "arrow-right",
      onClick: () => drop(z.id, payload, null),
    }));

  const axis: "rows" | "columns" = (slice.rows || []).some(
    (f) => f.uniqueName === "Measures",
  )
    ? "rows"
    : "columns";
  const visibleMeasures = (slice.measures || []).filter(
    (m) => !m.hidden,
  ).length;
  const canApply = (slice.measures || []).length === 0 || visibleMeasures > 0;

  const apply = () => {
    engine.setSlice(slice as Partial<InternalSlice>);
    onClose();
  };

  const fieldRow = (node: FieldNode, depth: number) => {
    const used = usedAsDimension.has(node.uniqueName);
    const draggable = !used && !node.parentUsed;
    const payload: DragPayload = { source: "all", uniqueName: node.uniqueName };
    const key = `all:${node.uniqueName}`;
    const open = expanded.has(node.uniqueName);
    const row = (
      <Draggable
        id={key}
        data={payload}
        disabled={!draggable}
        testID={`pivot-field-${node.uniqueName}`}
      >
        <ListItem
          primaryText={node.caption}
          icon={node.parts ? "calendar-month-outline" : "drag-vertical"}
          dimmed={!draggable}
          onClick={draggable ? () => setMenu(key) : undefined}
          itemContainerStyle={{ paddingLeft: 16 + depth * 24 }}
          action={
            node.parts && node.parts.length > 0 ? (
              <IconButton
                icon={open ? "chevron-down" : "chevron-right"}
                accessibilityLabel={node.caption}
                size="small"
                onClick={() => {
                  const next = new Set(expanded);
                  if (open) next.delete(node.uniqueName);
                  else next.add(node.uniqueName);
                  setExpanded(next);
                }}
              />
            ) : undefined
          }
        />
      </Draggable>
    );
    return (
      <View key={node.uniqueName}>
        {draggable ? (
          <Menu
            anchor={row}
            visible={menu === key}
            onClose={() => setMenu(null)}
            items={moveItems(payload)}
          />
        ) : (
          row
        )}
        {open && node.parts?.map((part) => fieldRow(part, depth + 1))}
      </View>
    );
  };

  const chip = (zone: ZoneId, item: ZoneField, idx: number) => {
    const payload: DragPayload = {
      source: zone,
      uniqueName: item.uniqueName,
      idx,
    };
    const key = `${zone}:${idx}`;
    const isMeasure = zone === "measures";
    const label = isMeasure
      ? `${captionFor(item.uniqueName)} · ${aggregationLabel(localization, item.aggregation || "")}`
      : captionFor(item.uniqueName);
    // A field may be a measure several times, once per aggregation: a chip offers the ones its
    // siblings have not taken.
    const taken = new Set(
      (slice.measures || [])
        .filter((m, i) => m.uniqueName === item.uniqueName && i !== idx)
        .map((m) => m.aggregation),
    );
    const allowed = isCalculated(item.uniqueName)
      ? ["formula"]
      : item.availableAggregations || MEASURE_AGGREGATIONS;
    const items: MenuItem[] = isMeasure
      ? [
          ...allowed
            .filter((a) => a === item.aggregation || !taken.has(a))
            .map((a) => ({
              id: a,
              label: aggregationLabel(localization, a),
              onClick: () => updateMeasure(idx, { aggregation: a }),
            })),
          {
            id: "hide",
            label: item.hidden
              ? t("showMeasure", "Show measure")
              : t("hideMeasure", "Hide measure"),
            icon: item.hidden ? "eye-outline" : "eye-off-outline",
            dividerAbove: true,
            onClick: () => updateMeasure(idx, { hidden: !item.hidden }),
          },
          ...moveItems(payload),
        ]
      : moveItems(payload);
    return (
      <Draggable
        key={`${item.uniqueName}:${item.aggregation ?? ""}`}
        id={`${key}:${item.uniqueName}:${item.aggregation ?? ""}`}
        data={payload}
      >
        <Menu
          anchor={
            <Chip
              label={label}
              icon={item.hidden ? "eye-off-outline" : undefined}
              variant={item.hidden ? "outlined" : "tonal"}
              onClick={() => setMenu(key)}
              onClose={() => remove(zone, idx)}
            />
          }
          visible={menu === key}
          onClose={() => setMenu(null)}
          items={items}
          selected={isMeasure ? [item.aggregation || ""] : undefined}
        />
      </Draggable>
    );
  };

  const zone = (id: ZoneId, labelKey: string, fallback: string) => {
    const items = slice[id] || [];
    const empty = items.every((f) => f.uniqueName === "Measures");
    return (
      <Droppable
        key={id}
        id={id}
        orientation="horizontal"
        testID={`pivot-zone-${id}`}
      >
        {({ isOver }) => (
          <Box
            radius="medium"
            padding={16}
            gap={8}
            borderWidth={1}
            borderColor={isOver ? "primary" : "outlineVariant"}
            background={
              isOver ? "surfaceContainerHighest" : "surfaceContainerLow"
            }
            style={{ minHeight: 96 }}
          >
            <Typography variant="labelLarge" color="onSurfaceVariant">
              {t(labelKey, fallback)}
            </Typography>
            <Box variant="flex" wrap gap={8}>
              {empty && (
                <Typography variant="bodyMedium" color="onSurfaceVariant">
                  {t("dropField", "Drop field here")}
                </Typography>
              )}
              {items.map((item, idx) =>
                item.uniqueName === "Measures" ? null : chip(id, item, idx),
              )}
            </Box>
          </Box>
        )}
      </Droppable>
    );
  };

  return (
    <Dialog
      visible
      onClose={onClose}
      title={t("title", "Fields")}
      overline={t("subtitle", "Drag and drop fields to arrange them")}
      width="lg"
      dividers
      scrollable
      testID="pivot-fields"
      leadingActions={
        !canApply ? (
          <Typography variant="bodySmall" color="error">
            {t(
              "atLeastOneVisibleMeasure",
              "At least one measure must be visible.",
            )}
          </Typography>
        ) : undefined
      }
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            {tb("cancel", "Cancel")}
          </Button>
          <Button
            onClick={apply}
            disabled={!canApply}
            testID="pivot-fields-apply"
          >
            {tb("apply", "Apply")}
          </Button>
        </>
      }
    >
      <DragDropProvider onDragEnd={onDragEnd}>
        <Box variant="flex" wrap gap={16} align="flex-start">
          <View style={{ flexGrow: 1, flexBasis: 240, gap: 8 }}>
            <Typography variant="labelLarge" color="onSurfaceVariant">
              {t("allFields", "All fields")}
            </Typography>
            <Box radius="medium" borderWidth={1} borderColor="outlineVariant">
              {tree.map((node) => fieldRow(node, 0))}
            </Box>
          </View>
          <View style={{ flexGrow: 2, flexBasis: 320, gap: 16 }}>
            <Box
              variant="flex"
              wrap
              gap={8}
              align="center"
              justify="space-between"
            >
              <Typography variant="labelLarge" color="onSurfaceVariant">
                {t("showTotals", "Show totals")}
              </Typography>
              <ToggleButtonGroup
                value={axis}
                onValueChange={(value: "rows" | "columns") => {
                  if (!value || value === axis) return;
                  const strip = (list?: ZoneField[]) =>
                    (list || []).filter((f) => f.uniqueName !== "Measures");
                  setSlice(
                    ensureMeasuresAnchor(
                      {
                        ...slice,
                        rows: strip(slice.rows),
                        columns: strip(slice.columns),
                      },
                      value,
                    ),
                  );
                }}
                options={[
                  { value: "rows", label: t("perRow", "Per row") },
                  { value: "columns", label: t("perColumn", "Per column") },
                ]}
              />
            </Box>
            {ZONES.map((z) => zone(z.id, z.labelKey, z.fallback))}
          </View>
        </Box>
      </DragDropProvider>
    </Dialog>
  );
};

export default FieldPanel;
