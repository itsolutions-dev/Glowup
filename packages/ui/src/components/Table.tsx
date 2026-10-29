import React, { ReactNode, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StyleProp,
  ViewStyle,
  TextStyle,
  DimensionValue,
} from "react-native";
import Icons from "./Glyph";
import Pagination from "./Pagination";
import { useTheme, getFocusRing } from "../providers/ThemeProvider";
import { PressableState } from "./types";

// Table: pass `columns` and `data` and it draws the whole table (title, header,
// rows, empty state, paging). Pass the primitives below as `children` instead
// and it is only their container, for a table whose rows the caller lays out
// itself. They carry the table/row/columnheader/cell roles, so a screen reader
// on web can navigate them as a table; DataGrid is assembled from them.

/** Horizontal alignment of a column's content: numbers read best on the right. */
export type TableAlign = "left" | "center" | "right";

/** One column of a data driven `Table`. */
export interface TableColumn {
  /** The key of the field of each `data` row this column shows. */
  id: string;
  /** The header: text, or any node. */
  label: ReactNode;
  /** Horizontal alignment of the header and the cells. Defaults to `"left"`. */
  alignment?: TableAlign;
  /**
   * Drawn in a cell whose value is empty: `null`, `undefined`, `""` or `false`.
   * `0` is a value, not an empty one. Without it an empty cell stays empty.
   */
  fallback?: ReactNode;
  /**
   * Fixed width in px. Without it the column shares the free width of the table
   * with the other such columns, and is never narrower than 120 px.
   */
  width?: number;
}

const rowKey = (row: Record<string, unknown>, index: number) =>
  typeof row.id === "string" || typeof row.id === "number"
    ? `id:${row.id}`
    : index;

/** A row of a data driven `Table`: its cells by column `id`. Text and numbers are drawn in the theme's type, any other node as given. */
export type TableRowData = Record<string, string | number | ReactNode>;

export interface TableProps {
  /**
   * The primitives (`TableHead`, `TableRow`, `TableCell`, ...), when you lay the
   * rows out yourself. Ignored when `columns` is given.
   */
  children?: ReactNode;
  /** A heading drawn above the header row; also the table's accessible name. */
  tableTitle?: string;
  /** Width of the table. Without it the table fills its container. */
  width?: DimensionValue;
  /**
   * Height of the table. With it the rows scroll vertically under a header that
   * stays in place; without it the table is as tall as its rows.
   */
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
  /**
   * The columns. Giving them makes the table data driven: it draws `data`
   * itself. When they add up to more than `width` the table scrolls sideways.
   */
  columns?: TableColumn[];
  /** The rows, as `{ [column id]: cell }`. Data driven only. */
  data?: TableRowData[];
  /**
   * Rows per page. A number slices `data` into pages and shows a `Pagination`
   * under the table (hidden while there is no data); the page goes back to the
   * first when `rowsPerPage` or the number of rows changes. Left out, every row
   * is drawn in one page.
   */
  rowsPerPage?: number;
  /** Highlights the row under the pointer, on web; a row with `onClick` also highlights while pressed. */
  hover?: boolean;
  /**
   * The row index, or indexes, to draw as selected. An index is a position in
   * `data`, not in the page shown. The row is marked selected for assistive
   * technology too.
   */
  selected?: number | number[];
  /** Shown under the header when `data` is empty. Defaults to `"No data"`. */
  emptyMessage?: ReactNode;
  /**
   * Called with the row and its index in `data` when a row is pressed. Giving it
   * makes the rows pressable, with the button role.
   */
  onClick?: (row: TableRowData, index: number) => void;
  testID?: string;
}

// Width a column without one never goes below, and the primitives' default.
const FLEX_MIN_WIDTH = 120;
const CELL_WIDTH = 150;

const NO_ROWS: TableRowData[] = [];

const isEmptyCell = (value: unknown) =>
  value === null || value === undefined || value === "" || value === false;

const Table = ({ children, style, columns, ...rest }: TableProps) => {
  const { theme } = useTheme();
  if (columns) return <DataTable columns={columns} style={style} {...rest} />;
  return (
    <View
      role="table"
      testID={rest.testID}
      style={[
        styles.table,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const DataTable = ({
  tableTitle,
  width,
  height,
  style,
  columns = [],
  data = NO_ROWS,
  rowsPerPage,
  hover = false,
  selected,
  emptyMessage = "No data",
  onClick,
  testID,
}: TableProps) => {
  const { theme } = useTheme();
  const paged = typeof rowsPerPage === "number" && rowsPerPage > 0;
  const perPage = paged ? Math.floor(rowsPerPage) || 1 : 0;
  const totalPages = paged ? Math.max(1, Math.ceil(data.length / perPage)) : 1;

  const [page, setPage] = useState(1);
  // Back to the first page when the table is paged differently or holds other
  // rows. Compared by count, not by identity: a `data` array built inline in
  // the parent's render is a new array every time, and would pin the table to
  // page 1 whatever the user did.
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
  const minWidth = columns.reduce(
    (sum, column) => sum + (column.width ?? FLEX_MIN_WIDTH),
    0,
  );
  const scrolls = height !== undefined;

  // The cell props a column gives its header and its cells alike, so the two
  // line up; the last column has no border on its right edge.
  const cellProps = (column: TableColumn, index: number) => ({
    align: column.alignment,
    width: column.width ?? FLEX_MIN_WIDTH,
    flex: column.width === undefined,
    style:
      index === columns.length - 1
        ? [styles.dataCell, styles.lastCell]
        : styles.dataCell,
  });

  const body =
    rows.length === 0 ? (
      <View style={styles.empty}>
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
    ) : (
      rows.map((row, offset) => {
        const index = start + offset;
        return (
          <TableRow
            // By id when the row has one, so its local state follows it through a
            // sort or a filter; by position otherwise.
            key={rowKey(row, index)}
            hover={hover}
            selected={selectedRows.has(index)}
            onClick={onClick ? () => onClick(row, index) : undefined}
            style={[
              styles.dataRow,
              offset === rows.length - 1 && styles.lastRow,
            ]}
          >
            {columns.map((column, c) => (
              <TableCell key={column.id} {...cellProps(column, c)}>
                {isEmptyCell(row[column.id]) ? column.fallback : row[column.id]}
              </TableCell>
            ))}
          </TableRow>
        );
      })
    );

  return (
    <View
      role="table"
      aria-label={tableTitle}
      testID={testID}
      style={[
        styles.table,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
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
        nestedScrollEnabled
        style={scrolls ? styles.fill : undefined}
        contentContainerStyle={styles.grow}
      >
        <View style={[styles.grow, { minWidth }]}>
          <TableHead>
            <TableRow>
              {columns.map((column, c) => (
                <TableHeaderCell
                  key={column.id}
                  {...cellProps(column, c)}
                  style={c === columns.length - 1 ? styles.lastCell : undefined}
                >
                  {column.label}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          {scrolls ? (
            // No scrollbar: on web it would take width from the rows and not
            // from the header above them, and the columns would not line up.
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={styles.fill}
              role="rowgroup"
            >
              {body}
            </ScrollView>
          ) : (
            <View role="rowgroup">{body}</View>
          )}
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
    </View>
  );
};

export interface TableHeadProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}
export const TableHead = ({ children, style }: TableHeadProps) => {
  const { theme } = useTheme();
  return (
    <View
      role="rowgroup"
      style={[
        styles.thead,
        {
          backgroundColor: theme.colors.surfaceContainerLow,
          borderBottomColor: theme.colors.outlineVariant,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export interface TableRowProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Makes the row pressable. It then takes the button role, so give it a cell that says what it does. */
  onClick?: () => void;
  /**
   * Highlights the row under the pointer, on web. A row with `onClick` also
   * highlights while it is pressed, `hover` or not.
   */
  hover?: boolean;
  /** Draws the row highlighted and marks it selected for assistive technology. */
  selected?: boolean;
  testID?: string;
}
export const TableRow = ({
  children,
  style,
  onClick,
  hover = false,
  selected = false,
  testID,
}: TableRowProps) => {
  const { theme } = useTheme();
  const base = [
    styles.tr,
    { borderBottomColor: theme.colors.outlineVariant },
    selected && { backgroundColor: theme.colors.secondaryContainer },
  ];

  if (!onClick && !hover) {
    return (
      <View
        role="row"
        testID={testID}
        accessibilityState={selected ? { selected } : undefined}
        style={[base, style]}
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable
      role={onClick ? "button" : "row"}
      onPress={onClick}
      testID={testID}
      // A row that only highlights is not a control: no tab stop, and no
      // grouping of the controls in its cells into one element.
      focusable={!!onClick}
      accessible={!!onClick}
      accessibilityState={{ selected }}
      style={({ hovered, pressed }: PressableState) => [
        base,
        !selected &&
          ((onClick && pressed) || (hover && hovered)) && {
            backgroundColor: pressed
              ? theme.colors.surfaceContainerHighest
              : theme.colors.surfaceContainerHigh,
          },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
};

const FLEX: Record<TableAlign, "flex-start" | "center" | "flex-end"> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

/** A cell's size: `width` px, or with `flex` a share of the row's free width that is never below `width`. */
const cellSize = (width: number | undefined, flex: boolean | undefined) =>
  flex
    ? { flex: 1, minWidth: width ?? CELL_WIDTH }
    : { width: width || CELL_WIDTH };

export interface TableHeaderCellProps {
  children: ReactNode;
  align?: TableAlign;
  style?: StyleProp<ViewStyle>;
  /** Width in px. Defaults to 150. With `flex`, the narrowest the cell gets. */
  width?: number;
  /** Shares the row's free width with the other `flex` cells instead of having a fixed `width`. */
  flex?: boolean;
  /** Called when a `sortable` header is pressed. */
  onClick?: () => void;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}
export const TableHeaderCell = ({
  children,
  align = "left",
  style,
  width,
  flex,
  onClick,
  sortable,
  sortDirection,
  onMoveLeft,
  onMoveRight,
}: TableHeaderCellProps) => {
  const { theme } = useTheme();
  const interactive = !!onClick && !!sortable;
  const contentStyle = {
    justifyContent: FLEX[align],
    // Room for the reorder arrows only when they are there, so a
    // right-aligned header lines up with its cells.
    paddingRight: onMoveLeft || onMoveRight ? 40 : 12,
  };
  const content = (
    <>
      <Text style={[styles.thText, { color: theme.colors.onSurface }]}>
        {children}
      </Text>
      {sortable && (
        <View style={styles.sortIconContainer}>
          {sortDirection ? (
            <Icons
              name={sortDirection === "asc" ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.colors.primary}
            />
          ) : (
            // Sortable, not sorted yet: visible at a glance, not only once pressed.
            <Icons
              name="unfold-more-horizontal"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          )}
        </View>
      )}
    </>
  );
  return (
    <View
      role="columnheader"
      style={[
        styles.th,
        cellSize(width, flex),
        { borderRightColor: theme.colors.outlineVariant },
        style,
      ]}
    >
      {interactive ? (
        <Pressable
          onPress={onClick}
          style={({ hovered, pressed }: PressableState) => [
            styles.thContent,
            contentStyle,
            (hovered || pressed) && getFocusRing(theme),
            (hovered || pressed) && {
              backgroundColor: theme.colors.surfaceContainerHigh,
            },
          ]}
        >
          {content}
        </Pressable>
      ) : (
        // Not a disabled Pressable: that marks every header aria-disabled.
        <View style={[styles.thContent, contentStyle]}>{content}</View>
      )}

      <View style={styles.reorderContainer}>
        {onMoveLeft && (
          <Pressable onPress={onMoveLeft} style={styles.reorderButton}>
            <Icons
              name="chevron-left"
              size={14}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        )}
        {onMoveRight && (
          <Pressable onPress={onMoveRight} style={styles.reorderButton}>
            <Icons
              name="chevron-right"
              size={14}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export interface TableCellProps {
  children: ReactNode;
  align?: TableAlign;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /** Width in px. Defaults to 150. With `flex`, the narrowest the cell gets. */
  width?: number;
  /** Shares the row's free width with the other `flex` cells instead of having a fixed `width`. */
  flex?: boolean;
}
export const TableCell = ({
  children,
  align = "left",
  style,
  textStyle,
  width,
  flex,
}: TableCellProps) => {
  const { theme } = useTheme();
  return (
    <View
      role="cell"
      style={[
        styles.td,
        cellSize(width, flex),
        {
          borderRightColor: theme.colors.outlineVariant,
          alignItems: FLEX[align],
        },
        style,
      ]}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          style={[
            { color: theme.colors.onSurface },
            theme.typography.bodyMedium,
            { textAlign: align },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  table: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  title: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
  thead: {
    borderBottomWidth: 1,
    zIndex: 10,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  dataRow: {
    minHeight: 52,
  },
  dataCell: {
    paddingVertical: 12,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  empty: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  th: {
    height: 48,
    borderRightWidth: 1,
    justifyContent: "center",
  },
  thContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 40,
  },
  thText: {
    fontWeight: "700",
  },
  td: {
    paddingHorizontal: 12,
    borderRightWidth: 1,
    justifyContent: "center",
  },
  sortIconContainer: {
    marginLeft: 4,
  },
  reorderContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 4,
  },
  reorderButton: {
    padding: 2,
  },
});

export default Table;
