import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme, type Theme } from "@its/glowup-ui";

import { Canvas } from "../../editor/canvas/Canvas";
import { Palette } from "../../editor/canvas/Palette";
import { Toolbar } from "../../editor/canvas/Toolbar";
import { useEditor } from "../../editor/canvas/useEditor";
import type { LayoutDocument } from "../../editor/document";
import detail from "../../editor/starters/detail.json";
import { PageHead } from "../../site/Page";
import { useHydrated } from "../../site/useHydrated";

const Editor = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const editor = useEditor(detail as LayoutDocument);
  return (
    <View style={styles.screen}>
      <Toolbar editor={editor} />
      <View style={styles.canvas}>
        <Canvas editor={editor} palette={<Palette editor={editor} />} />
      </View>
    </View>
  );
};

/**
 * The layout editor (spec §1): a canvas of library components to place, move
 * and resize on a grid. It renders after hydration only: its document comes
 * from the reader's session, which the prerendered HTML cannot know (§14).
 */
export default function LayoutEditor() {
  const hydrated = useHydrated();
  return (
    <>
      <PageHead
        title="Layout editor"
        description="Compose a screen from Glowup components on a grid: drag them from the palette, move them, pull the handles to resize, nest components in the ones that hold others."
      />
      {hydrated ? <Editor /> : null}
    </>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    canvas: { flex: 1 },
  });
