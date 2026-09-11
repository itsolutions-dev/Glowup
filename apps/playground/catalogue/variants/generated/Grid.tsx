// GENERATED — do not edit.
// Source: .design-sync/previews/Grid.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import type { Variant } from "../types";
import { Box, Grid, Stat, Typography } from "@its/glowup-ui";

const tile = (n: number) => (
  <Box key={n} bg="secondaryContainer" p="m" radius="medium">
    <Typography variant="labelLarge">{n}</Typography>
  </Box>
);

export const FixedColumns = () => (
  <Grid columns={3} spacing="s" width={420}>
    {[1, 2, 3, 4, 5, 6].map(tile)}
  </Grid>
);

/** `minChildWidth` fits as many columns as the container allows. */
export const Responsive = () => (
  <Grid minChildWidth={160} spacing="s" width={420}>
    {[1, 2, 3, 4, 5].map(tile)}
  </Grid>
);

export const StatBoard = () => (
  <Grid
    columns={2}
    spacing="m"
    p="m"
    bg="surfaceContainerLow"
    radius="large"
    width={420}
  >
    <Stat label="Revenue" value="€18,420" delta="12.5%" trend="up" />
    <Stat label="Orders" value="1,204" delta="9.2%" trend="up" />
    <Stat
      label="Refunds"
      value="18"
      delta="3.1%"
      trend="down"
      invertTrendColors
    />
    <Stat label="Active seats" value="128" delta="0" trend="flat" />
  </Grid>
);

export const variants: Variant[] = [
  {
    name: "FixedColumns",
    title: "Fixed columns",
    render: FixedColumns,
  },
  {
    name: "Responsive",
    title: "Responsive",
    description:
      "`minChildWidth` fits as many columns as the container allows.",
    render: Responsive,
  },
  {
    name: "StatBoard",
    title: "Stat board",
    render: StatBoard,
  },
];
