// The canvas's edit layer (spec §11.1): one transparent box per node over the
// render tree, nested like the document. The boxes do the editing — each is a
// Draggable, the page and every grid container a Droppable that places by
// position — and the selected one carries the chrome of §11.2.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Draggable,
  Droppable,
  IconButton,
  Typography,
  useDragState,
  useTheme,
  type DragItem,
  type Theme,
} from "@its/glowup-ui";

import {
  boxPlacement,
  cellPitch,
  resizePlacement,
  shownTab,
  type NodeDragData,
} from "../canvasMath";
import {
  slotOf,
  type GridPlacement,
  type LayoutDocument,
  type LayoutNode,
  type NodeId,
  type Slot,
} from "../document";
import { extent } from "../engine";
import { entryFor } from "../manifest";
import {
  canPlace,
  duplicateNode,
  removeNode,
  slotColumns,
  slotKey,
} from "../operations";
import { ResizeHandles } from "./ResizeHandles";
import { GridCells } from "./GridCells";
import { NodePreview } from "./RenderTree";
import { useRect, useRects } from "./rects";
import type { Editor } from "./useEditor";

/** Where a dragged node will land, drawn on the grid it is over. */
export interface Landing {
  slot: string;
  placement: GridPlacement;
  /** That grid's items, the node included, as the draft places them. */
  taken: GridPlacement[];
  /** How many rows the page shows while dragging. */
  pageRows: number;
  /** A move, not a resize: the selection chrome waits for the drop. */
  moving: boolean;
}

/** A resize in progress (`done` false) or let go (`done` true). */
export type ResizeHandler = (
  id: NodeId,
  placement: GridPlacement,
  done: boolean,
) => void;

interface Layer {
  doc: LayoutDocument;
  editor: Editor;
  pageWidth: number;
  onResize: ResizeHandler;
  onResizeCancel: () => void;
  styles: ReturnType<typeof makeStyles>;
}

const LayerContext = createContext<Layer | null>(null);
/**
 * Apart from the rest: it changes once per cell crossed, and only the cells
 * and the selected box's chrome read it, so the other boxes stay put (§18).
 */
const LandingContext = createContext<Landing | null>(null);
const useLayer = () => useContext(LayerContext) as Layer;

const PAGE: Slot = { kind: "page" };
const FILL = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

/** A zone takes what its slot can hold (the manifest's `accepts`, no Form in a Form). */
const accepting = (doc: LayoutDocument, slot: Slot) => (item: DragItem) =>
  canPlace(doc, (item.data as NodeDragData).type, slot, item.id);

/** Hovering a tab while dragging shows its panel after this long (§11.5). */
const HOVER_TO_SWITCH = 500;

/** The cells of a zone, drawn only while a node is about to land on it. */
const ZoneCells = ({
  slot,
  columns,
  height,
}: {
  slot: Slot;
  columns: number;
  height?: number;
}) => {
  const { doc } = useLayer();
  const landing = useContext(LandingContext);
  if (!landing || landing.slot !== slotKey(slot)) return null;
  const { rowHeight, gap } = doc.grid;
  const reach = extent([...landing.taken, landing.placement]).rows;
  const rows =
    slot.kind === "page"
      ? landing.pageRows
      : Math.max(reach, Math.floor(((height ?? 0) + gap) / (rowHeight + gap)));
  return (
    <GridCells
      columns={columns}
      rows={rows}
      gap={gap}
      rowHeight={rowHeight}
      taken={landing.taken}
      landing={landing.placement}
    />
  );
};

const Chrome = ({ node }: { node: LayoutNode }) => {
  const { doc, editor, styles, pageWidth, onResize, onResizeCancel } =
    useLayer();
  const rects = useRects();
  const { layout } = node;
  const slot = slotOf(doc, node.id);
  const columns = slot ? slotColumns(doc, slot) : null;
  // A cell of the grid the node sits on: the page's, or its container's inner grid.
  const width =
    slot?.kind === "page"
      ? pageWidth
      : slot
        ? (rects.get(`inner:${slot.parent}`)?.width ?? 0)
        : 0;
  return (
    <>
      {layout && columns ? (
        <ResizeHandles
          onResize={(handle, dx, dy, done) =>
            onResize(
              node.id,
              resizePlacement(
                layout,
                handle,
                dx,
                dy,
                cellPitch(width, columns, doc.grid),
              ),
              done,
            )
          }
          onCancel={onResizeCancel}
        />
      ) : null}
      <View pointerEvents="none" style={styles.selected} />
      <Typography variant="labelSmall" style={styles.label}>
        {node.type}
      </Typography>
      <View style={styles.actions}>
        <IconButton
          icon="content-copy"
          size="small"
          accessibilityLabel="Duplicate"
          onClick={() => {
            const copy = duplicateNode(doc, node.id);
            editor.apply(copy.doc);
            if (copy.id) editor.select(copy.id);
          }}
        />
        <IconButton
          icon="delete-outline"
          size="small"
          accessibilityLabel="Delete"
          onClick={() => editor.apply(removeNode(doc, node.id))}
        />
      </View>
    </>
  );
};

/** The chrome, but not during a move (the box stays where it was); during a resize it stays (its handle is the one being pulled). */
const ChromeUnlessMoving = ({ node }: { node: LayoutNode }) =>
  useContext(LandingContext)?.moving ? null : <Chrome node={node} />;

/** A grid container's (or the shown tab panel's) own grid, where the render tree measured it. */
const InnerZone = ({
  node,
  slot,
  nodes,
  columns,
  zoneId = node.id,
  hidden = false,
}: {
  node: LayoutNode;
  slot: Slot;
  nodes: LayoutNode[];
  columns: number;
  zoneId?: string;
  /** A TabbedPanel's panel not shown: mounted, but neither drawn nor a target. */
  hidden?: boolean;
}) => {
  const { doc } = useLayer();
  const rect = useRect(`inner:${node.id}`);
  if (!rect) return null;
  return (
    <View
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        display: hidden ? "none" : "flex",
      }}
    >
      <Droppable
        id={zoneId}
        testID={`zone-${zoneId}`}
        disabled={hidden}
        data={{ kind: "grid", slot }}
        indicator={false}
        accept={accepting(doc, slot)}
        style={StyleSheet.absoluteFill}
      >
        <ZoneCells slot={slot} columns={columns} height={rect.height} />
        <Boxes nodes={nodes} columns={columns} />
      </Droppable>
    </View>
  );
};

/**
 * A TabbedPanel's tabs, over the bar the render tree measured: a tap shows
 * that panel; each tab is also a zone that drops on its panel.
 */
const TabTargets = ({ node }: { node: LayoutNode }) => {
  const { doc, editor, styles } = useLayer();
  const rect = useRect(`bar:${node.id}`);
  if (!rect) return null;
  return (
    <View
      style={[
        styles.bar,
        { left: rect.x, top: rect.y, width: rect.width, height: rect.height },
      ]}
    >
      {(node.tabs ?? []).map((tab, i) => (
        <TabTarget
          key={i}
          parent={node.id}
          tab={i}
          label={tab.label}
          doc={doc}
          showTab={editor.showTab}
          select={editor.select}
          style={styles.tab}
        />
      ))}
    </View>
  );
};

const TabTarget = ({
  parent,
  tab,
  label,
  doc,
  showTab,
  select,
  style,
}: {
  parent: NodeId;
  tab: number;
  label: string;
  doc: LayoutDocument;
  showTab: Editor["showTab"];
  select: Editor["select"];
  style: React.ComponentProps<typeof View>["style"];
}) => {
  const id = `tab:${parent}:${tab}`;
  const slot: Slot = { kind: "tab", parent, tab };
  // Under a dragged item for half a second: its panel is shown. Leaving the
  // tab, or the drag ending or cancelled, clears the timer first.
  const hovered = useDragState((state) => state.over?.id === id);
  useEffect(() => {
    if (!hovered) return;
    const timer = setTimeout(() => showTab(parent, tab), HOVER_TO_SWITCH);
    return () => clearTimeout(timer);
  }, [hovered, parent, showTab, tab]);
  return (
    <Droppable
      id={id}
      testID={`tab-${parent}-${tab}`}
      data={{ kind: "tab", slot }}
      indicator={false}
      accept={accepting(doc, slot)}
      style={style}
    >
      <View
        accessibilityLabel={`${label} tab`}
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => {
          // A tap on a tab is a tap on its TabbedPanel (§11.2): selected, so
          // nothing stays selected in the panel it hides.
          select(parent);
          showTab(parent, tab);
        }}
      />
    </Droppable>
  );
};

/** A flow container's child, where the render tree measured it. */
const FlowBox = ({ node }: { node: LayoutNode }) => {
  const rect = useRect(`child:${node.id}`);
  if (!rect) return null;
  return (
    <Box
      node={node}
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
};

const Inside = ({ node }: { node: LayoutNode }) => {
  const { doc, editor } = useLayer();
  const entry = entryFor(node.type);
  const kind = entry?.kind;
  if (kind === "grid") {
    return (
      <InnerZone
        node={node}
        slot={{ kind: "children", parent: node.id }}
        nodes={node.children ?? []}
        columns={node.columns ?? 1}
      />
    );
  }
  if (kind === "tabs" && node.tabs?.length) {
    const shown = shownTab(node, editor.tabs);
    // Every panel stays mounted, the hidden ones out of sight and out of the
    // targets: a node dragged out of one panel keeps its box (unmounted, it
    // would cancel the drag) while hovering a tab shows another.
    return (
      <>
        <TabTargets node={node} />
        {node.tabs.map((panel, i) => (
          <InnerZone
            key={i}
            node={node}
            zoneId={`${node.id}:${i}`}
            hidden={i !== shown}
            slot={{ kind: "tab", parent: node.id, tab: i }}
            nodes={panel.children}
            columns={panel.columns}
          />
        ))}
      </>
    );
  }
  if (kind === "flow") {
    // Its children's boxes inside it: the drag system counts them for the
    // insertion index and draws its line between them.
    const slot: Slot = { kind: "children", parent: node.id };
    return (
      <Droppable
        id={node.id}
        testID={`zone-${node.id}`}
        data={{ kind: "flow", slot }}
        orientation={entry?.direction === "row" ? "horizontal" : "vertical"}
        accept={accepting(doc, slot)}
        style={StyleSheet.absoluteFill}
      >
        {(node.children ?? []).map((child) => (
          <FlowBox key={child.id} node={child} />
        ))}
      </Droppable>
    );
  }
  return null;
};

const Box = ({
  node,
  style,
}: {
  node: LayoutNode;
  style: React.ComponentProps<typeof View>["style"];
}) => {
  const { doc, editor, styles } = useLayer();
  const [hovered, setHovered] = useState(false);
  const selected = editor.selected === node.id;
  // Web only: React Native has no hover, and these props are ignored there.
  const hover = {
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
  } as object;
  return (
    <View
      testID={"place-" + node.id}
      style={[style, selected && styles.raised]}
      {...hover}
    >
      <Draggable
        id={node.id}
        testID={`box-${node.id}`}
        data={{ kind: "node", type: node.type } satisfies NodeDragData}
        preview={<NodePreview node={node} grid={doc.grid} />}
        accessibilityLabel={`${node.type} ${node.id}`}
        style={StyleSheet.absoluteFill}
      >
        {/* The tap is this view's, not the Draggable's onPress: a Draggable
            with onPress is a <button> on the web, and boxes nest. The
            Draggable still takes the touch over once it rests or moves, as it
            does from a Card; the innermost box's view wins a tap. */}
        <View
          testID={`tap-${node.id}`}
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => editor.select(node.id)}
        >
          <Inside node={node} />
        </View>
      </Draggable>
      {hovered && !selected ? (
        <View pointerEvents="none" style={styles.hovered} />
      ) : null}
      {selected ? <ChromeUnlessMoving node={node} /> : null}
    </View>
  );
};

/**
 * Memoised by its nodes: a drag that only moves the landing re-renders the
 * edit layer, and without this every box would follow it, once per cell (§18).
 */
const Boxes = React.memo(function Boxes({
  nodes,
  columns,
}: {
  nodes: LayoutNode[];
  columns: number;
}) {
  const { doc } = useLayer();
  return (
    <>
      {nodes.map((node) =>
        node.layout ? (
          <Box
            key={node.id}
            node={node}
            style={boxPlacement(
              node.layout,
              columns,
              doc.grid.rowHeight,
              doc.grid.gap,
            )}
          />
        ) : null,
      )}
    </>
  );
});

export const EditLayer = ({
  doc,
  editor,
  landing = null,
  pageWidth,
  onResize,
  onResizeCancel,
}: {
  doc: LayoutDocument;
  editor: Editor;
  landing?: Landing | null;
  /** The page grid's width, for a resize's cell size. */
  pageWidth: number;
  onResize: ResizeHandler;
  onResizeCancel: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const layer = useMemo(
    () => ({
      doc,
      editor,
      styles,
      pageWidth,
      onResize,
      onResizeCancel,
    }),
    [doc, editor, styles, pageWidth, onResize, onResizeCancel],
  );
  return (
    <LandingContext.Provider value={landing}>
      <LayerContext.Provider value={layer}>
        <Droppable
          id="page"
          testID="zone-page"
          data={{ kind: "grid", slot: PAGE }}
          indicator={false}
          accept={accepting(doc, PAGE)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            testID="canvas-background"
            accessibilityLabel="Clear selection"
            style={StyleSheet.absoluteFill}
            onPress={() => editor.select(null)}
          />
          <ZoneCells slot={PAGE} columns={doc.grid.columns} />
          <Boxes nodes={doc.items} columns={doc.grid.columns} />
        </Droppable>
      </LayerContext.Provider>
    </LandingContext.Provider>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    raised: { zIndex: 1 },
    bar: { position: "absolute", flexDirection: "row" },
    tab: { flex: 1 },
    selected: {
      ...FILL,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: theme.shape.small,
    },
    hovered: {
      ...FILL,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.shape.small,
    },
    label: {
      position: "absolute",
      top: -20,
      left: 0,
      color: theme.colors.primary,
    },
    actions: {
      position: "absolute",
      top: -40,
      right: 0,
      flexDirection: "row",
    },
  });
