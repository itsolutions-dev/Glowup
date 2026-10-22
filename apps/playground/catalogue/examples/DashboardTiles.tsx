import { useState, type ReactNode } from "react";
import {
  Box,
  CircularProgress,
  Grid,
  HStack,
  LinearProgress,
  ListItem,
  Stat,
  ToggleButtonGroup,
  Typography,
  VStack,
  type GridSize,
} from "@its/glowup-ui";

const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const NUMBERS = {
  "7d": { revenue: "€18.4k", orders: "312", customers: "198", goal: 62 },
  "30d": { revenue: "€74.9k", orders: "1,284", customers: "803", goal: 75 },
  "90d": { revenue: "€212k", orders: "3,870", customers: "2,114", goal: 88 },
};

const ORDERS = [
  { id: "#4821", customer: "Mara Quinn", total: "€129.00" },
  { id: "#4820", customer: "Theo Alvarez", total: "€54.90" },
  { id: "#4819", customer: "Priya Nair", total: "€310.00" },
];

const CHANNELS = [
  { name: "Organic search", share: 42 },
  { name: "Direct", share: 27 },
  { name: "Email", share: 13 },
];

interface TileProps {
  /** Columns the tile spans, per breakpoint: xs from 0 dp, sm 600, md 840. */
  size: GridSize;
  title?: string;
  children: ReactNode;
}

// A grid item that draws its own surface: `Grid` finds its container through
// context, so an item can live inside a component of your own.
const Tile = ({ size, title, children }: TileProps) => (
  <Grid size={size}>
    <Box
      background="surfaceContainerHigh"
      radius="large"
      padding={16}
      gap={8}
      style={{ flex: 1 }}
    >
      {!!title && (
        <Typography variant="labelLarge" color="onSurfaceVariant">
          {title}
        </Typography>
      )}
      {children}
    </Box>
  </Grid>
);

export default function DashboardTiles() {
  const [period, setPeriod] = useState<keyof typeof NUMBERS>("30d");
  const now = NUMBERS[period];

  return (
    <VStack spacing="m">
      <HStack justify="space-between" align="center" wrap spacing="s">
        <Typography variant="headlineSmall">Overview</Typography>
        <ToggleButtonGroup
          accessibilityLabel="Period"
          options={PERIODS}
          value={period}
          onValueChange={setPeriod}
        />
      </HStack>

      <Grid container spacing="m">
        <Tile size={{ xs: 12, md: 8 }}>
          <Stat label="Revenue" value={now.revenue} trend="up" delta="12.5%" />
        </Tile>
        <Tile size={{ xs: 12, md: 4 }} title="Goal">
          <CircularProgress progress={now.goal / 100} label={`${now.goal}%`} />
        </Tile>

        <Tile size={{ xs: 12, sm: 4 }}>
          <Stat label="Orders" value={now.orders} trend="up" delta="4.1%" />
        </Tile>
        <Tile size={{ xs: 12, sm: 4 }}>
          <Stat label="Customers" value={now.customers} />
        </Tile>
        <Tile size={{ xs: 12, sm: 4 }}>
          <Stat label="Conversion" value="3.4%" trend="flat" delta="0.0%" />
        </Tile>

        <Tile size={{ xs: 12, md: 7 }} title="Recent orders">
          {ORDERS.map((o) => (
            <ListItem
              key={o.id}
              primaryText={o.customer}
              secondaryText={o.id}
              action={<Typography variant="labelLarge">{o.total}</Typography>}
            />
          ))}
        </Tile>
        <Tile size={{ xs: 12, md: 5 }} title="Top channels">
          {CHANNELS.map((c) => (
            <LinearProgress
              key={c.name}
              progress={c.share / 100}
              height={8}
              label={`${c.name} · ${c.share}%`}
              labelPosition="top-left"
            />
          ))}
        </Tile>
      </Grid>
    </VStack>
  );
}
