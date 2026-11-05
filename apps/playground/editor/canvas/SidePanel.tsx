// The editor's left column (spec §2): Add (the palette) and Layers, as tabs.

import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Tabs, useTheme, type Theme } from "@its/glowup-ui";

import { LayersPanel } from "./LayersPanel";
import { Palette } from "./Palette";
import type { Editor } from "./useEditor";

export const SidePanel = ({
  editor,
  canDrag,
}: {
  editor: Editor;
  /** False at a phone's width: palette entries are pressed only (§17). */
  canDrag: boolean;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [tab, setTab] = useState(0);
  return (
    <View style={styles.panel}>
      <Tabs tabs={["Add", "Layers"]} activeTab={tab} onChange={setTab} />
      {tab === 0 ? (
        <Palette editor={editor} canDrag={canDrag} />
      ) : (
        <LayersPanel editor={editor} />
      )}
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    panel: {
      width: 280,
      borderRightWidth: 1,
      borderRightColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
  });
