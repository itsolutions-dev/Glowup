import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Banner, BottomSheet, useTheme, type Theme } from "@its/glowup-ui";

import { Canvas } from "../../editor/canvas/Canvas";
import { ExportPanel } from "../../editor/canvas/ExportPanel";
import { LayoutsDialog } from "../../editor/canvas/LayoutsDialog";
import { editorShortcuts } from "../../editor/canvas/shortcuts";
import { useAutosave, useLibrary } from "../../editor/canvas/useLibrary";
import { PropertiesPanel } from "../../editor/canvas/PropertiesPanel";
import { Sheet } from "../../editor/canvas/Sheet";
import { SidePanel } from "../../editor/canvas/SidePanel";
import { Toolbar } from "../../editor/canvas/Toolbar";
import { useEditor } from "../../editor/canvas/useEditor";
import type { LayoutDocument } from "../../editor/document";
import { removeLayout } from "../../editor/library";
import { setName } from "../../editor/operations";
import { STARTERS } from "../../editor/starters";
import { editorArrangement, useLayout } from "../../site/breakpoints";
import { PageHead } from "../../site/Page";
import { usePageShortcuts } from "../../site/pageShortcuts";
import type { Shortcut } from "../../site/useKeyboardShortcuts";
import type { StageWidth } from "../../site/stage";
import { useHydrated } from "../../site/useHydrated";

const DETAIL = STARTERS[0].doc;
const NO_SHORTCUTS: Shortcut[] = [];

const Editor = ({ lib }: { lib: ReturnType<typeof useLibrary> }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { library } = lib;
  // The open layout, or on a first visit "Pagina di dettaglio" (§12).
  const editor = useEditor(
    library.layouts.find((l) => l.id === library.open)?.doc ?? DETAIL,
  );
  useEffect(() => {
    if (!library.open) lib.add(editor.doc);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useAutosave(editor, lib);
  // Listed in the site's shortcuts dialog under "This page" (§14); none while
  // a dialog is open over the canvas, where a key must not edit what is behind.
  const [choosing, setChoosing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const modal = choosing || exporting;
  usePageShortcuts(
    useMemo(
      () => (modal ? NO_SHORTCUTS : editorShortcuts(editor)),
      [editor, modal],
    ),
  );
  const [device, setDevice] = useState<StageWidth>("full");
  // §17: three columns, side sheets, or the phone's arrangement (whose canvas
  // is the phone, whatever the width switch said).
  const arrangement = editorArrangement(useLayout().width);
  const shown: StageWidth = arrangement === "compact" ? "phone" : device;
  const [panel, setPanel] = useState<"add" | "properties" | null>(null);
  const togglePanel = (next: "add" | "properties") =>
    setPanel((open) => (open === next ? null : next));
  const [dragging, setDragging] = useState(false);
  const side = <SidePanel editor={editor} canDrag={shown !== "phone"} />;

  // Before another layout comes in, the open one is saved now: its pending
  // autosave is cleared with it.
  const leave = () => {
    if (library.open) lib.save(library.open, editor.doc);
  };
  const show = (doc: LayoutDocument) => {
    editor.load(doc);
    setChoosing(false);
  };
  return (
    <View style={styles.screen}>
      <Toolbar
        editor={editor}
        device={device}
        onDevice={setDevice}
        onExport={() => setExporting(true)}
        onLayouts={() => setChoosing(true)}
        arrangement={arrangement}
        panel={panel}
        onPanel={togglePanel}
      />
      <LayoutsDialog
        visible={choosing}
        onClose={() => setChoosing(false)}
        library={library}
        onOpen={(id) => {
          leave();
          lib.open(id);
          const layout = library.layouts.find((l) => l.id === id);
          if (layout) show(layout.doc);
        }}
        onNew={(doc) => {
          leave();
          lib.add(doc);
          show(doc);
        }}
        onRename={(id, name) =>
          // The open layout is renamed in the editor: the autosave keeps it.
          id === library.open
            ? editor.apply(setName(editor.doc, name))
            : lib.rename(id, name)
        }
        onDelete={(id) => {
          lib.remove(id);
          if (id !== library.open) return;
          // The most recent left opens, or "Pagina di dettaglio" when none is.
          const next = removeLayout(library, id);
          const layout = next.layouts.find((l) => l.id === next.open);
          if (layout) {
            show(layout.doc);
          } else {
            lib.add(DETAIL);
            show(DETAIL);
          }
        }}
      />
      <ExportPanel
        editor={editor}
        device={device}
        visible={exporting}
        onClose={() => setExporting(false)}
      />
      {arrangement === "compact" ? (
        <Banner
          visible
          icon="phone-rotate-landscape"
          message="Turn the phone sideways to move and resize"
        />
      ) : null}
      {/* Three columns (§13): Add | Layers, the canvas, Properties; below
          1400 dp the two panels open over the canvas, one at a time. */}
      <View style={styles.columns}>
        <View style={styles.canvas}>
          <Canvas
            editor={editor}
            device={shown}
            left={
              arrangement === "columns" ? (
                side
              ) : arrangement === "sheets" ? (
                <Sheet side="left" open={panel === "add"} hidden={dragging}>
                  {side}
                </Sheet>
              ) : null
            }
            onDragStart={() => setDragging(true)}
            onDragFinish={() => {
              // A drag out of the Add sheet has used it: it closes.
              setDragging(false);
              setPanel((open) => (open === "add" ? null : open));
            }}
          />
        </View>
        {arrangement === "columns" ? (
          <PropertiesPanel editor={editor} />
        ) : arrangement === "sheets" ? (
          <Sheet side="right" open={panel === "properties"} hidden={false}>
            <PropertiesPanel editor={editor} />
          </Sheet>
        ) : null}
      </View>
      {arrangement === "compact" ? (
        <>
          <BottomSheet
            visible={panel === "add"}
            onClose={() => setPanel(null)}
            title="Add"
          >
            {side}
          </BottomSheet>
          <BottomSheet
            visible={panel === "properties"}
            onClose={() => setPanel(null)}
            title="Properties"
          >
            <PropertiesPanel editor={editor} />
          </BottomSheet>
        </>
      ) : null}
    </View>
  );
};

/**
 * The layout editor (spec §1): a canvas of library components to place, move
 * and resize on a grid. It renders after hydration only: its document comes
 * from the reader's session, which the prerendered HTML cannot know (§14).
 */
/** The saved layouts first (§14): the editor starts on the open one. */
const Loaded = () => {
  const lib = useLibrary();
  return lib.ready ? <Editor lib={lib} /> : null;
};

export default function LayoutEditor() {
  const hydrated = useHydrated();
  return (
    <>
      <PageHead
        title="Layout editor"
        description="Compose a screen from Glowup components on a grid: drag them from the palette, move them, pull the handles to resize, nest components in the ones that hold others."
      />
      {hydrated ? <Loaded /> : null}
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
