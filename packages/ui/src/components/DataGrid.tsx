import React, { useState, useCallback, useMemo, type ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Platform,
  Pressable,
  ViewStyle,
  DimensionValue,
} from "react-native";
import { useTheme, getFocusRing } from "../providers/ThemeProvider";
import Icons from "./Glyph";
import IconButton from "./IconButton";
import Pagination from "./Pagination";
import Table, {
  CellText,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type CellWidth,
  type TableAlign,
} from "./Table";
import { a11yState } from "./internal/a11yState";
import type { MaterialCommunityIconsGlyphs, PressableState } from "./types";
import { useDensity, type Density } from "../providers/Density";

// --- Main DataGrid Component ---

export interface ColumnDefinition {
  id: string;
  /** The header: text, or any node. */
  label: ReactNode;
  /**
   * Fixed width in px, or a share of the grid as a percentage (`"30%"`).
   * Without it the column shares the free width with the other such columns.
   */
  width?: CellWidth;
  /**
   * The narrowest the column gets, in px: for a column without `width`
   * (default 150) or with a percentage one (default none). The grid scrolls
   * sideways once its columns no longer fit.
   */
  minWidth?: number;
  sortable?: boolean;
  /** Alignment of the header and the cells. Defaults to `"left"`; use `"right"` for numbers. */
  align?: TableAlign;
  /** The spelling `Table`'s columns use, for `align`. `align` wins when both are given. */
  alignment?: TableAlign;
  /**
   * Drawn in a cell whose value is empty: `null`, `undefined`, `""` or `false`
   * (`0` is a value). Not used by a column with `renderCell`, which draws every cell.
   */
  fallback?: ReactNode;
  /**
   * Draws the cell instead of printing `row[id]`: a badge, a formatted
   * amount, a button. Receives the value, the row and its index in `data`.
   * Declared with one or two parameters it is not called again when a sort
   * only moves its row (it cannot read the index); declare `index` as the
   * third parameter, not a default one, when the cell shows it.
   */
  renderCell?: (value: any, row: any, index: number) => ReactNode;
}

/** An action on one row, drawn as an icon button in the grid's last column. */
export interface DataGridRowAction {
  icon: MaterialCommunityIconsGlyphs;
  /** Its accessible name, and the tooltip on the web. */
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

/** A group of rows under a header row that folds them away. */
export interface DataGridSection {
  /** Unique among the sections; it keeps a section folded across new data. */
  key: string;
  /** The header row's text, or any node. */
  title: ReactNode;
  /** Drawn after the title: a count, a badge. */
  trailing?: ReactNode;
  data: any[];
}

export interface DataGridProps {
  /** The rows. Ignored when `sections` is given. */
  data?: any[];
  /**
   * The rows in groups, each under a header row that folds and unfolds it;
   * every section starts unfolded. A row's index is its position in all the
   * sections' rows, folded ones included. Not combined with `rowsPerPage`.
   */
  sections?: DataGridSection[];
  /**
   * The columns, in order. Keep the array stable (`useMemo`), and `onClick`
   * too (`useCallback`): a row is drawn again only when something it shows
   * changes, which a new array every render defeats.
   */
  columns: ColumnDefinition[];
  /** A heading drawn above the header row. */
  tableTitle?: string;
  /** Width of the grid. Without it the grid fills its container. */
  width?: DimensionValue;
  /**
   * Height of the grid. The header stays in place and the rows scroll under it
   * (a virtualised list). Without it the grid fills the height of its container,
   * which must then be bounded for the rows to scroll.
   */
  height?: DimensionValue;
  /**
   * Rows per page. A number slices `data` into pages and shows a `Pagination`
   * under the grid (hidden while there is no data); the page goes back to the
   * first when `rowsPerPage` or the number of rows changes. Left out, every row
   * is one scrolling list. Not meant to be combined with `onEndReached`: a page
   * is finished by the user, not by scrolling.
   */
  rowsPerPage?: number;
  /** Highlights the row under the pointer, on web; a row with `onClick` also highlights while pressed. */
  hover?: boolean;
  /**
   * The row index, or indexes, to draw as selected. An index is a position in
   * `data`, not in the page shown, so it follows the order `data` is given in
   * (sort the rows before passing them). The row is marked selected for
   * assistive technology too.
   */
  selected?: number | number[];
  /**
   * Called with the row and its index in `data` when a row is pressed. Giving it
   * makes the rows pressable: a button on iOS and Android, where a cell then
   * should not hold a control of its own (the row is read as one element); a
   * focusable row on the web, which Enter presses.
   */
  onClick?: (row: any, index: number) => void;
  loading?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  /** Row height; follows `ThemeProvider`'s `density` unless set here. */
  density?: Density;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnId: string, direction: "asc" | "desc") => void;
  onColumnReorder?: (newColumns: ColumnDefinition[]) => void;
  /** Shown centered when data is empty and not loading. */
  emptyMessage?: ReactNode;
  /** Drawn instead of `emptyMessage` when data is empty and not loading: an illustration, a call to action. */
  emptyState?: ReactNode;
  style?: ViewStyle;
  /** One style for every row, or a function of the row (to dim or highlight one). */
  rowStyle?: ViewStyle | ((row: any, index: number) => ViewStyle | undefined);
  headerStyle?: ViewStyle;
  /**
   * The actions on a row, drawn as icon buttons in a last column as wide as
   * the row with the most. Keep the function stable (`useCallback`).
   */
  rowActions?: (row: any, index: number) => DataGridRowAction[];
  /**
   * When the row actions show: `"always"`, or `"hover"`, only while the
   * pointer is over the row or one of them has the focus (web; on a touch
   * screen they always show).
   */
  revealRowActions?: "always" | "hover";
  /**
   * Draws a whole row instead of its cells, for the rows it returns a node
   * for: a note spanning the grid, a divider. `null` or `undefined` draws the
   * row as usual. Keep the function stable (`useCallback`).
   */
  renderRow?: (row: any, index: number) => ReactNode;
  testID?: string;
}

const isEmptyCell = (value: unknown) =>
  value === null || value === undefined || value === "" || value === false;

const NO_DATA: any[] = [];

type GridItem =
  | { section: DataGridSection; collapsed: boolean; key: string }
  | { row: any; index: number; stripe: boolean; key: string };

const DataGrid = ({
  data = NO_DATA,
  sections,
  columns,
  tableTitle,
  width,
  height,
  rowsPerPage,
  hover = false,
  selected,
  onClick,
  loading = false,
  onEndReached,
  onEndReachedThreshold = 0.5,
  density: densityProp,
  sortColumn,
  sortDirection,
  onSort,
  onColumnReorder,
  emptyMessage,
  emptyState,
  style,
  rowStyle,
  headerStyle,
  rowActions,
  revealRowActions = "always",
  renderRow: renderWholeRow,
  testID,
}: DataGridProps) => {
  const density = useDensity(densityProp);
  const { theme } = useTheme();
  // The user's order is kept as column ids and applied to the latest `columns`,
  // so an inline array (new identity every render, new `renderCell` closures)
  // keeps both the reorder and fresh cells. It resets only when the ids, or
  // their order, change (render-time adjustment).
  const idsKey = columns.map((c) => c.id).join("\u0000");
  const [order, setOrder] = useState(() => columns.map((c) => c.id));
  const [prevIdsKey, setPrevIdsKey] = useState(idsKey);
  if (prevIdsKey !== idsKey) {
    setPrevIdsKey(idsKey);
    setOrder(columns.map((c) => c.id));
  }
  const orderedColumns = useMemo(() => {
    const byId = new Map(columns.map((c) => [c.id, c]));
    return order.flatMap((id) => byId.get(id) ?? []);
  }, [columns, order]);
  const allRows = useMemo(
    () => (sections ? sections.flatMap((section) => section.data) : data),
    [sections, data],
  );
  // As wide as the row with the most actions: 40 px a button, 8 px either side.
  const actionsWidth = useMemo(() => {
    if (!rowActions) return 0;
    const most = allRows.reduce(
      (max: number, row, index) => Math.max(max, rowActions(row, index).length),
      0,
    );
    return most && most * ACTION_SIZE + 16;
  }, [allRows, rowActions]);
  // The grid is never narrower than its columns: past that it scrolls sideways.
  const minWidth = gridMinWidth(orderedColumns, actionsWidth);

  const paged = !sections && typeof rowsPerPage === "number" && rowsPerPage > 0;
  const perPage = paged ? Math.floor(rowsPerPage) || 1 : 0;
  const totalPages = paged ? Math.max(1, Math.ceil(data.length / perPage)) : 1;
  const [page, setPage] = useState(1);
  // Back to the first page when the grid is paged differently or holds other
  // rows. Compared by count, not by identity, like `Table`: an inline `data`
  // array is a new array every render.
  const [paging, setPaging] = useState({ rowsPerPage, rows: data.length });
  if (paging.rowsPerPage !== rowsPerPage || paging.rows !== data.length) {
    setPaging({ rowsPerPage, rows: data.length });
    setPage(1);
  }
  const current = Math.min(page, totalPages);
  const start = paged ? (current - 1) * perPage : 0;
  const rows = paged ? data.slice(start, start + perPage) : data;

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const toggleSection = useCallback(
    (key: string) =>
      setCollapsed((held) => {
        const next = new Set(held);
        if (!next.delete(key)) next.add(key);
        return next;
      }),
    [],
  );
  // One list of header rows and rows, so a single FlatList scrolls them all.
  const items = useMemo<GridItem[]>(() => {
    if (!sections)
      return rows.map((row, offset) => ({
        row,
        // The index in `data`, not in the page.
        index: start + offset,
        stripe: offset % 2 === 1,
        key: row.id?.toString() || (start + offset).toString(),
      }));
    let index = 0;
    return sections.flatMap((section) => {
      const folded = collapsed.has(section.key);
      const first = index;
      index += section.data.length;
      return [
        { section, collapsed: folded, key: `section:${section.key}` },
        ...(folded
          ? []
          : section.data.map((row, offset) => ({
              row,
              index: first + offset,
              stripe: offset % 2 === 1,
              key: row.id?.toString() || `${section.key}:${offset}`,
            }))),
      ];
    });
  }, [sections, collapsed, rows, start]);

  const selectedRows = useMemo(
    () => new Set(typeof selected === "number" ? [selected] : (selected ?? [])),
    [selected],
  );

  const handleSort = useCallback(
    (columnId: string) => {
      if (!onSort) return;
      const column = orderedColumns.find((c) => c.id === columnId);
      if (!column?.sortable) return;

      let nextDirection: "asc" | "desc" = "asc";
      if (sortColumn === columnId) {
        nextDirection = sortDirection === "asc" ? "desc" : "asc";
      }
      onSort(columnId, nextDirection);
    },
    [onSort, sortColumn, sortDirection, orderedColumns],
  );

  const moveColumn = (fromIndex: number, toIndex: number) => {
    if (!onColumnReorder) return;
    const newColumns = [...orderedColumns];
    const [removed] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, removed);
    setOrder(newColumns.map((c) => c.id));
    onColumnReorder(newColumns);
  };

  const renderHeader = () => (
    <TableHead style={headerStyle}>
      <TableRow>
        {orderedColumns.map((column, index) => (
          <TableHeaderCell
            key={column.id}
            {...columnSize(column)}
            align={column.align ?? column.alignment}
            sortable={column.sortable}
            sortDirection={sortColumn === column.id ? sortDirection : null}
            onClick={() => handleSort(column.id)}
            onMoveLeft={
              onColumnReorder && index > 0
                ? () => moveColumn(index, index - 1)
                : undefined
            }
            onMoveRight={
              onColumnReorder && index < orderedColumns.length - 1
                ? () => moveColumn(index, index + 1)
                : undefined
            }
            style={
              index === orderedColumns.length - 1 && !actionsWidth
                ? { borderRightWidth: 0 }
                : []
            }
          >
            {column.label}
          </TableHeaderCell>
        ))}
        {!!actionsWidth && (
          <TableHeaderCell width={actionsWidth} style={styles.lastCell}>
            {""}
          </TableHeaderCell>
        )}
      </TableRow>
    </TableHead>
  );

  const stripeColor = theme.colors.surfaceVariant + "20";
  const renderItem = ({ item }: { item: GridItem }) =>
    "section" in item ? (
      <SectionHeader
        section={item.section}
        collapsed={item.collapsed}
        onToggle={toggleSection}
      />
    ) : (
      <DataGridRow
        item={item.row}
        index={item.index}
        striped={item.stripe}
        stripeColor={stripeColor}
        selected={selectedRows.has(item.index)}
        columns={orderedColumns}
        dense={density === "dense"}
        hover={hover}
        onClick={onClick}
        rowStyle={rowStyle}
        rowActions={rowActions}
        actionsWidth={actionsWidth}
        revealOnHover={revealRowActions === "hover" && Platform.OS === "web"}
        renderWholeRow={renderWholeRow}
      />
    );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.tfoot}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <Table
      testID={testID}
      style={[
        // Without a height the grid fills its container; with one it is that tall.
        height === undefined && styles.grid,
        width !== undefined && { width },
        height !== undefined && { height },
        style,
      ]}
    >
      {!!tableTitle && (
        <View
          style={[
            styles.title,
            { borderBottomColor: theme.colors.outlineVariant },
          ]}
        >
          <Text
            accessibilityRole="header"
            style={[
              theme.typography.titleMedium,
              { color: theme.colors.onSurface },
            ]}
          >
            {tableTitle}
          </Text>
        </View>
      )}
      <ScrollView
        horizontal
        bounces={false}
        contentContainerStyle={styles.fill}
      >
        <View style={[styles.fill, { minWidth }]}>
          {renderHeader()}
          <FlatList
            // A new page starts at the top.
            key={current}
            // No scrollbar, as in Table: on the web it takes width from the rows and not from the header above
            // them, and the columns would not line up.
            showsVerticalScrollIndicator={false}
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            onEndReached={onEndReached}
            onEndReachedThreshold={onEndReachedThreshold}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              loading ? null : emptyState ? (
                <View style={styles.emptyContainer}>{emptyState}</View>
              ) : emptyMessage ? (
                <View style={styles.emptyContainer}>
                  {typeof emptyMessage === "string" ? (
                    <Text
                      style={[
                        theme.typography.bodyMedium,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {emptyMessage}
                    </Text>
                  ) : (
                    emptyMessage
                  )}
                </View>
              ) : null
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </ScrollView>
      {paged && data.length > 0 && (
        <View
          style={[
            styles.footer,
            { borderTopColor: theme.colors.outlineVariant },
          ]}
        >
          <Pagination
            activePage={current}
            totalPages={totalPages}
            onChange={setPage}
            size="sm"
          />
        </View>
      )}
    </Table>
  );
};

// What a column without a width gets at least: the width every column had before they shared the free width.
const FLEX_MIN = 150;
// An action button's box (IconButton "medium").
const ACTION_SIZE = 40;

const columnSize = (column: ColumnDefinition) =>
  column.width === undefined
    ? { width: column.minWidth ?? FLEX_MIN, flex: true }
    : { width: column.width, minWidth: column.minWidth };

const percent = (width: CellWidth | undefined) =>
  typeof width === "string" ? parseFloat(width) / 100 : 0;

/**
 * The narrowest the grid can be with every column at its minimum. A
 * percentage column grows with the grid, so the rest must fit in what it
 * leaves: W - Σ p·W >= the others. A percentage column held at its
 * `minWidth` counts as fixed, which may hold another, hence the loop.
 */
export const gridMinWidth = (
  columns: ColumnDefinition[],
  extra = 0,
): number => {
  const fixed = columns.reduce(
    (sum, column) =>
      typeof column.width === "string"
        ? sum
        : sum + (column.width ?? column.minWidth ?? FLEX_MIN),
    extra,
  );
  let shares = columns.filter((column) => percent(column.width) > 0);
  let held = 0;
  for (;;) {
    const share = shares.reduce(
      (sum, column) => sum + percent(column.width),
      0,
    );
    if (share >= 1) return fixed + held;
    const width = (fixed + held) / (1 - share);
    const floored = shares.filter(
      (column) => percent(column.width) * width < (column.minWidth ?? 0),
    );
    if (floored.length === 0) return Math.ceil(width);
    held += floored.reduce((sum, column) => sum + (column.minWidth ?? 0), 0);
    shares = shares.filter((column) => !floored.includes(column));
  }
};

/** A section's header row: its title and `trailing`, pressed to fold or unfold its rows. */
const SectionHeader = React.memo(function SectionHeader({
  section,
  collapsed,
  onToggle,
}: {
  section: DataGridSection;
  collapsed: boolean;
  onToggle: (key: string) => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      role="row"
      style={[
        styles.sectionRow,
        { borderBottomColor: theme.colors.outlineVariant },
      ]}
    >
      <Pressable
        role="button"
        onPress={() => onToggle(section.key)}
        {...a11yState("button", { expanded: !collapsed })}
        style={({ hovered, pressed, focused }: PressableState) => [
          styles.sectionButton,
          (hovered || pressed) && {
            backgroundColor: theme.colors.surfaceContainerHigh,
          },
          focused && getFocusRing(theme),
        ]}
      >
        <Icons
          name={collapsed ? "chevron-right" : "chevron-down"}
          size={18}
          color={theme.colors.onSurfaceVariant}
        />
        {typeof section.title === "string" ? (
          <Text
            style={[
              theme.typography.labelLarge,
              { color: theme.colors.onSurfaceVariant },
            ]}
            numberOfLines={1}
          >
            {section.title}
          </Text>
        ) : (
          section.title
        )}
        {typeof section.trailing === "string" ||
        typeof section.trailing === "number" ? (
          <Text
            style={[
              theme.typography.bodySmall,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {section.trailing}
          </Text>
        ) : (
          section.trailing
        )}
      </Pressable>
    </View>
  );
});

interface DataGridRowProps {
  item: any;
  index: number;
  striped: boolean;
  stripeColor: string;
  selected: boolean;
  columns: ColumnDefinition[];
  dense: boolean;
  hover?: boolean;
  onClick?: DataGridProps["onClick"];
  rowStyle?: DataGridProps["rowStyle"];
  rowActions?: DataGridProps["rowActions"];
  actionsWidth: number;
  revealOnHover: boolean;
  renderWholeRow?: DataGridProps["renderRow"];
}

/**
 * One row, drawn again only when one of its props changes: a screen that
 * re-renders around the grid (a keystroke in a search box, a counter) no
 * longer redraws every row with the same data. It skips only while `columns`,
 * `onClick` and a function `rowStyle` keep their identity (`useMemo`,
 * `useCallback` in the app); a sort still redraws the rows that moved.
 */
const DataGridRow = React.memo(function DataGridRow({
  item,
  index,
  striped,
  stripeColor,
  selected,
  columns,
  dense,
  hover,
  onClick,
  rowStyle,
  rowActions,
  actionsWidth,
  revealOnHover,
  renderWholeRow,
}: DataGridRowProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const whole = renderWholeRow?.(item, index);
  if (whole !== null && whole !== undefined) return <>{whole}</>;
  const actions = rowActions?.(item, index) ?? [];
  const shown = !revealOnHover || hovered || focused;
  return (
    <TableRow
      hover={hover}
      selected={selected}
      onClick={onClick ? () => onClick(item, index) : undefined}
      onHoverChange={revealOnHover ? setHovered : undefined}
      style={[
        typeof rowStyle === "function" ? rowStyle(item, index) : rowStyle,
        // A minimum: a cell of two lines (a name and a chip) grows its row instead of spilling out.
        { minHeight: dense ? 40 : 56 },
      ]}
    >
      {columns.map((column, colIndex) => (
        <TableCell
          key={`${item.id ?? index}-${column.id}`}
          {...columnSize(column)}
          align={column.align ?? column.alignment}
          style={[
            colIndex === columns.length - 1 && !actionsWidth
              ? { borderRightWidth: 0 }
              : {},
            { paddingVertical: dense ? 4 : 12 },
            // The stripe is drawn on the cells, not the row: a row's own
            // background (selected, hovered, `rowStyle`) would otherwise be
            // painted over by it.
            striped && { backgroundColor: stripeColor },
          ]}
        >
          {column.renderCell ? (
            <CellContent
              column={column}
              item={item}
              value={item[column.id]}
              // A sort moves rows to new indexes; a renderCell that declares one
              // or two parameters cannot read the index, and keeps what it drew.
              // Any other (three, or none as with rest parameters) gets it.
              index={skipsIndex(column.renderCell) ? undefined : index}
            />
          ) : isEmptyCell(item[column.id]) ? (
            column.fallback
          ) : (
            item[column.id]
          )}
        </TableCell>
      ))}
      {!!actionsWidth && (
        <TableCell
          width={actionsWidth}
          align="right"
          style={[
            styles.lastCell,
            { paddingVertical: 0, paddingHorizontal: 8 },
            striped && { backgroundColor: stripeColor },
          ]}
        >
          <View
            style={[styles.actions, { opacity: shown ? 1 : 0 }]}
            onFocus={revealOnHover ? () => setFocused(true) : undefined}
            onBlur={revealOnHover ? () => setFocused(false) : undefined}
          >
            {actions.map((action) => (
              <IconButton
                key={action.label}
                icon={action.icon}
                accessibilityLabel={action.label}
                title={action.label}
                disabled={action.disabled}
                onClick={action.onPress}
                testID={action.testID}
              />
            ))}
          </View>
        </TableCell>
      )}
    </TableRow>
  );
});

const skipsIndex = (render: (...args: never[]) => unknown) =>
  render.length === 1 || render.length === 2;

/**
 * What a custom cell (`renderCell`) shows, memoised on its own: a row that only moved (a sort) is
 * drawn again for its new index and stripe, its custom cells are not. `index`
 * is left out only for a renderCell that declares one or two parameters.
 */
const CellContent = React.memo(function CellContent({
  column,
  item,
  value,
  index,
}: {
  column: ColumnDefinition;
  item: any;
  value: unknown;
  index: number | undefined;
}) {
  return (
    <CellText align={column.align ?? column.alignment}>
      {column.renderCell?.(value, item, index as number)}
    </CellText>
  );
});

const styles = StyleSheet.create({
  // The columns span the grid when they fit, and scroll sideways when they do not.
  fill: { flexGrow: 1 },
  // The grid fills its container, so the FlatList inside it can scroll.
  grid: { flex: 1 },
  title: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  tfoot: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
  },
  lastCell: { borderRightWidth: 0 },
  actions: { flexDirection: "row", justifyContent: "flex-end" },
  sectionRow: {
    borderBottomWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    flexDirection: "row",
  },
  sectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
});

export default DataGrid;
