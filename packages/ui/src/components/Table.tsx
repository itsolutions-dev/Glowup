import React, { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { PressableState } from "./types";

// Table primitives: the parts DataGrid is assembled from, for a table whose
// rows the caller lays out itself. They carry the table/row/columnheader/cell
// roles, so a screen reader on web can navigate them as a table.

export interface TableProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}
const Table = ({ children, style }: TableProps) => {
  const { theme } = useTheme();
  return (
    <View
      role="table"
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
}
export const TableRow = ({ children, style }: TableRowProps) => {
  const { theme } = useTheme();
  return (
    <View
      role="row"
      style={[
        styles.tr,
        { borderBottomColor: theme.colors.outlineVariant },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export interface TableHeaderCellProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  width?: number;
  onPress?: () => void;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}
export const TableHeaderCell = ({
  children,
  style,
  width,
  onPress,
  sortable,
  sortDirection,
  onMoveLeft,
  onMoveRight,
}: TableHeaderCellProps) => {
  const { theme } = useTheme();
  return (
    <View
      role="columnheader"
      style={[
        styles.th,
        { width: width || 150, borderRightColor: theme.colors.outlineVariant },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress || !sortable}
        style={({ hovered, pressed }: PressableState) => [
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

export interface TableCellProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  width?: number;
}
export const TableCell = ({
  children,
  style,
  textStyle,
  width,
}: TableCellProps) => {
  const { theme } = useTheme();
  return (
    <View
      role="cell"
      style={[
        styles.td,
        { width: width || 150, borderRightColor: theme.colors.outlineVariant },
        style,
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

const styles = StyleSheet.create({
  table: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  thead: {
    borderBottomWidth: 1,
    zIndex: 10,
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
});

export default Table;
