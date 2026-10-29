// The cells of the grid something is being dragged over (spec §11.3): every
// empty cell, and the cells the node will land on.

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme, type Theme } from "@its/glowup-ui";

import { boxPlacement } from "../canvasMath";
import type { GridPlacement } from "../document";
import { overlaps } from "../engine";

export interface GridCellsProps {
  columns: number;
  rows: number;
  gap: number;
  rowHeight: number;
  /** What the grid's items cover: no cell is drawn there. */
  taken: GridPlacement[];
  landing: GridPlacement | null;
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
            testID={`cell-${x}-${y}`}
            style={[
              cellStyle,
              boxPlacement({ x, y, w: 1, h: 1 }, columns, rowHeight, gap),
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
}: GridCellsProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // One string per row naming its empty columns: a row is drawn again only
  // when that string changes, so crossing a cell redraws a few rows, not the
  // hundreds of cells of a long page (§18).
  const rowsFree: string[] = [];
  for (let y = 0; y < rows; y++) {
    let free = "";
    for (let x = 0; x < columns; x++) {
      const cell = { x, y, w: 1, h: 1 };
      free += taken.some((item) => overlaps(item, cell)) ? "0" : "1";
    }
    rowsFree.push(free);
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
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
          testID="landing"
          style={[
            styles.landing,
            boxPlacement(landing, columns, rowHeight, gap),
          ]}
        />
      ) : null}
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    cell: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: theme.shape.small,
    },
    // Translucent: the node is drawn dimmed underneath, at its landing cells.
    landing: {
      backgroundColor: theme.colors.primaryContainer,
      opacity: 0.6,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: theme.colors.primary,
      borderRadius: theme.shape.small,
    },
  });
