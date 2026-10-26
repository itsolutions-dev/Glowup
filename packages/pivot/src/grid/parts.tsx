// What the web and the phone grids draw alike: colours of a row, the label of a cell with an error,
// the empty and loading message, and the arrow that opens or closes a node.
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import type { useTheme } from "@its/glowup-ui";

export type ThemeColors = ReturnType<typeof useTheme>["theme"]["colors"];

export const rowColors = (
  row: { isTotal: boolean },
  colors: ThemeColors,
): { background: string; color: string } =>
  row.isTotal
    ? { background: colors.primaryContainer, color: colors.onPrimaryContainer }
    : { background: colors.surface, color: colors.onSurface };

/** What a screen reader says for a cell with a formula error (nothing for the others). */
export const cellLabel = (
  cell: { error: string | null },
  grid: Record<string, string>,
): string | undefined =>
  cell.error
    ? `${grid.formulaError || "Formula error"}: ${cell.error}`
    : undefined;

/** The props that make the label above what is announced: without `accessible` VoiceOver reads the "!" inside. */
export const cellAccess = (
  cell: { error: string | null },
  grid: Record<string, string>,
): { accessible?: true; accessibilityLabel?: string } =>
  cell.error
    ? { accessible: true, accessibilityLabel: cellLabel(cell, grid) }
    : {};

export const messageText = (
  loading: boolean,
  grid: Record<string, string>,
): string =>
  loading ? grid.loading || "Processing…" : grid.empty || "No data to display";

export const ToggleArrow = ({
  item,
  size,
  color,
  collapse,
  expand,
  onToggle,
}: {
  item: { canToggle: boolean; isExpanded: boolean; nodeKey: string };
  size: number;
  color: string;
  collapse: string;
  expand: string;
  onToggle: (nodeKey: string) => void;
}) =>
  item.canToggle ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.isExpanded ? collapse : expand}
      // On the phone the native animation moves the arrows without telling JavaScript, so the zone
      // Pressability measures at the touch is where the arrow was before the scroll, as far from the
      // finger as the grid has scrolled. With the default margin the first small move of the finger
      // counted as leaving the arrow and the press was dropped. A real drag is still not a press:
      // the scroll view takes the touch and cancels it.
      pressRetentionOffset={Infinity}
      onPress={() => onToggle(item.nodeKey)}
      style={[styles.arrow, { width: size }]}
    >
      <Text style={{ color }}>{item.isExpanded ? "▾" : "▸"}</Text>
    </Pressable>
  ) : null;

const styles = StyleSheet.create({
  arrow: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
});
