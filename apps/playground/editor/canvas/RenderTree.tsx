// The canvas's render tree (spec §11.1): the document drawn with the real
// library components on GridLayouts, inert. It also measures what the edit
// layer cannot compute: where a container's inner grid sits inside it, where a
// flow child sits inside its container, and how tall each node's content is.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import * as GlowupUI from "@its/glowup-ui";
import {
  GridLayout,
  gridLayoutHeight,
  Tabs,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";

import type {
  GridSettings,
  LayoutDocument,
  LayoutNode,
  NodeId,
} from "../document";
import { shownTab } from "../canvasMath";
import { entryFor } from "../manifest";
import { createRects, RectsProvider, useRects, type Rect } from "./rects";

const COMPONENTS = GlowupUI as unknown as Record<
  string,
  React.ComponentType<Record<string, unknown>>
>;

const noop = () => {};
const NO_TABS: Record<NodeId, number> = {};

interface Tree {
  grid: GridSettings;
  dimmed: NodeId | null;
  tabs: Record<NodeId, number>;
  onContentHeight?: (id: NodeId, height: number) => void;
}

const TreeContext = createContext<Tree | null>(null);
/** The frame of the node whose body is being drawn: what offsets are measured against. */
const ParentFrame = createContext<RefObject<View | null> | null>(null);

/** Where `view` sits inside `frame`, both measured in the window. */
const offsetIn = (
  view: View | null,
  frame: View | null | undefined,
  done: (rect: Rect) => void,
) => {
  if (!view || !frame) return;
  frame.measureInWindow((fx, fy) =>
    view.measureInWindow((x, y, width, height) =>
      done({ x: x - fx, y: y - fy, width, height }),
    ),
  );
};

const Placeholder = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.placeholder}>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        Drop components here
      </Typography>
    </View>
  );
};

/** One grid of placed nodes: the page's, a container's, a tab panel's. */
const Grid = ({ nodes, columns }: { nodes: LayoutNode[]; columns: number }) => {
  const tree = useContext(TreeContext) as Tree;
  const placed = nodes.filter((node) => node.layout);
  return (
    <GridLayout
      layout={placed.map((node) => ({ id: node.id, ...node.layout! }))}
      columns={columns}
      rowHeight={tree.grid.rowHeight}
      gap={tree.grid.gap}
      stackBelow="compact"
    >
      {placed.map((node) => (
        <NodeView key={node.id} node={node} />
      ))}
    </GridLayout>
  );
};

/** A view measured against the frame of the node being drawn, into `rectKey`. */
const Measured = ({
  rectKey,
  watch,
  ...view
}: React.ComponentProps<typeof View> & {
  rectKey: string;
  /** onLayout misses a move on the web (a size change only): measured again when this changes. */
  watch: unknown;
}) => {
  const frame = useContext(ParentFrame);
  const ref = useRef<View>(null);
  const rects = useRects();
  const measure = () =>
    offsetIn(ref.current, frame?.current, (rect) => rects.set(rectKey, rect));
  useEffect(measure, [watch]); // eslint-disable-line react-hooks/exhaustive-deps
  return <View ref={ref} onLayout={measure} {...view} />;
};

/** A container's own grid, measured against the container's frame. */
const InnerGrid = ({
  id,
  nodes,
  columns,
  minHeight,
}: {
  id: NodeId;
  nodes: LayoutNode[];
  columns: number;
  minHeight?: number;
}) => (
  <Measured
    rectKey={`inner:${id}`}
    watch={nodes}
    testID={`inner-${id}`}
    style={{ minHeight }}
  >
    {nodes.length > 0 ? (
      <Grid nodes={nodes} columns={columns} />
    ) : (
      <Placeholder />
    )}
  </Measured>
);

/** The props a node is drawn with: its own, over a controlled pair's starting value. */
const propsOf = (node: LayoutNode): Record<string, unknown> => {
  const controlled = entryFor(node.type)?.controlled;
  return {
    ...(controlled
      ? { [controlled.value]: controlled.initial, [controlled.onChange]: noop }
      : {}),
    ...node.props,
  };
};

const Body = ({ node }: { node: LayoutNode }) => {
  const tree = useContext(TreeContext) as Tree;
  const entry = entryFor(node.type);
  const props = propsOf(node);
  const fill = [styles.fill, props.style];

  if (entry?.kind === "tabs") {
    const panels = node.tabs ?? [];
    const shown = shownTab(node, tree.tabs);
    const panel = panels[shown];
    // As tall as the tallest panel: switching tabs never moves the page (§11.5).
    const tallest = Math.max(
      0,
      ...panels.map((p) =>
        gridLayoutHeight(
          p.children.flatMap((c) =>
            c.layout ? [{ id: c.id, ...c.layout }] : [],
          ),
          tree.grid.rowHeight,
          tree.grid.gap,
        ),
      ),
    );
    return (
      <View style={styles.fill}>
        {/* Measured for the edit layer's tab targets: the tabs share the width equally. */}
        <Measured
          rectKey={`bar:${node.id}`}
          watch={panels}
          testID={`bar-${node.id}`}
        >
          <Tabs
            tabs={panels.map((tab) => tab.label)}
            activeTab={shown}
            onChange={noop}
          />
        </Measured>
        {panel ? (
          <InnerGrid
            id={node.id}
            nodes={panel.children}
            columns={panel.columns}
            minHeight={tallest}
          />
        ) : null}
      </View>
    );
  }

  const Component = COMPONENTS[node.type];
  if (!Component) return null;

  if (entry?.kind === "grid") {
    return (
      <Component
        {...props}
        {...(entry.form ? { onSubmit: noop } : {})}
        style={fill}
      >
        <InnerGrid
          id={node.id}
          nodes={node.children ?? []}
          columns={node.columns ?? 1}
        />
      </Component>
    );
  }
  if (entry?.kind === "flow") {
    const children = node.children ?? [];
    return (
      <Component {...props} style={fill}>
        {children.length > 0 ? (
          children.map((child) => (
            <NodeView key={child.id} node={child} inFlow container={node} />
          ))
        ) : (
          <Placeholder />
        )}
      </Component>
    );
  }
  if (entry?.kind === "text") {
    return <Component {...props}>{node.text}</Component>;
  }
  return <Component {...props} />;
};

/** A node in its frame. Memoised by node object: an untouched subtree stays put (§18). */
const NodeView = React.memo(function NodeView({
  node,
  inFlow = false,
  container,
}: {
  node: LayoutNode;
  inFlow?: boolean;
  /** A flow child's container: when it changes, the child may have moved. */
  container?: LayoutNode;
}) {
  const tree = useContext(TreeContext) as Tree;
  const parent = useContext(ParentFrame);
  const frame = useRef<View>(null);
  const rects = useRects();
  const measured = useRef<{ node: LayoutNode; height: number } | null>(null);

  // Measured while nobody listened (a draft is drawn during a drag): told
  // again when the listener comes back, since a drop that keeps the draft's
  // layout fires no new layout event. Only if it was measured on this very
  // node object: the canvas commits the draft it drew, so a drop keeps the
  // objects, while a cancelled drag shows the old ones again.
  const { onContentHeight } = tree;
  useEffect(() => {
    const last = measured.current;
    if (last && last.node === node) onContentHeight?.(node.id, last.height);
  }, [onContentHeight, node]);

  const measureOffset = () => {
    if (inFlow) {
      offsetIn(frame.current, parent?.current, (rect) =>
        rects.set(`child:${node.id}`, rect),
      );
    }
  };
  // On the web onLayout reports a change of size only: a flow child moved by
  // a sibling (deleted, added, grown) is measured again whenever its
  // container changes.
  useEffect(measureOffset, [container]); // eslint-disable-line react-hooks/exhaustive-deps

  const onLayout = (event: LayoutChangeEvent) => {
    measured.current = { node, height: event.nativeEvent.layout.height };
    tree.onContentHeight?.(node.id, measured.current.height);
    measureOffset();
  };

  return (
    <View
      ref={frame}
      testID={`frame-${node.id}`}
      onLayout={onLayout}
      style={[
        node.layout && styles.fill,
        tree.dimmed === node.id && styles.dimmed,
      ]}
    >
      <ParentFrame.Provider value={frame}>
        <Body node={node} />
      </ParentFrame.Provider>
    </View>
  );
});

export interface RenderTreeProps {
  doc: LayoutDocument;
  /** The node drawn at its landing cells while it is dragged (§11.3.3). */
  dimmed?: NodeId | null;
  /** The panel shown of each TabbedPanel (the first by default). */
  tabs?: Record<NodeId, number>;
  onContentHeight?: (id: NodeId, height: number) => void;
}

export const RenderTree = ({
  doc,
  dimmed = null,
  tabs = NO_TABS,
  onContentHeight,
}: RenderTreeProps) => {
  const tree = useMemo(
    () => ({ grid: doc.grid, dimmed, tabs, onContentHeight }),
    [doc.grid, dimmed, tabs, onContentHeight],
  );
  return (
    <View testID="canvas-render" pointerEvents="none">
      <TreeContext.Provider value={tree}>
        <Grid nodes={doc.items} columns={doc.grid.columns} />
      </TreeContext.Provider>
    </View>
  );
};

/** A node drawn alone, at its box's size: what follows the pointer while it is dragged. */
export const NodePreview = ({
  node,
  grid,
}: {
  node: LayoutNode;
  grid: GridSettings;
}) => {
  const rects = useMemo(() => createRects(), []);
  const tree = useMemo(() => ({ grid, dimmed: null, tabs: NO_TABS }), [grid]);
  return (
    <RectsProvider value={rects}>
      <TreeContext.Provider value={tree}>
        <View pointerEvents="none" style={styles.fill}>
          <Body node={node} />
        </View>
      </TreeContext.Provider>
    </RectsProvider>
  );
};

// A grid-placed node fills its cells (its item grows past them when the
// content is taller, which is what the canvas measures to grow a container).
const styles = StyleSheet.create({
  fill: { flexGrow: 1 },
  dimmed: { opacity: 0.5 },
});

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    placeholder: {
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.shape.small,
    },
  });
