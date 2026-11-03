// Resize handles on a selected node placed on a grid (spec §11.4): diamonds on
// the middle of each edge, squares on the corners. Resizing is not a drop, so
// each handle is a plain pan through the responder system.

import React, { useEffect, useMemo, useRef } from "react";
import {
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";
import { useTheme, type Theme } from "@its/glowup-ui";

import type { Handle } from "../canvasMath";

const SIZE = 12;
/** Out to 24 dp on every side of a 12 dp handle. */
const SLOP = { top: 6, right: 6, bottom: 6, left: 6 };
const HALF = -SIZE / 2;

const PLACES: Record<Handle, ViewStyle> = {
  n: { top: HALF, left: "50%", marginLeft: HALF },
  s: { bottom: HALF, left: "50%", marginLeft: HALF },
  e: { right: HALF, top: "50%", marginTop: HALF },
  w: { left: HALF, top: "50%", marginTop: HALF },
  ne: { top: HALF, right: HALF },
  nw: { top: HALF, left: HALF },
  se: { bottom: HALF, right: HALF },
  sw: { bottom: HALF, left: HALF },
};
const HANDLES = Object.keys(PLACES) as Handle[];

/** The web cursor of each handle: the axis, or the diagonal, it pulls along. */
const CURSORS: Record<Handle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

/**
 * On the web, the handle's cursor over the whole page while it is pulled (or
 * the page's own again, with null): the pointer leaves the 12 dp handle at
 * once, and the boxes it crosses have a cursor of their own.
 */
const holdCursor = (cursor: string | null) => {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const id = "glowup-resize-cursor";
  document.getElementById(id)?.remove();
  if (!cursor) return;
  const rule = document.createElement("style");
  rule.id = id;
  rule.textContent = `* { cursor: ${cursor} !important; }`;
  document.head.appendChild(rule);
};

export interface ResizeHandlesProps {
  /** Called as the pan moves, and once more with `done` when it is let go. */
  onResize: (handle: Handle, dx: number, dy: number, done: boolean) => void;
  /** The system took the touch: the resize is called off. */
  onCancel: () => void;
}

const Grip = ({
  handle,
  onResize,
  onCancel,
  styles,
}: ResizeHandlesProps & {
  handle: Handle;
  styles: ReturnType<typeof makeStyles>;
}) => {
  const start = useRef({ x: 0, y: 0 });
  const delta = (event: GestureResponderEvent) => [
    event.nativeEvent.pageX - start.current.x,
    event.nativeEvent.pageY - start.current.y,
  ];
  return (
    <View
      accessibilityLabel={`Resize ${handle}`}
      hitSlop={SLOP}
      style={[
        styles.handle,
        handle.length === 1 && styles.diamond,
        PLACES[handle],
        Platform.OS === "web" &&
          ({ cursor: CURSORS[handle] } as unknown as ViewStyle),
      ]}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => {
        holdCursor(CURSORS[handle]);
        start.current = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
        };
      }}
      onResponderMove={(event) => {
        const [dx, dy] = delta(event);
        onResize(handle, dx, dy, false);
      }}
      onResponderRelease={(event) => {
        holdCursor(null);
        const [dx, dy] = delta(event);
        onResize(handle, dx, dy, true);
      }}
      onResponderTerminate={() => {
        holdCursor(null);
        onCancel();
      }}
    />
  );
};

export const ResizeHandles = (props: ResizeHandlesProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Unmounted mid-pull (the selection went away): the page gets its cursor back.
  useEffect(() => () => holdCursor(null), []);
  return (
    <>
      {HANDLES.map((handle) => (
        <Grip key={handle} handle={handle} styles={styles} {...props} />
      ))}
    </>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    handle: {
      position: "absolute",
      width: SIZE,
      height: SIZE,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    diamond: { transform: [{ rotate: "45deg" }] },
  });
