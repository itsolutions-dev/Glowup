import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme, type Theme } from "@its/glowup-ui";

import { Canvas } from "../../editor/canvas/Canvas";
import { ExportPanel } from "../../editor/canvas/ExportPanel";
import { PropertiesPanel } from "../../editor/canvas/PropertiesPanel";
import { SidePanel } from "../../editor/canvas/SidePanel";
import { Toolbar } from "../../editor/canvas/Toolbar";
import { useEditor } from "../../editor/canvas/useEditor";
import type { LayoutDocument } from "../../editor/document";
import detail from "../../editor/starters/detail.json";
import { PageHead } from "../../site/Page";
import type { StageWidth } from "../../site/stage";
import { useHydrated } from "../../site/useHydrated";

const Editor = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const editor = useEditor(detail as LayoutDocument);
  const [device, setDevice] = useState<StageWidth>("full");
  const [exporting, setExporting] = useState(false);
  return (
    <View style={styles.screen}>
      <Toolbar
        editor={editor}
        device={device}
        onDevice={setDevice}
        onExport={() => setExporting(true)}
      />
      <ExportPanel
        editor={editor}
        device={device}
        visible={exporting}
        onClose={() => setExporting(false)}
      />
      {/* Three columns (§13): Add | Layers, the canvas, Properties. */}
      <View style={styles.columns}>
        <View style={styles.canvas}>
          <Canvas
            editor={editor}
            device={device}
            left={<SidePanel editor={editor} canDrag={device !== "phone"} />}
          />
        </View>
        <PropertiesPanel editor={editor} />
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
    columns: { flex: 1, flexDirection: "row" },
    canvas: { flex: 1 },
  });
