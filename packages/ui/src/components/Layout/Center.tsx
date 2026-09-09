import React from "react";
import Box, { BoxProps } from "./Box";

export type CenterProps = Omit<BoxProps, "align" | "justify">;

/** Centres its children on both axes. */
const Center = ({ children, ...boxProps }: CenterProps) => (
  <Box {...boxProps} align="center" justify="center">
    {children}
  </Box>
);

export default Center;
