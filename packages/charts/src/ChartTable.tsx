import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@its/glowup-ui";

export type ChartTableProps = {
  /** The column names; the first is the one over the row names and may be "". */
  header: string[];
  /** One row per category or part: the name, then a text per column. */
  rows: string[][];
  /** The row of the chart's active category or part. */
  activeRow?: number | null;
  /** A row was pressed: with it each row is a button, which is how a screen reader picks a category. */
  onRowPress?: (index: number) => void;
  /** One dot per row, to tie it to a colour of the chart. */
  rowColors?: string[];
  /** Rows shown; a long table ends in a line that says how many were left out. Default 50. */
  limit?: number;
  testID?: string;
};

/**
 * The data of a chart as a table, for reading exact values by eye or by screen reader. Each row
 * is one accessible element with the whole row as its label ("Jan, North 10, South 20"), and
 * the header row is marked as a header.
 */
export const ChartTable = ({
  header,
  rows,
  activeRow = null,
  onRowPress,
  rowColors,
  limit = 50,
  testID,
}: ChartTableProps) => {
  const { theme } = useTheme();
  const shown = rows.slice(0, limit);
  const cell = (text: string, i: number, strong: boolean) => (
    <Text
      key={i}
      style={[
        strong ? theme.typography.labelLarge : theme.typography.bodyMedium,
        i === 0 ? styles.first : styles.value,
        {
          color: strong
            ? theme.colors.onSurfaceVariant
            : theme.colors.onSurface,
        },
      ]}
      numberOfLines={1}
    >
      {text}
    </Text>
  );
  return (
    <View style={styles.table} testID={testID}>
      <View
        style={[styles.row, { borderColor: theme.colors.outlineVariant }]}
        accessibilityRole="header"
      >
        {header.map((h, i) => cell(h, i, true))}
      </View>
      {shown.map((row, r) => {
        const label = `${row[0]}, ${row
          .slice(1)
          .map((v, i) => `${header[i + 1]} ${v}`)
          .join(", ")}`;
        const content = (
          <>
            {rowColors ? (
              <View style={[styles.dot, { backgroundColor: rowColors[r] }]} />
            ) : null}
            {row.map((text, i) => cell(text, i, false))}
          </>
        );
        const style = [
          styles.row,
          { borderColor: theme.colors.outlineVariant },
          r === activeRow && { backgroundColor: theme.colors.surfaceVariant },
        ];
        return onRowPress ? (
          <Pressable
            key={r}
            testID={testID ? `${testID}-row-${r}` : undefined}
            style={style}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: r === activeRow }}
            onPress={() => onRowPress(r)}
          >
            {content}
          </Pressable>
        ) : (
          <View
            key={r}
            testID={testID ? `${testID}-row-${r}` : undefined}
            style={style}
            accessible
            accessibilityLabel={label}
          >
            {content}
          </View>
        );
      })}
      {rows.length > shown.length ? (
        <Text
          style={[
            theme.typography.bodySmall,
            styles.more,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {`${rows.length - shown.length} more rows not shown`}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  table: { marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  first: { flex: 2 },
  value: { flex: 1, textAlign: "right" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  more: { paddingTop: 8, paddingHorizontal: 4 },
});
