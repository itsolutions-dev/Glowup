// Resize handles on a selected node placed on a grid (spec §11.4): diamonds on
// the middle of each edge, squares on the corners. Resizing is not a drop, so
// each handle is a plain pan through the responder system.

import React, { useMemo, useRef } from "react";
import {
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
      ]}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => {
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
        const [dx, dy] = delta(event);
        onResize(handle, dx, dy, true);
      }}
      onResponderTerminate={onCancel}
    />
  );
};

export const ResizeHandles = (props: ResizeHandlesProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
