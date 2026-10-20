import React from "react";
import { Box, Grid, Stat, Typography } from "@its/glowup-ui";

const tile = (n: number) => (
  <Box key={n} background="secondaryContainer" padding={16} radius="medium">
    <Typography variant="labelLarge">{n}</Typography>
  </Box>
);

export const FixedColumns = () => (
  <Grid container autoSize={1} columns={3} spacing="s" style={{ width: 420 }}>
    {[1, 2, 3, 4, 5, 6].map(tile)}
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
    {[1, 2, 3, 4, 5].map(tile)}
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
