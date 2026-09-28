import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import Table, {
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "./Table";

// --- Main DataGrid Component ---

export interface ColumnDefinition {
  id: string;
  label: string;
  width?: number;
  sortable?: boolean;
}

interface DataGridProps {
  data: any[];
  columns: ColumnDefinition[];
  loading?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  density?: "normal" | "dense";
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnId: string, direction: "asc" | "desc") => void;
  onColumnReorder?: (newColumns: ColumnDefinition[]) => void;
  /** Shown centered when data is empty and not loading. */
  emptyMessage?: string;
  style?: ViewStyle;
  rowStyle?: ViewStyle;
  headerStyle?: ViewStyle;
}

const DataGrid = ({
  data,
  columns,
  loading = false,
  onEndReached,
  onEndReachedThreshold = 0.5,
  density = "normal",
  sortColumn,
  sortDirection,
  onSort,
  onColumnReorder,
  emptyMessage,
  style,
  rowStyle,
  headerStyle,
}: DataGridProps) => {
  const { theme } = useTheme();
  const [orderedColumns, setOrderedColumns] = useState(columns);
  const [prevColumns, setPrevColumns] = useState(columns);

  // Reset ordering when the columns prop changes (render-time adjustment)
  if (prevColumns !== columns) {
    setPrevColumns(columns);
    setOrderedColumns(columns);
  }

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
    setOrderedColumns(newColumns);
    onColumnReorder(newColumns);
  };

  const renderHeader = () => (
    <TableHead style={headerStyle}>
      <TableRow>
        {orderedColumns.map((column, index) => (
          <TableHeaderCell
            key={column.id}
            width={column.width}
            sortable={column.sortable}
            sortDirection={sortColumn === column.id ? sortDirection : null}
            onPress={() => handleSort(column.id)}
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

  const renderRow = ({ item, index }: { item: any; index: number }) => {
    const isOdd = index % 2 === 1;
    return (
      <TableRow
        style={[
          rowStyle || {},
          isOdd ? { backgroundColor: theme.colors.surfaceVariant + "20" } : {},
          { height: density === "dense" ? 40 : 56 },
        ]}
      >
        {orderedColumns.map((column, colIndex) => (
          <TableCell
            key={`${item.id || index}-${column.id}`}
            width={column.width}
            style={[
              colIndex === orderedColumns.length - 1
                ? { borderRightWidth: 0 }
                : {},
              { paddingVertical: density === "dense" ? 4 : 12 },
            ]}
          >
            {item[column.id]}
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
    <Table style={style}>
      <ScrollView horizontal bounces={false}>
        <View>
          {renderHeader()}
          <FlatList
            data={data}
            renderItem={renderRow}
            keyExtractor={(item, index) =>
              item.id?.toString() || index.toString()
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={onEndReachedThreshold}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              !loading && emptyMessage ? (
                <View style={styles.emptyContainer}>
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {emptyMessage}
                  </Text>
                </View>
              ) : null
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </ScrollView>
    </Table>
  );
};

const styles = StyleSheet.create({
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
