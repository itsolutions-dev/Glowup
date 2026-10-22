// GENERATED — do not edit.
// Source: .design-sync/previews/Grid.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import type { Variant } from "../types";
import { Box, Grid, Stat, Typography } from "@its/glowup-ui";

const tile = (label: string | number, key?: string | number) => (
  <Box
    key={key ?? label}
    background="secondaryContainer"
    padding={16}
    radius="medium"
  >
    <Typography variant="labelLarge">{label}</Typography>
  </Box>
);

/** `autoSize` gives every child the same `size`: here 1 column of 3. */
export const FixedColumns = () => (
  <Grid container autoSize={1} columns={3} spacing="s" style={{ width: 420 }}>
    {[1, 2, 3, 4, 5, 6].map((n) => tile(n))}
  </Grid>
);

/** An item's `size` is the columns it spans, out of the container's 12. */
export const ItemSizes = () => (
  <Grid container spacing="s" style={{ width: 420 }}>
    <Grid size={12}>{tile("size 12")}</Grid>
    <Grid size={6}>{tile("size 6")}</Grid>
    <Grid size={6}>{tile("size 6")}</Grid>
    <Grid size={4}>{tile("size 4")}</Grid>
    <Grid size={4}>{tile("size 4")}</Grid>
    <Grid size={4}>{tile("size 4")}</Grid>
  </Grid>
);

/** `"grow"` shares what the row has left; `"auto"` sizes to the content. */
export const GrowAndAuto = () => (
  <Grid container spacing="s" style={{ width: 420 }}>
    <Grid size="auto">{tile("auto")}</Grid>
    <Grid size="grow">{tile("grow")}</Grid>
    <Grid size="grow">{tile("grow")}</Grid>
    <Grid size={3}>{tile("size 3")}</Grid>
  </Grid>
);

/** A `size` per breakpoint, from the window's width: 12, 6 from sm, 4 from md. */
export const PerBreakpoint = () => (
  <Grid container spacing="s" style={{ width: 420 }}>
    {[1, 2, 3, 4, 5, 6].map((n) => (
      <Grid key={n} size={{ xs: 12, sm: 6, md: 4 }}>
        {tile(n)}
      </Grid>
    ))}
  </Grid>
);

/** `autoSize` takes the columns per breakpoint, here from the window's width. */
export const Responsive = () => (
  <Grid
    container
    autoSize={{ xs: 6, sm: 4, md: 3, lg: 2 }}
    spacing="s"
    style={{ width: 420 }}
  >
    {[1, 2, 3, 4, 5].map((n) => tile(n))}
  </Grid>
);

/** `autoSize` as a function sizes each child by its position. */
export const AutoSizeFunction = () => (
  <Grid
    container
    autoSize={(index) => (index === 0 ? 12 : 6)}
    spacing="s"
    style={{ width: 420 }}
  >
    {["Featured", "Second", "Third", "Fourth", "Fifth"].map((n) => tile(n))}
  </Grid>
);

/** `spacing` is a token, a number of px, or `{ row, column }` for the two axes. */
export const Spacing = () => (
  <Box gap={16} style={{ width: 420 }}>
    <Grid container autoSize={4} spacing="xl">
      {[1, 2, 3].map((n) => tile(`xl ${n}`))}
    </Grid>
    <Grid container autoSize={4} spacing={{ row: "l", column: 4 }}>
      {[1, 2, 3, 4, 5, 6].map((n) => tile(`${n}`))}
    </Grid>
  </Box>
);

/** `wrap={false}` keeps one row and squeezes the items instead of wrapping them. */
export const NoWrap = () => (
  <Grid container wrap={false} autoSize={4} spacing="s" style={{ width: 420 }}>
    {[1, 2, 3, 4].map((n) => tile(`${n}`))}
  </Grid>
);

export const StatBoard = () => (
  <Box
    background="surfaceContainerLow"
    radius="large"
    padding={16}
    style={{ width: 420 }}
  >
    <Grid container autoSize={1} columns={2} spacing="m">
      <Stat label="Revenue" value="€18,420" delta="12.5%" trend="up" />
      <Stat label="Orders" value="1,204" delta="9.2%" trend="up" />
      <Stat
        label="Refunds"
        value="18"
        delta="3.1%"
        trend="down"
        trendColor="success"
      />
      <Stat label="Active seats" value="128" delta="0" trend="flat" />
    </Grid>
  </Box>
);

export const variants: Variant[] = [
  {
    name: "FixedColumns",
    title: "Fixed columns",
    description:
      "`autoSize` gives every child the same `size`: here 1 column of 3.",
    render: FixedColumns,
  },
  {
    name: "ItemSizes",
    title: "Item sizes",
    description:
      "An item's `size` is the columns it spans, out of the container's 12.",
    render: ItemSizes,
  },
  {
    name: "GrowAndAuto",
    title: "Grow and auto",
    description:
      '`"grow"` shares what the row has left; `"auto"` sizes to the content.',
    render: GrowAndAuto,
  },
  {
    name: "PerBreakpoint",
    title: "Per breakpoint",
    description:
      "A `size` per breakpoint, from the window's width: 12, 6 from sm, 4 from md.",
    render: PerBreakpoint,
  },
  {
    name: "Responsive",
    title: "Responsive",
    description:
      "`autoSize` takes the columns per breakpoint, here from the window's width.",
    render: Responsive,
  },
  {
    name: "AutoSizeFunction",
    title: "Auto size function",
    description: "`autoSize` as a function sizes each child by its position.",
    render: AutoSizeFunction,
  },
  {
    name: "Spacing",
    title: "Spacing",
    description:
      "`spacing` is a token, a number of px, or `{ row, column }` for the two axes.",
    render: Spacing,
  },
  {
    name: "NoWrap",
    title: "No wrap",
    description:
      "`wrap={false}` keeps one row and squeezes the items instead of wrapping them.",
    render: NoWrap,
  },
  {
    name: "StatBoard",
    title: "Stat board",
    render: StatBoard,
  },
];
