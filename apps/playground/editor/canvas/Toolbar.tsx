// The editor's toolbar (spec §2): the layout's name, undo and redo, and the
// canvas width, and the Export panel. Save arrives with its phase.

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";

import { STAGE_WIDTH_OPTIONS, type StageWidth } from "../../site/stage";
import type { Editor } from "./useEditor";

export const Toolbar = ({
  editor,
  device,
  onDevice,
  onExport,
  onLayouts,
  arrangement = "columns",
  panel = null,
  onPanel,
}: {
  /** Below 1400 dp the panels are opened from here (§17). */
  arrangement?: "columns" | "sheets" | "compact";
  panel?: "add" | "properties" | null;
  onPanel?: (panel: "add" | "properties") => void;
  editor: Editor;
  device: StageWidth;
  onDevice: (device: StageWidth) => void;
  onExport: () => void;
  onLayouts: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.bar}>
      <IconButton
        icon="folder-outline"
        accessibilityLabel="Layouts"
        onClick={onLayouts}
      />
      <Typography variant="titleMedium" style={styles.name}>
        {editor.doc.name}
      </Typography>
      <IconButton
        icon="undo"
        accessibilityLabel="Undo"
        disabled={!editor.canUndo}
        onClick={editor.undo}
      />
      <IconButton
        icon="redo"
        accessibilityLabel="Redo"
        disabled={!editor.canRedo}
        onClick={editor.redo}
      />
      {arrangement !== "columns" ? (
        <>
          <IconButton
            icon="plus-box-outline"
            accessibilityLabel="Add"
            variant={panel === "add" ? "tonal" : "standard"}
            onClick={() => onPanel?.("add")}
          />
          <IconButton
            icon="tune-variant"
            accessibilityLabel="Properties"
            variant={panel === "properties" ? "tonal" : "standard"}
            onClick={() => onPanel?.("properties")}
          />
        </>
      ) : null}
      {/* The component pages' stage widths: the page as a phone, a tablet, the
          whole canvas. Not on a phone, which is the phone. */}
      {arrangement !== "compact" ? (
        <ToggleButtonGroup
          accessibilityLabel="Canvas width"
          value={device}
          onValueChange={(value) => onDevice(value as StageWidth)}
          options={[...STAGE_WIDTH_OPTIONS]}
        />
      ) : null}
      <Button variant="tonal" iconName="export-variant" onClick={onExport}>
        Export
      </Button>
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    name: { flexGrow: 1, flexShrink: 1 },
  });
