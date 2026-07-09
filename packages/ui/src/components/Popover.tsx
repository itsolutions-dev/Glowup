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

interface PopoverProps {
  anchor: React.ReactElement;
  children: React.ReactNode;
  visible: boolean;
  onDismiss: () => void;
  matchAnchorWidth?: boolean;
}

const Popover = ({
  anchor,
  children,
  visible,
  onDismiss,
  matchAnchorWidth,
}: PopoverProps) => {
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
      requestAnimationFrame(updatePosition);
      return () => clearTimeout(timer);
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
    const width = matchAnchorWidth
      ? anchorCoords.width
      : contentSize.width || 200;
    const height = contentSize.height || 100;

    return getSafePosition(anchorCoords, { width, height }, window);
  }, [anchorCoords, contentSize, window, matchAnchorWidth]);

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
              setContentSize({ width, height });
            }}
            style={[
              styles.popoverCard,
              {
                backgroundColor: theme.colors.surfaceContainerLow,
                ...pos,
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

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "transparent",
    },
    popoverCard: {
      position: "absolute",
      borderRadius: 12,
      /*       minWidth: 200,
      paddingVertical: 8,
      elevation: 6,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12, */
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
    item: {
      padding: 12,
      paddingHorizontal: 16,
    },
  });

type PositionResult = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
};

export const getSafePosition = (
  anchor: { x: number; y: number; width: number; height: number },
  popoverSize: { width: number; height: number },
  window: { width: number; height: number },
  margin: number = 16,
): PositionResult => {
  const gap = 8;
  let top: number | undefined = anchor.y + anchor.height + gap;
  let bottom: number | undefined = undefined;

  if (top + popoverSize.height > window.height - margin) {
    top = undefined;
    bottom = window.height - anchor.y + gap;
  }

  let left = anchor.x;

  const maxWidth = window.width - margin * 2;
  const actualWidth = Math.min(popoverSize.width, maxWidth);

  if (left + actualWidth > window.width - margin) {
    left = window.width - actualWidth - margin;
  }

  left = Math.max(margin, left);

  return { top, bottom, left, width: actualWidth };
};
