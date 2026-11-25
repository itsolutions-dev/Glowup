// The cells of an editable GridLayout while something is dragged over it
// (moved from the playground's layout editor): every empty cell, and the cells
// the item will land on.

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme, Theme } from "../../providers/ThemeProvider";
import { GridLayoutItem, gridItemsOverlap, itemPlacement } from "./gridLayout";

export interface GridCellsProps {
  columns: number;
  rows: number;
  gap: number;
  rowHeight: number;
  /** What the grid's other items cover: no cell is drawn there. */
  taken: GridLayoutItem[];
  landing: GridLayoutItem | null;
  /** The landing place is taken: drawn in the error colour. */
  refused?: boolean;
}

const CellRow = React.memo(function CellRow({
  y,
  free,
  columns,
  rowHeight,
  gap,
  cellStyle,
}: {
  y: number;
  /** "1" for an empty column, "0" for a taken one. */
  free: string;
  columns: number;
  rowHeight: number;
  gap: number;
  cellStyle: object;
}) {
  return (
    <>
      {[...free].map((flag, x) =>
        flag === "1" ? (
          <View
            key={x}
            style={[
              cellStyle,
              itemPlacement(
                { id: "", x, y, w: 1, h: 1 },
                columns,
                rowHeight,
                gap,
              ),
            ]}
          />
        ) : null,
      )}
    </>
  );
});

export const GridCells = ({
  columns,
  rows,
  gap,
  rowHeight,
  taken,
  landing,
  refused = false,
}: GridCellsProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // One string per row naming its empty columns: a row is drawn again only
  // when that string changes, so crossing a cell redraws a few rows.
  const rowsFree: string[] = [];
  for (let y = 0; y < rows; y++) {
    let free = "";
    for (let x = 0; x < columns; x++) {
      const cell = { x, y, w: 1, h: 1 };
      free += taken.some((item) => gridItemsOverlap(item, cell)) ? "0" : "1";
    }
    rowsFree.push(free);
  }
  return (
    <View style={[StyleSheet.absoluteFill, styles.none]}>
      {rowsFree.map((free, y) => (
        <CellRow
          key={y}
          y={y}
          free={free}
          columns={columns}
          rowHeight={rowHeight}
          gap={gap}
          cellStyle={styles.cell}
        />
      ))}
      {landing ? (
        <View
          testID="grid-landing"
          style={[
            styles.landing,
            refused && styles.refused,
            itemPlacement(landing, columns, rowHeight, gap),
          ]}
        />
      ) : null}
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    none: { pointerEvents: "none" },
    cell: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: theme.shape.small,
    },
    // Translucent: the item is drawn dimmed underneath, at its landing cells.
    landing: {
      backgroundColor: theme.colors.primaryContainer,
      opacity: 0.6,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: theme.colors.primary,
      borderRadius: theme.shape.small,
    },
    refused: {
      backgroundColor: theme.colors.errorContainer,
      borderColor: theme.colors.error,
    },
  });
