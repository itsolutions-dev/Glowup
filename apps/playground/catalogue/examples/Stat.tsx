import { Box, Grid, Stat, useTheme, type StatProps } from "@its/glowup-ui";

const props: Partial<StatProps> & Pick<StatProps, "label" | "value"> = {
  label: "Revenue",
  value: "€48,230",
  delta: "12.5%",
  trend: "up",
  helpText: "vs. the previous 7 days",
  icon: "cash-multiple",
};

// The rest of the board. Down is good for refunds and up is bad for open
// tickets, so those two set the colour; the arrow still follows the trend.
const OTHERS = [
  {
    label: "Orders",
    value: "1,284",
    delta: "4.1%",
    trend: "up",
    icon: "cart-outline",
  },
  {
    label: "Refund rate",
    value: "1.8%",
    delta: "0.4%",
    trend: "down",
    trendColor: "success",
    icon: "cash-refund",
  },
  {
    label: "Open tickets",
    value: "37",
    delta: "9",
    trend: "up",
    trendColor: "error",
    icon: "lifebuoy",
  },
] as const;

export default function StatExample() {
  const { theme } = useTheme();

  return (
    <Grid container spacing="m" autoSize={{ xs: 12, sm: 6 }}>
      {[props, ...OTHERS].map((stat) => (
        <Box
          key={stat.label}
          background="surfaceContainerLow"
          radius="medium"
          padding={theme.spacing.m}
        >
          <Stat
            direction={props.direction}
            helpText={props.helpText}
            {...stat}
          />
        </Box>
      ))}
    </Grid>
  );
}
