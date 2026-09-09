import React from "react";
import Box, { BoxProps } from "./Box";
import { SpacingValue } from "./tokens";

export interface StackProps extends Omit<BoxProps, "row" | "gap"> {
  /** Stacking axis. Defaults to `"vertical"`. */
  direction?: "vertical" | "horizontal";
  /** Gap between children — a spacing token name or a raw value. */
  spacing?: SpacingValue;
  /** Reverses the visual order without touching the children array. */
  reverse?: boolean;
}

/**
 * Evenly spaced stack of children. `gap` does the spacing, so it stays correct
 * when children are conditionally rendered — unlike margin on each child.
 */
const Stack = ({
  direction = "vertical",
  spacing = "s",
  reverse,
  style,
  children,
  ...boxProps
}: StackProps) => (
  <Box
    {...boxProps}
    gap={spacing}
    style={[
      {
        flexDirection:
          direction === "horizontal"
            ? reverse
              ? "row-reverse"
              : "row"
            : reverse
              ? "column-reverse"
              : "column",
      },
      style,
    ]}
  >
    {children}
  </Box>
);

export default Stack;

export type StackAxisProps = Omit<StackProps, "direction">;

/** `Stack` locked to the horizontal axis. */
export const HStack = (props: StackAxisProps) => (
  <Stack {...props} direction="horizontal" />
);

/** `Stack` locked to the vertical axis. */
export const VStack = (props: StackAxisProps) => (
  <Stack {...props} direction="vertical" />
);
