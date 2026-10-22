import { useState } from "react";
import { Box, Grid, Stat, Switch, VStack, useTheme } from "@its/glowup-ui";

const KPIS = [
  {
    label: "Revenue",
    value: "€48,230",
    delta: "12.5%",
    trend: "up",
    icon: "cash-multiple",
  },
  {
    label: "Orders",
    value: "1,284",
    delta: "4.1%",
    trend: "up",
    icon: "cart-outline",
  },
  {
    label: "Conversion",
    value: "3.2%",
    delta: "0.0%",
    trend: "flat",
    icon: "percent-outline",
  },
  // Down is good for refunds: the colour is set, the arrow still points down.
  {
    label: "Refund rate",
    value: "1.8%",
    delta: "0.4%",
    trend: "down",
    trendColor: "success",
    icon: "cash-refund",
  },
  // Up is bad for open tickets.
  {
    label: "Open tickets",
    value: "37",
    delta: "9",
    trend: "up",
    trendColor: "error",
    icon: "lifebuoy",
  },
  {
    label: "Avg. order",
    value: "€86.40",
    delta: "1.4%",
    trend: "down",
    icon: "receipt-text-outline",
  },
] as const;

export default function KpiBoard() {
  const { theme } = useTheme();
  const [compact, setCompact] = useState(false);

  return (
    <VStack spacing="m">
      <Switch label="Compact" value={compact} onChange={setCompact} />
      <Grid container spacing="m" autoSize={{ xs: 12, sm: 6, md: 4 }}>
        {KPIS.map((kpi) => (
          <Box
            key={kpi.label}
            background="surfaceContainerLow"
            radius="medium"
            padding={theme.spacing.m}
          >
            <Stat
              {...kpi}
              direction={compact ? "row" : "column"}
              helpText={compact ? undefined : "vs. the previous 7 days"}
            />
          </Box>
        ))}
      </Grid>
    </VStack>
  );
}
