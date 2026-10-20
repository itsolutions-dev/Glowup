import React, { Children, Fragment } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import Divider from "../Divider";
import Box, { BoxProps } from "./Box";
import { SpacingInput, resolveSpacing } from "./tokens";

export interface StackProps extends Omit<BoxProps, "variant" | "gap"> {
  /** Stacking axis. Defaults to `"vertical"`. */
  direction?: "vertical" | "horizontal";
  /**
   * Space between children — a spacing token name (`"m"`), a number of px, or
   * a string holding one (`"12"`).
   */
  spacing?: SpacingInput;
  /**
   * Puts a divider between the children. `true` draws a hairline, vertical in
   * a horizontal stack; a node is used as the divider instead. Empty children
   * (`null`, `false`) get none, and the spacing applies on both sides of it.
   */
  dividers?: React.ReactNode;
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
  dividers,
  reverse,
  style,
  children,
  ...boxProps
}: StackProps) => {
  const { theme } = useTheme();
  const horizontal = direction === "horizontal";

  // `toArray` drops the empty children, so a conditional one leaves no divider.
  const items = dividers ? Children.toArray(children) : null;

  return (
    <Box
      {...boxProps}
      gap={resolveSpacing(theme, spacing)}
      style={[
        {
          flexDirection: horizontal
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
      {items
        ? items.flatMap((child, index) =>
            index === 0
              ? [child]
              : [
                  <Fragment key={`divider-${index}`}>
                    {dividers === true ? (
                      <Divider
                        orientation={horizontal ? "vertical" : "horizontal"}
                      />
                    ) : (
                      dividers
                    )}
                  </Fragment>,
                  child,
                ],
          )
        : children}
    </Box>
  );
};

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
