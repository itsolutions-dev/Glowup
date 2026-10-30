import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Modal as NativeModal,
  Animated,
  Pressable,
  ScrollView,
  View,
  StyleSheet,
  Platform,
  useWindowDimensions,
  GestureResponderEvent,
} from "react-native";
import { rgba } from "polished";
import { useTheme, Theme } from "../providers/ThemeProvider";
import { ToastLayer } from "./internal/ToastLayer";
import Typography from "./Typography";
import IconButton from "./IconButton";
import Divider from "./Divider";

export interface BottomSheetProps {
  /** Whether the sheet is open. */
  visible: boolean;
  /** Called by the close button, a tap on the scrim, a drag down past the threshold and Android back. */
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Adds a close button at the end of the title row. Defaults to `false`. */
  showCloseButton?: boolean;
  /**
   * A row of buttons fixed at the bottom, below a divider, while the content
   * above it scrolls (named like `Dialog`'s `actions`).
   */
  actions?: React.ReactNode;
  showHandle?: boolean;
  dismissOnScrimTap?: boolean;
  /** Max sheet height as a fraction of the window height. */
  maxHeightRatio?: number;
  testID?: string;
}

const DISMISS_THRESHOLD = 120;

const BottomSheet = ({
  visible,
  onClose,
  children,
  title,
  showCloseButton = false,
  actions,
  showHandle = true,
  dismissOnScrimTap = true,
  maxHeightRatio = 0.85,
  testID,
}: BottomSheetProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const window = useWindowDimensions();

  const [shouldRender, setShouldRender] = useState(visible);
  // useState lazy init: stable Animated.Value, works on react-native-web
  // (which does not export useAnimatedValue) and passes react-hooks/refs
  const [translateY] = useState(() => new Animated.Value(0));
  const [scrimOpacity] = useState(() => new Animated.Value(0));
  const dragStartY = useRef(0);
  // Read by the open/close animation without being one of its triggers:
  // resizing the window while the sheet is open must not replay the entrance.
  const windowHeight = useRef(window.height);
  useEffect(() => {
    windowHeight.current = window.height;
  }, [window.height]);

  // Mount as soon as it becomes visible (render-time adjustment)
  if (visible && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (visible) {
      translateY.setValue(windowHeight.current);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }),
        Animated.timing(scrimOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: windowHeight.current,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scrimOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, translateY, scrimOpacity]);

  const handleDragStart = useCallback((event: GestureResponderEvent) => {
    dragStartY.current = event.nativeEvent.pageY;
  }, []);

  const handleDragMove = useCallback(
    (event: GestureResponderEvent) => {
      const dy = event.nativeEvent.pageY - dragStartY.current;
      translateY.setValue(Math.max(0, dy));
    },
    [translateY],
  );

  const handleDragEnd = useCallback(
    (event: GestureResponderEvent) => {
      const dy = event.nativeEvent.pageY - dragStartY.current;
      if (dy > DISMISS_THRESHOLD) {
        onClose();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }).start();
      }
    },
    [translateY, onClose],
  );

  if (!shouldRender) return null;

  return (
    <NativeModal
      visible={shouldRender}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root} testID={testID}>
        <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissOnScrimTap ? onClose : undefined}
            accessibilityLabel="Close bottom sheet"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: window.height * maxHeightRatio,
              transform: [{ translateY }],
            },
          ]}
          accessibilityViewIsModal
        >
          {showHandle && (
            <View
              style={styles.handleArea}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={handleDragStart}
              onResponderMove={handleDragMove}
              onResponderRelease={handleDragEnd}
              onResponderTerminate={handleDragEnd}
            >
              <View style={styles.handle} />
            </View>
          )}

          {(!!title || showCloseButton) && (
            <View style={styles.header}>
              <Typography
                variant="titleLarge"
                accessibilityRole="header"
                numberOfLines={1}
                style={[styles.title, showCloseButton && styles.titleStart]}
              >
                {title ?? ""}
              </Typography>
              {showCloseButton && (
                <IconButton
                  icon="close"
                  accessibilityLabel="Close"
                  onClick={onClose}
                />
              )}
            </View>
          )}

          {/* Scrolls on its own, so a tall sheet keeps its actions in view. */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {actions != null && (
            <>
              <Divider />
              <View style={styles.actions}>{actions}</View>
            </>
          )}
        </Animated.View>
        <ToastLayer active={visible} />
      </View>
    </NativeModal>
  );
};

export default BottomSheet;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: "flex-end",
    },
    scrim: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: rgba(theme.colors.scrim, 0.5),
    },
    sheet: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderTopLeftRadius: theme.shape.extraLarge,
      borderTopRightRadius: theme.shape.extraLarge,
      paddingBottom: theme.spacing.l,
      width: "100%",
      alignSelf: "center",
      maxWidth: 640,
      ...Platform.select({
        web: {
          boxShadow: `0 -4px 20px ${rgba(theme.colors.shadow, 0.15)}`,
        },
        ios: {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
        android: {
          elevation: 12,
        },
      }),
    },
    handleArea: {
      alignItems: "center",
      paddingVertical: 12,
      ...Platform.select({
        web: { cursor: "grab" as any, touchAction: "none" as any },
      }),
    },
    handle: {
      width: 32,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.onSurfaceVariant,
      opacity: 0.4,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.s,
    },
    title: {
      flex: 1,
      textAlign: "center",
      color: theme.colors.onSurface,
    },
    // With a close button the title sits at the start, like a side sheet's.
    titleStart: { textAlign: "left" },
    scroll: { flexShrink: 1 },
    content: {
      paddingHorizontal: theme.spacing.m,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.m,
    },
  });
