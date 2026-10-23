// The phone version of the grid is a later piece (docs/superpowers/specs/2026-10-23-pivot-grid-design.md):
// the web one, PivotGrid.web.tsx, keeps its header and first columns in place with CSS, which a phone lacks.
import React from "react";
import { Typography } from "@its/glowup-ui";
import type { PivotGridProps } from "./grid/props";

const PivotGrid = (_props: PivotGridProps) => (
  <Typography variant="bodyMedium">
    The pivot grid is not available on this platform yet.
  </Typography>
);

export default PivotGrid;
