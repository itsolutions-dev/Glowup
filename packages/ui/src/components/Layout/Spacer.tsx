import React from "react";
import { View } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { SpacingValue, resolveSpacing } from "./tokens";

export interface SpacerProps {
  /** Fixed size along the parent's axis. Omit to absorb the leftover space. */
  size?: SpacingValue;
  /** Which axis `size` applies to. Defaults to `"vertical"`. */
  axis?: "vertical" | "horizontal";
}

/**
 * Either a fixed gap (`size`) or a flexible one that pushes siblings apart.
 * The flexible form is how you right-align the tail of a row.
 */
const Spacer = ({ size, axis = "vertical" }: SpacerProps) => {
  const { theme } = useTheme();
  if (size === undefined) return <View style={{ flex: 1 }} />;
  const value = resolveSpacing(theme, size);
  return (
    <View
      style={axis === "horizontal" ? { width: value } : { height: value }}
    />
  );
};

export default Spacer;
