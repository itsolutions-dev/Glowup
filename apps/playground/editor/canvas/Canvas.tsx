// The canvas: the render tree with the edit layer over it, in a scroll view
// that scrolls by itself while something is dragged near its edges (§17).
//
// While a node is dragged, the render tree draws a draft — the document with
// the node at its landing cells and what it lands on pushed down — and the
// edit layer draws that grid's cells. The edit layer's boxes and zones stay on
// the committed document: zones that moved with the draft would pull the
// target out from under the pointer and back, and the dragged box would be
// unmounted when the draft moved it to another grid.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { StyleSheet, View } from "react-native";
import {
  DragDropProvider,
  ScrollArea,
  useDragScroll,
  useDragState,
  type DragEndEvent,
} from "@its/glowup-ui";

import {
  applyPlan,
  dropTarget,
  pageRows,
  targetKey,
  type DropPlan,
} from "../canvasMath";
import {
  findNode,
  slotNodes,
  slotOf,
  type GridPlacement,
  type LayoutDocument,
  type NodeId,
} from "../document";
import { entryFor } from "../manifest";
import { growToFit, placeNode, slotKey } from "../operations";
import { EditLayer, type Landing, type ResizeHandler } from "./EditLayer";
import { RenderTree } from "./RenderTree";
import { createRects, RectsProvider } from "./rects";
import type { Editor } from "./useEditor";

const GROWS = new Set(["grid", "flow", "tabs"]);

/** The height of `rows` rows with the gaps between them. */
const rowsHeight = (doc: LayoutDocument, rows: number) =>
  rows * doc.grid.rowHeight + (rows - 1) * doc.grid.gap;

/**
 * Where the dragged node would land, as one object per landing place: the
 * caller re-renders once per cell crossed, not once per pixel (§18).
 */
const useDropPlan = (doc: LayoutDocument): DropPlan | null => {
  const last = useRef<{ key: string | null; plan: DropPlan | null }>({
    key: null,
    plan: null,
  });
  return useDragState((state) => {
    const plan = state.active
      ? dropTarget(doc, state.active, state.over)
      : null;
    const key = targetKey(plan);
    if (key !== last.current.key) last.current = { key, plan };
    return last.current.plan;
  });
};

/** The draft on screen, by the gesture that made it: what a drop or a let-go commits. */
type Drawn = MutableRefObject<{
  key: string;
  doc: LayoutDocument;
  id: NodeId;
} | null>;

const resizeKey = (id: NodeId, p: GridPlacement) =>
  "resize:" + id + ":" + [p.x, p.y, p.w, p.h].join(",");

const CanvasBody = ({
  editor,
  drawnRef,
}: {
  editor: Editor;
  drawnRef: Drawn;
}) => {
  const scroll = useDragScroll();
  const { doc, amend } = editor;
  const plan = useDropPlan(doc);

  // A resize in progress: drawn like a move, committed when let go (§11.4).
  const [resizing, setResizing] = useState<{
    id: NodeId;
    placement: GridPlacement;
  } | null>(null);
  const { apply } = editor;
  const onResize = useCallback<ResizeHandler>(
    (id, placement, done) => {
      if (!done) {
        // Once per cell: a move inside the same cell keeps the same draft.
        return setResizing((prev) =>
          prev &&
          resizeKey(prev.id, prev.placement) === resizeKey(id, placement)
            ? prev
            : { id, placement },
        );
      }
      setResizing(null);
      const key = resizeKey(id, placement);
      apply(
        drawnRef.current?.key === key
          ? drawnRef.current.doc
          : placeNode(doc, id, placement),
      );
    },
    [apply, doc, drawnRef],
  );
  const onResizeCancel = useCallback(() => setResizing(null), []);
  const [pageWidth, setPageWidth] = useState(0);

  // The draft, and the node it places.
  const placed = useMemo(() => {
    if (plan) return applyPlan(doc, plan);
    if (resizing) {
      return {
        doc: placeNode(doc, resizing.id, resizing.placement),
        id: resizing.id,
      };
    }
    return null;
  }, [doc, plan, resizing]);
  const draft = placed?.doc ?? null;
  // Committing the very draft that was drawn keeps its node objects, so the
  // heights the render tree measured on it still count (and a cancelled
  // gesture's do not: the old objects come back).
  useEffect(() => {
    const key = plan
      ? targetKey(plan)
      : resizing
        ? resizeKey(resizing.id, resizing.placement)
        : null;
    drawnRef.current = placed && key ? { key, ...placed } : null;
  }, [placed, drawnRef, plan, resizing]);
  const landing = useMemo((): Landing | null => {
    const id = placed?.id;
    const slot = plan?.dest.slot ?? (id ? slotOf(doc, id) : null);
    const placement = id && draft ? findNode(draft, id)?.layout : null;
    if (!id || !slot || !draft || !placement) return null;
    return {
      slot: slotKey(slot),
      placement,
      // The node itself too: no cell is drawn over it, its landing rect is.
      taken: slotNodes(draft, slot).flatMap((node) =>
        node.layout ? [node.layout] : [],
      ),
      pageRows: pageRows(draft, true),
      moving: plan !== null,
    };
  }, [doc, draft, placed, plan]);

  // A container grows to hold its content (§11.3.5), folded into the edit
  // that made it grow. Leaves never grow: their content scrolls in them. A
  // draft's measurements are not the document's: they wait for the drop.
  const onContentHeight = useCallback(
    (id: NodeId, height: number) => {
      amend((current) => {
        const node = findNode(current, id);
        return node && GROWS.has(entryFor(node.type)?.kind ?? "")
          ? growToFit(current, id, height)
          : current;
      });
    },
    [amend],
  );

  const shown = draft ?? doc;
  return (
    <ScrollArea
      {...scroll}
      style={styles.scroller}
      contentContainerStyle={styles.content}
    >
      <View
        style={{
          minHeight: rowsHeight(doc, pageRows(shown, draft !== null)),
        }}
      >
        <RenderTree
          doc={shown}
          dimmed={plan && placed ? placed.id : null}
          tabs={editor.tabs}
          onContentHeight={draft ? undefined : onContentHeight}
        />
        <View
          testID="edit-layer"
          style={StyleSheet.absoluteFill}
          onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}
        >
          <EditLayer
            doc={doc}
            editor={editor}
            landing={landing}
            pageWidth={pageWidth}
            onResize={onResize}
            onResizeCancel={onResizeCancel}
          />
        </View>
      </View>
    </ScrollArea>
  );
};

export const Canvas = ({
  editor,
  palette,
}: {
  editor: Editor;
  /** Drawn beside the canvas, inside its drag and drop: what it adds from. */
  palette?: React.ReactNode;
}) => {
  const rects = useMemo(() => createRects(), []);
  const drawnRef: Drawn = useRef(null);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const plan = dropTarget(editor.doc, active, over);
    if (!plan) return;
    const drawn = drawnRef.current;
    const placed =
      drawn?.key === targetKey(plan) ? drawn : applyPlan(editor.doc, plan);
    editor.apply(placed.doc);
    if (plan.source.kind === "new" && placed.id) editor.select(placed.id);
    // Dropped on a tab: its panel is shown, with the node in it.
    const { slot } = plan.dest;
    if (slot.kind === "tab") editor.showTab(slot.parent, slot.tab);
  };
  return (
    <RectsProvider value={rects}>
      <DragDropProvider onDragEnd={onDragEnd}>
        <View style={styles.row}>
          {palette}
          <CanvasBody editor={editor} drawnRef={drawnRef} />
        </View>
      </DragDropProvider>
    </RectsProvider>
  );
};

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: "row" },
  scroller: { flexGrow: 1, flexShrink: 1 },
  // Room above the top row for a selected node's label and buttons, which a
  // scroll view would otherwise clip; room below for the last row's handles.
  content: { paddingTop: 48, paddingBottom: 24, paddingHorizontal: 24 },
});
