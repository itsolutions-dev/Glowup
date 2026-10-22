import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

export interface AbsoluteCenterProps extends ViewProps {
  /**
   * Which axis the child is centred on. On the other axis it keeps its normal
   * place (the start, or the full width of a vertically centred child).
   * Defaults to `"both"`.
   */
  axis?: "both" | "horizontal" | "vertical";
  children?: React.ReactNode;
}

/**
 * Centres its child in the parent's box, out of the normal flow: it fills the
 * parent with absolute positioning and centres inside, so the parent's own
 * content is not pushed around. The parent needs a size of its own. The layer
 * itself is not pressable (`pointerEvents: "box-none"`), only the child is, so
 * what lies under it stays reachable.
 */
const AbsoluteCenter = ({
  axis = "both",
  style,
  children,
  ...viewProps
}: AbsoluteCenterProps) => (
  <View
    {...viewProps}
    style={[
      StyleSheet.absoluteFill,
      axis !== "vertical" && { alignItems: "center" },
      axis !== "horizontal" && { justifyContent: "center" },
      { pointerEvents: "box-none" },
      style,
    ]}
  >
    {children}
  </View>
);

export default AbsoluteCenter;
