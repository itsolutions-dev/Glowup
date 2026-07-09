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
  View,
  StyleSheet,
  Platform,
  useWindowDimensions,
  GestureResponderEvent,
} from "react-native";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Typography from "./Typography";

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  title?: string;
  showHandle?: boolean;
  dismissOnScrimTap?: boolean;
  /** Max sheet height as a fraction of the window height. */
  maxHeightRatio?: number;
}

const DISMISS_THRESHOLD = 120;

const BottomSheet = ({
  visible,
  onDismiss,
  children,
  title,
  showHandle = true,
  dismissOnScrimTap = true,
  maxHeightRatio = 0.85,
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

  // Mount as soon as it becomes visible (render-time adjustment)
  if (visible && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (visible) {
      translateY.setValue(window.height);
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
          toValue: window.height,
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
  }, [visible, translateY, scrimOpacity, window.height]);

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
        onDismiss();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }).start();
      }
    },
    [translateY, onDismiss],
  );

  if (!shouldRender) return null;

  return (
    <NativeModal
      visible={shouldRender}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissOnScrimTap ? onDismiss : undefined}
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

          {!!title && (
            <Typography variant="titleLarge" style={styles.title}>
              {title}
            </Typography>
          )}

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </NativeModal>
  );
};

export default BottomSheet;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
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
      backgroundColor: "rgba(0, 0, 0, 0.5)",
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
          boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
        },
        ios: {
          shadowColor: "#000",
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
    title: {
      textAlign: "center",
      marginBottom: theme.spacing.s,
      color: theme.colors.onSurface,
    },
    content: {
      paddingHorizontal: theme.spacing.m,
    },
  });
