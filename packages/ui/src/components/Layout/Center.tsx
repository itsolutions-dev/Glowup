import React from "react";
import Box, { BoxProps } from "./Box";

export interface CenterProps extends Omit<BoxProps, "variant"> {
  /**
   * Whether the children flow in a row or in a column; either way each is
   * centred on both axes. Defaults to `"row"`.
   */
  direction?: "row" | "column";
}

/**
 * Centres its children within itself, on both axes: a `Box` with the
 * `centered-flex` (or, with `direction="column"`, `centered-column-flex`)
 * variant. Takes every other `Box` prop, `width` and `height` included.
 */
const Center = ({ direction = "row", ...boxProps }: CenterProps) => (
  <Box
    {...boxProps}
    variant={direction === "column" ? "centered-column-flex" : "centered-flex"}
  />
);

export default Center;
