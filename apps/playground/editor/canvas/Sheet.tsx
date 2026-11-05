// A panel laid over the canvas's edge (spec §17, from 600 to 1399 dp): the
// side panel on the left, Properties on the right, one at a time. While
// something is dragged out of it, it is hidden but stays mounted — an
// unmounted active Draggable would cancel the drag.

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme, type Theme } from "@its/glowup-ui";

export const Sheet = ({
  side,
  open,
  hidden,
  children,
}: {
  side: "left" | "right";
  open: boolean;
  hidden: boolean;
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  if (!open) return null;
  return (
    <View
      testID={`sheet-${side}`}
      pointerEvents={hidden ? "none" : "auto"}
      style={[
        styles.sheet,
        side === "left" ? styles.left : styles.right,
        hidden && styles.hidden,
      ]}
    >
      {children}
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    sheet: {
      position: "absolute",
      top: 0,
      bottom: 0,
      zIndex: 2,
      backgroundColor: theme.colors.surfaceContainerLow,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    left: { left: 0 },
    right: { right: 0 },
    hidden: { opacity: 0 },
  });
