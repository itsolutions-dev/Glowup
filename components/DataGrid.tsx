import React, { useMemo, useState, useCallback, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  ViewStyle,
  TextStyle,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme, getGlowStyles } from "../providers/ThemeProvider";

// --- Sub-components ---

interface TableProps {
  children: ReactNode;
  style?: ViewStyle;
}
const Table = ({ children, style }: TableProps) => {
  const { theme } = useTheme();
  return (
    <View
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

interface TheadProps {
  children: ReactNode;
  style?: ViewStyle;
}
const Thead = ({ children, style }: TheadProps) => {
  const { theme } = useTheme();
  return (
    <View
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

interface TbodyProps {
  children: ReactNode;
  style?: ViewStyle;
}
const Tbody = ({ children, style }: TbodyProps) => (
  <View style={[styles.tbody, style]}>{children}</View>
);

interface TfootProps {
  children: ReactNode;
  style?: ViewStyle;
}
const Tfoot = ({ children, style }: TfootProps) => (
  <View style={[styles.tfoot, style]}>{children}</View>
);

interface TrProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}
const Tr = ({ children, style }: TrProps) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.tr,
        { borderBottomColor: theme.colors.outlineVariant },
        ...(Array.isArray(style) ? style : [style]),
      ]}
    >
      {children}
    </View>
  );
};

interface ThProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  width?: number;
  onPress?: () => void;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}
const Th = ({
  children,
  style,
  width,
  onPress,
  sortable,
  sortDirection,
  onMoveLeft,
  onMoveRight,
}: ThProps) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.th,
        { width: width || 150, borderRightColor: theme.colors.outlineVariant },
        ...(Array.isArray(style) ? style : [style]),
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress || !sortable}
        style={({ hovered, pressed }: any) => [
          styles.thContent,
          (hovered || pressed) && sortable && getGlowStyles(theme, true),
          (hovered || pressed) &&
            sortable && {
              backgroundColor: theme.colors.surfaceContainerHigh,
            },
        ]}
      >
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
              <Icons
                name="chevron-up"
                size={18}
                color={theme.colors.outlineVariant}
                style={{ opacity: 0.5 }}
              />
            )}
          </View>
        )}
      </Pressable>

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

interface TdProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  width?: number;
}
const Td = ({ children, style, textStyle, width }: TdProps) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.td,
        { width: width || 150, borderRightColor: theme.colors.outlineVariant },
        ...(Array.isArray(style) ? style : [style]),
      ]}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          style={[
            styles.tdText,
            { color: theme.colors.onSurface },
            theme.typography.bodyMedium,
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
  style,
  rowStyle,
  headerStyle,
}: DataGridProps) => {
  const { theme } = useTheme();
  const [orderedColumns, setOrderedColumns] = useState(columns);

  React.useEffect(() => {
    setOrderedColumns(columns);
  }, [columns]);

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
    <Thead style={headerStyle}>
      <Tr>
        {orderedColumns.map((column, index) => (
          <Th
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
          </Th>
        ))}
      </Tr>
    </Thead>
  );

  const renderRow = ({ item, index }: { item: any; index: number }) => {
    const isOdd = index % 2 === 1;
    return (
      <Tr
        style={[
          rowStyle || {},
          isOdd ? { backgroundColor: theme.colors.surfaceVariant + "20" } : {},
          { height: density === "dense" ? 40 : 56 },
        ]}
      >
        {orderedColumns.map((column, colIndex) => (
          <Td
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
          </Td>
        ))}
      </Tr>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <Tfoot>
        <ActivityIndicator color={theme.colors.primary} />
      </Tfoot>
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
            contentContainerStyle={styles.listContent}
          />
        </View>
      </ScrollView>
    </Table>
  );
};

const styles = StyleSheet.create({
  table: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  thead: {
    borderBottomWidth: 1,
    zIndex: 10,
  },
  tbody: {
    flex: 1,
  },
  tfoot: {
    paddingVertical: 16,
    alignItems: "center",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
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
  tdText: {
    fontSize: 14,
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
  listContent: {
    flexGrow: 1,
  },
});

export default DataGrid;
