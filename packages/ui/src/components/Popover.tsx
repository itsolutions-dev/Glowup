import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useTheme, Theme } from "../providers/ThemeProvider";
import { placeAnchored, type AnchorPosition } from "./internal/anchorPlacement";

export type { AnchorPosition } from "./internal/anchorPlacement";

export interface PopoverProps {
  /** The element the popover opens from. It stays in the layout; the popover floats over the window. */
  anchor: React.ReactElement;
  children: React.ReactNode;
  /** Whether the popover is open. */
  visible: boolean;
  /** Called on a press outside the popover and on Android back. */
  onDismiss: () => void;
  /** Gives the popover the anchor's width instead of sizing it to its content. */
  matchAnchorWidth?: boolean;
  /**
   * Where the popover sits against its anchor: `vertical` is `"bottom"`
   * (below it), `"top"` (above it) or `"center"` (centred on it);
   * `horizontal` lines up the `"left"` edges, the `"right"` edges or the
   * `"center"`s. Whatever it asks, the popover flips or slides to stay on
   * screen. Defaults to `{ vertical: "bottom", horizontal: "left" }`.
   */
  anchorPosition?: AnchorPosition;
}

const Popover = ({
  anchor,
  children,
  visible,
  onDismiss,
  matchAnchorWidth,
  anchorPosition = { vertical: "bottom", horizontal: "left" },
}: PopoverProps) => {
  const { vertical, horizontal } = anchorPosition;
  const [anchorCoords, setAnchorCoords] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const anchorRef = useRef<View>(null);
  const window = useWindowDimensions();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const updatePosition = useCallback(() => {
    if (anchorRef.current) {
      anchorRef.current.measureInWindow((x, y, width, height) => {
        setAnchorCoords({ x, y, width, height });
      });
    }
  }, []);

  useEffect(() => {
    if (visible) {
      // Small delay ensures the keyboard or scroll position is final
      const timer = setTimeout(updatePosition, 0);
      const frame = requestAnimationFrame(updatePosition);
      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(frame);
      };
    }
  }, [visible, updatePosition]);

  useEffect(() => {
    if (visible) updatePosition();
  }, [visible, window.width, window.height, updatePosition]);

  const handleOpen = useCallback(() => {
    if (anchorRef.current) {
      anchorRef.current.measure((fx, fy, width, height, px, py) => {
        setAnchorCoords({ x: px, y: py, width, height });
      });
    }
  }, []);

  const pos = useMemo(() => {
    // Before the first onLayout, assume the widest allowed card. Assuming a
    // narrow one instead would lay the content out inside that width, so
    // onLayout would measure it back unchanged and the card could never grow.
    const width = matchAnchorWidth
      ? anchorCoords.width
      : contentSize.width || window.width;
    const height = contentSize.height || 100;

    return placeAnchored(anchorCoords, { width, height }, window, {
      vertical,
      horizontal,
    });
  }, [
    anchorCoords,
    contentSize,
    window,
    matchAnchorWidth,
    vertical,
    horizontal,
  ]);

  // matchAnchorWidth pins the card to the anchor; otherwise the measured width
  // is only a ceiling and the card sizes to its content.
  const { width: safeWidth, ...placement } = pos;
  const sizing = matchAnchorWidth
    ? { width: safeWidth }
    : { maxWidth: safeWidth };

  return (
    <View>
      <View ref={anchorRef} onLayout={handleOpen} collapsable={false}>
        {anchor}
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}
      >
        <Pressable style={styles.overlay} onPress={onDismiss}>
          <View
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              // Web reports offsetWidth, rounded to an integer: a width rounded
              // down would clip the widest row by a fraction and ellipsise it.
              setContentSize({ width: width + 1, height });
            }}
            style={[
              styles.popoverCard,
              {
                backgroundColor: theme.colors.surfaceContainerLow,
                ...placement,
                ...sizing,
                opacity: contentSize.width > 0 ? 1 : 0,
              },
            ]}
          >
            {children}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default Popover;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "transparent",
    },
    popoverCard: {
      position: "absolute",
      borderRadius: 12,
      overflow: "hidden",
      ...Platform.select({
        web: {
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          backdropFilter: "blur(10px)", // Adds a premium "glass" look
        },
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
  });
