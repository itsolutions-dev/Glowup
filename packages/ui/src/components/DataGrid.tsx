import React, { useState, useCallback, useMemo, type ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
  DimensionValue,
} from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import Pagination from "./Pagination";
import Table, {
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type TableAlign,
} from "./Table";
import { useDensity, type Density } from "../providers/Density";

// --- Main DataGrid Component ---

export interface ColumnDefinition {
  id: string;
  /** The header: text, or any node. */
  label: ReactNode;
  width?: number;
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
   */
  renderCell?: (value: any, row: any, index: number) => ReactNode;
}

export interface DataGridProps {
  data: any[];
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
   * makes the rows pressable, with the button role: a cell then should not hold
   * a control of its own.
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
}

const isEmptyCell = (value: unknown) =>
  value === null || value === undefined || value === "" || value === false;

const DataGrid = ({
  data,
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

  const paged = typeof rowsPerPage === "number" && rowsPerPage > 0;
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
            width={column.width}
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
              index === orderedColumns.length - 1 ? { borderRightWidth: 0 } : []
            }
          >
            {column.label}
          </TableHeaderCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const renderRow = ({ item, index: offset }: { item: any; index: number }) => {
    // The index in `data`, not in the page.
    const index = start + offset;
    // The stripe is drawn on the cells, not the row: a row's own background
    // (selected, hovered, `rowStyle`) would otherwise be painted over by it.
    const stripe =
      offset % 2 === 1
        ? { backgroundColor: theme.colors.surfaceVariant + "20" }
        : undefined;
    return (
      <TableRow
        hover={hover}
        selected={selectedRows.has(index)}
        onClick={onClick ? () => onClick(item, index) : undefined}
        style={[
          typeof rowStyle === "function" ? rowStyle(item, index) : rowStyle,
          { height: density === "dense" ? 40 : 56 },
        ]}
      >
        {orderedColumns.map((column, colIndex) => (
          <TableCell
            key={`${item.id || index}-${column.id}`}
            width={column.width}
            align={column.align ?? column.alignment}
            style={[
              colIndex === orderedColumns.length - 1
                ? { borderRightWidth: 0 }
                : {},
              { paddingVertical: density === "dense" ? 4 : 12 },
              stripe,
            ]}
          >
            {column.renderCell
              ? column.renderCell(item[column.id], item, index)
              : isEmptyCell(item[column.id])
                ? column.fallback
                : item[column.id]}
          </TableCell>
        ))}
      </TableRow>
    );
  };

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
      <ScrollView horizontal bounces={false}>
        <View>
          {renderHeader()}
          <FlatList
            // A new page starts at the top.
            key={current}
            data={rows}
            renderItem={renderRow}
            keyExtractor={(item, index) =>
              item.id?.toString() || (start + index).toString()
            }
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

const styles = StyleSheet.create({
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
});

export default DataGrid;
