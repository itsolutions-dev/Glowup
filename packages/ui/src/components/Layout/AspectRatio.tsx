import React from "react";
import Box, { BoxProps } from "./Box";

export interface AspectRatioProps extends Omit<BoxProps, "height"> {
  /** Width divided by height — `16 / 9`, `1`, `4 / 3`. Defaults to `1`. */
  ratio?: number;
}

/**
 * Keeps its children at a fixed width-to-height ratio, so media placeholders
 * do not jump around while an image loads.
 */
const AspectRatio = ({
  ratio = 1,
  style,
  children,
  ...boxProps
}: AspectRatioProps) => (
  <Box {...boxProps} style={[{ aspectRatio: ratio, width: "100%" }, style]}>
    {children}
  </Box>
);

export default AspectRatio;
