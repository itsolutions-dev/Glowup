import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
} from "react-native";
import { useTheme, Theme } from "../providers/ThemeProvider";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom";
  disabled?: boolean;
  /** Auto-hide delay (ms) after long-press on native. */
  hideDelay?: number;
}

const GAP = 8;

const Tooltip = ({
  content,
  children,
  position = "top",
  disabled,
  hideDelay = 1500,
}: TooltipProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [visible, setVisible] = useState(false);
  const [anchorSize, setAnchorSize] = useState({ width: 0, height: 0 });
  const [tipSize, setTipSize] = useState({ width: 0, height: 0 });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (disabled) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  }, [disabled]);

  const hide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(false);
  }, []);

  // Native: show on long press, then auto-hide
  const handleLongPress = useCallback(() => {
    if (disabled) return;
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), hideDelay);
  }, [disabled, hideDelay]);

  const onAnchorLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setAnchorSize({ width, height });
  }, []);

  const onTipLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setTipSize({ width, height });
  }, []);

  const tipStyle = useMemo(() => {
    const left = (anchorSize.width - tipSize.width) / 2;
    return position === "top"
      ? { left, top: -(tipSize.height + GAP) }
      : { left, top: anchorSize.height + GAP };
  }, [position, anchorSize, tipSize]);

  const webHoverProps =
    Platform.OS === "web"
      ? { onHoverIn: show, onHoverOut: hide }
      : { onLongPress: handleLongPress };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onLayout={onAnchorLayout}
        accessibilityLabel={content}
        {...webHoverProps}
      >
        {children}
      </Pressable>

      {visible && (
        <View
          onLayout={onTipLayout}
          pointerEvents="none"
          style={[
            styles.tooltip,
            tipStyle,
            { opacity: tipSize.width > 0 ? 1 : 0 },
          ]}
        >
          <Text
            style={[theme.typography.bodySmall, styles.tooltipText]}
            numberOfLines={2}
          >
            {content}
          </Text>
        </View>
      )}
    </View>
  );
};

export default Tooltip;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    wrapper: {
      alignSelf: "flex-start",
      position: "relative",
    },
    tooltip: {
      position: "absolute",
      // Inverse-surface look (M3 plain tooltip); dedicated tokens missing
      backgroundColor: theme.colors.onSurface,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      maxWidth: 220,
      zIndex: 1000,
      ...Platform.select({
        web: {
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          whiteSpace: "nowrap" as any,
        },
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    tooltipText: {
      color: theme.colors.surface,
    },
  });
