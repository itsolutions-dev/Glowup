import React, { createContext, useContext } from "react";
import { View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { useTheme } from "../../providers/ThemeProvider";
import type { SnackbarPosition } from "../Snackbar";

/** The gap kept between a snackbar and the edge of the window. */
export const EDGE_GAP = 24;
export const SIDE_GAP = 16;
export const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

export const ALIGN = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
} as const;

/** True under a `SnackbarStack`: the `Snackbar` then sits in its flow instead of at an edge of its own. */
export const InSnackbarStack = createContext(false);
export const useInSnackbarStack = () => useContext(InSnackbarStack);

/**
 * One edge and corner of the window holding several snackbars at once. The
 * children are laid out as given, top to bottom: the caller orders them so the
 * newest is nearest the edge.
 */
export const SnackbarStack = ({
  position,
  children,
}: {
  position: SnackbarPosition;
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  const insets = React.useContext(SafeAreaInsetsContext) ?? NO_INSETS;
  const [vertical, horizontal] = position.split("-") as [
    "top" | "bottom",
    "left" | "center" | "right",
  ];
  return (
    <InSnackbarStack.Provider value>
      <View
        // Spans the window so the toasts can sit at either side; only the
        // toasts themselves take touches.
        pointerEvents="box-none"
        style={[
          {
            position: "absolute",
            zIndex: 1000,
            left: SIDE_GAP + insets.left,
            right: SIDE_GAP + insets.right,
            alignItems: ALIGN[horizontal],
            gap: theme.spacing.s,
          },
          vertical === "top"
            ? { top: EDGE_GAP + insets.top }
            : { bottom: EDGE_GAP + insets.bottom },
        ]}
      >
        {children}
      </View>
    </InSnackbarStack.Provider>
  );
};
