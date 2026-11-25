// The filters of the report, above the grid: AuraPivot's FilterBar rebuilt on the library. One chip per
// field in the Filters zone, with what it keeps; a tap opens the editor for that field (a set of values
// picked from the data, one value, or a range, by the field's type), the cross removes the filter.
import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Button,
  Checkbox,
  Chip,
  DatePicker,
  Dialog,
  Input,
  SearchBar,
  ToggleButtonGroup,
  Typography,
  type DateRange,
} from "@its/glowup-ui";
import type PivotEngine from "../core/PivotEngine";
import {
  distinctValuesFor,
  isFilterActive,
  type FilterEntry,
} from "../core/slice/FilterEngine";
import { hasOwn } from "../core/utils";
import { useEngineVersion } from "../hooks/useEngineVersion";
import type { LocalizationDictionary } from "../localization/types";
import { caption } from "../grid/caption";

export const FILTER_BAR_HEIGHT = 48;

type Mode = "single" | "multi" | "range";

// The editor's modes by field type, as in the original.
const MODES: Record<string, Mode[]> = {
  string: ["single", "multi"],
  number: ["single", "multi", "range"],
  date: ["single", "range"],
  time: ["range"],
  month: ["single", "multi"],
  weekday: ["single", "multi"],
};
const modesFor = (type: string) =>
  hasOwn(MODES, type) ? MODES[type] : MODES.string;

const initialMode = (filter: FilterEntry, type: string): Mode => {
  const modes = modesFor(type);
  if (filter.range) return "range";
  if (filter.members?.length) {
    if (modes.includes("multi")) return "multi";
    if (filter.members.length === 1 && modes.includes("single"))
      return "single";
  }
  if (filter.value != null && filter.value !== "") return "single";
  return modes[0];
};

/** What a filter keeps, in a few words. */
export const filterSummary = (
  filter: FilterEntry,
  localization?: LocalizationDictionary,
): string => {
  const values = caption(localization, "filterBar", "values", "values");
  const { range } = filter;
  if (range && (range.min != null || range.max != null)) {
    if (range.min != null && range.max != null)
      return `${range.min} … ${range.max}`;
    return range.min != null ? `≥ ${range.min}` : `≤ ${range.max}`;
  }
  if (filter.members?.length)
    return filter.members.length === 1
      ? String(filter.members[0])
      : `${filter.members.length} ${values}`;
  if (filter.value != null && filter.value !== "") return `= ${filter.value}`;
  if (filter.exclude?.length)
    return `≠ ${filter.exclude.length === 1 ? filter.exclude[0] : `${filter.exclude.length} ${values}`}`;
  if (filter.search) return `“${filter.search}”`;
  return caption(localization, "filterBar", "all", "All");
};

/** A calendar day as the filters compare it, `yyyy-mm-dd` in local time. */
const day = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const asDate = (value: unknown) => {
  if (!value) return null;
  const ms = Date.parse(String(value));
  return Number.isFinite(ms) ? new Date(ms) : null;
};

const FilterEditor = ({
  engine,
  filter,
  localization,
  onApply,
  onClose,
}: {
  engine: PivotEngine;
  filter: FilterEntry;
  localization?: LocalizationDictionary;
  onApply: (next: FilterEntry) => void;
  onClose: () => void;
}) => {
  const meta = engine.getMetadata()[filter.uniqueName];
  const type = meta?.type || "string";
  const isDate = type === "date";
  const t = (key: string, fallback: string) =>
    caption(localization, "filterEditor", key, fallback);
  const tb = (key: string, fallback: string) =>
    caption(localization, "buttons", key, fallback);
  const [mode, setMode] = useState<Mode>(() => initialMode(filter, type));
  const [members, setMembers] = useState<string[]>(
    () => filter.members?.map(String) ?? [],
  );
  const [value, setValue] = useState<string>(() =>
    filter.value != null
      ? String(filter.value)
      : filter.members?.length === 1
        ? String(filter.members[0])
        : "",
  );
  const [range, setRange] = useState(() => ({
    min: filter.range?.min != null ? String(filter.range.min) : "",
    max: filter.range?.max != null ? String(filter.range.max) : "",
  }));
  const [search, setSearch] = useState("");
  const distinct = useMemo(
    () =>
      distinctValuesFor(engine, filter.uniqueName, engine.getLocale()).map(
        String,
      ),
    [engine, filter.uniqueName],
  );
  const shown = distinct.filter(
    (v) => !search || v.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = new Set(mode === "multi" ? members : [value]);
  const shownSelected = shown.filter((v) => selected.has(v)).length;
  const allShown = shown.length > 0 && shownSelected === shown.length;

  const pick = (v: string) => {
    if (mode === "single") return setValue(v);
    setMembers(
      members.includes(v) ? members.filter((m) => m !== v) : [...members, v],
    );
  };
  // "Select all" acts on the values in view; values hidden by the search keep their selection.
  const pickAll = () => {
    const next = new Set(members);
    shown.forEach((v) => (allShown ? next.delete(v) : next.add(v)));
    setMembers([...next]);
  };

  const apply = () => {
    const next: FilterEntry = { uniqueName: filter.uniqueName };
    if (mode === "multi" && members.length) next.members = [...members];
    if (mode === "single" && value !== "") next.value = value;
    if (mode === "range" && (range.min !== "" || range.max !== ""))
      next.range = {
        min: range.min === "" ? null : range.min,
        max: range.max === "" ? null : range.max,
      };
    onApply(next);
  };

  const modeLabel = (m: Mode) =>
    m === "single"
      ? isDate
        ? t("modeSingleDate", "Single date")
        : t("modeSingle", "Single value")
      : m === "multi"
        ? t("modeMulti", "Multiple values")
        : t("modeRange", "Range");

  const modes = modesFor(type);
  return (
    <Dialog
      visible
      onClose={onClose}
      title={meta?.caption || filter.uniqueName}
      width="sm"
      testID="pivot-filter-editor"
      leadingActions={
        <Button
          variant="text"
          onClick={() => onApply({ uniqueName: filter.uniqueName })}
        >
          {tb("removeFilter", "Remove filter")}
        </Button>
      }
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            {tb("cancel", "Cancel")}
          </Button>
          <Button onClick={apply} testID="pivot-filter-apply">
            {tb("apply", "Apply")}
          </Button>
        </>
      }
    >
      <View style={{ gap: 16 }}>
        {modes.length > 1 && (
          <ToggleButtonGroup
            fullWidth
            value={mode}
            onValueChange={(m: Mode) => m && setMode(m)}
            options={modes.map((m) => ({ value: m, label: modeLabel(m) }))}
          />
        )}
        {mode === "range" && isDate && (
          <DatePicker
            label={`${t("rangeFrom", "From")} – ${t("rangeTo", "To")}`}
            selectionMode="range"
            value={{ startDate: asDate(range.min), endDate: asDate(range.max) }}
            onChange={({ startDate, endDate }: DateRange) =>
              setRange({
                min: startDate ? day(startDate) : "",
                max: endDate ? day(endDate) : "",
              })
            }
          />
        )}
        {mode === "range" && !isDate && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input
                type="number"
                label={t("rangeFrom", "From")}
                value={range.min}
                onChange={(min) => setRange({ ...range, min })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                type="number"
                label={t("rangeTo", "To")}
                value={range.max}
                onChange={(max) => setRange({ ...range, max })}
              />
            </View>
          </View>
        )}
        {mode === "single" && isDate && (
          <DatePicker
            label={t("date", "Date")}
            value={asDate(value)}
            onChange={(date: Date) => setValue(day(date))}
          />
        )}
        {(mode === "multi" || (mode === "single" && !isDate)) && (
          <View style={{ gap: 8 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={t("search", "Search…")}
            />
            <ScrollView style={{ maxHeight: 280 }}>
              {mode === "multi" && shown.length > 0 && (
                <Checkbox
                  label={`${t("selectAll", "Select all")} (${shown.length})`}
                  checked={allShown}
                  indeterminate={!allShown && shownSelected > 0}
                  onValueChange={pickAll}
                />
              )}
              {shown.map((v) => (
                <Checkbox
                  key={v}
                  label={v}
                  checked={selected.has(v)}
                  onValueChange={() => pick(v)}
                />
              ))}
              {shown.length === 0 && (
                <Typography variant="bodyMedium" color="onSurfaceVariant">
                  {t("noValues", "No values.")}
                </Typography>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </Dialog>
  );
};

const FilterBar = ({
  engine,
  localization,
}: {
  engine: PivotEngine;
  localization?: LocalizationDictionary;
}) => {
  // The engine changes in place: its slice is read again when its version moves.
  const version = useEngineVersion(engine);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const slice = useMemo(() => engine.getSlice(), [engine, version]);
  const [editing, setEditing] = useState<number | null>(null);
  const filters = slice.filters || [];
  if (filters.length === 0) return null;
  const metadata = engine.getMetadata();

  const write = (next: FilterEntry[]) => {
    engine.setSlice({ ...engine.getSlice(), filters: next });
    setEditing(null);
  };

  return (
    <>
      <ScrollView
        horizontal
        testID="pivot-filter-bar"
        style={{ height: FILTER_BAR_HEIGHT, flexGrow: 0 }}
        contentContainerStyle={{
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 8,
        }}
      >
        <Typography variant="labelLarge" color="onSurfaceVariant">
          {caption(localization, "filterBar", "title", "Filters")}
        </Typography>
        {filters.map((filter, idx) => (
          <Chip
            key={`${filter.uniqueName}#${idx}`}
            size="small"
            icon="filter-variant"
            label={`${metadata[filter.uniqueName]?.caption || filter.uniqueName}: ${filterSummary(filter, localization)}`}
            selected={isFilterActive(filter)}
            variant={isFilterActive(filter) ? "tonal" : "outlined"}
            onClick={() => setEditing(idx)}
            onClose={() => write(filters.filter((_, i) => i !== idx))}
          />
        ))}
      </ScrollView>
      {editing !== null && filters[editing] && (
        <FilterEditor
          engine={engine}
          filter={filters[editing]}
          localization={localization}
          onApply={(next) =>
            write(filters.map((f, i) => (i === editing ? next : f)))
          }
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
};

export default FilterBar;
