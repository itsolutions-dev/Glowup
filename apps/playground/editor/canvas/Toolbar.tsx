// The editor's toolbar (spec §2): the layout's name, undo and redo. Width,
// preview, export and save arrive with their phases.

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Typography, useTheme, type Theme } from "@its/glowup-ui";

import type { Editor } from "./useEditor";

export const Toolbar = ({ editor }: { editor: Editor }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.bar}>
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
