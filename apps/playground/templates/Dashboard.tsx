import { useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Avatar,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Divider,
  HStack,
  IconButton,
  LinearProgress,
  NavBar,
  NavigationRail,
  Stat,
  StatusBadge,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  AppBar,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";

const NAV = [
  { id: "home", label: "Home", icon: "view-dashboard-outline" },
  {
    id: "orders",
    label: "Orders",
    icon: "receipt-text-outline",
    badgeCount: 4,
  },
  { id: "customers", label: "Customers", icon: "account-group-outline" },
  { id: "reports", label: "Reports", icon: "chart-box-outline" },
] as const;

const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const STATS = {
  "7d": { revenue: "€18.4k", orders: "312", conversion: "3.1%", refunds: "4" },
  "30d": {
    revenue: "€74.9k",
    orders: "1,284",
    conversion: "3.4%",
    refunds: "19",
  },
  "90d": {
    revenue: "€212k",
    orders: "3,870",
    conversion: "3.2%",
    refunds: "61",
  },
};

const CHANNELS = [
  { label: "Organic search", share: 0.42 },
  { label: "Direct", share: 0.27 },
  { label: "Social", share: 0.18 },
  { label: "Email", share: 0.13 },
];

const ORDERS = [
  { id: "#4821", customer: "Ada Lovelace", total: "€129.00", status: "Paid" },
  { id: "#4820", customer: "Alan Turing", total: "€54.90", status: "Pending" },
  { id: "#4819", customer: "Grace Hopper", total: "€310.00", status: "Paid" },
  {
    id: "#4818",
    customer: "Linus Torvalds",
    total: "€18.50",
    status: "Refunded",
  },
];

const STATUS_TYPE = {
  Paid: "success",
  Pending: "warning",
  Refunded: "error",
} as const;

/**
 * An admin shell: a navigation rail beside the content on a wide container,
 * a bottom navigation bar on a narrow one. The breakpoint reads the
 * container's own width (onLayout), so the screen adapts wherever it is put.
 */
export default function Dashboard() {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const [section, setSection] = useState("home");
  const [period, setPeriod] = useState<keyof typeof STATS>("30d");
  const isWide = width >= 600;
  const stats = STATS[period];

  return (
    <Box
      radius="extraLarge"
      background="surface"
      borderWidth={1}
      borderColor="outlineVariant"
      style={{ overflow: "hidden" }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <HStack align="stretch" spacing={0}>
        {isWide && (
          <NavigationRail
            items={[...NAV]}
            activeId={section}
            onItemPress={setSection}
            header={<Avatar name="Acme Store" variant="rounded" size={40} />}
          />
        )}

        <View style={{ flex: 1, minWidth: 0 }}>
          <AppBar
            safeArea={false}
            title="Overview"
            subtitle="Acme Store"
            actions={
              <HStack spacing="xs" align="center">
                <IconButton icon="magnify" accessibilityLabel="Search" />
                <View>
                  <IconButton
                    icon="bell-outline"
                    accessibilityLabel="Notifications"
                  />
                  <Badge
                    count={3}
                    style={{
                      position: "absolute",
                      top: theme.spacing.xs,
                      right: theme.spacing.xs,
                    }}
                  />
                </View>
                <Avatar name="Ada Lovelace" size={32} status="online" />
              </HStack>
            }
          />

          <VStack spacing="l" padding={24}>
            {/* The one dominant element: a greeting and the period switch. */}
            <HStack justify="space-between" align="center" wrap spacing="m">
              <VStack spacing="xs">
                <Typography
                  variant="headlineSmall"
                  style={{ color: theme.colors.onSurface }}
                >
                  Good morning, Ada
                </Typography>
                <Typography
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Here is how the store did in the last{" "}
                  {PERIODS.find((p) => p.value === period)?.label}.
                </Typography>
              </VStack>
              <ButtonGroup
                type="connected"
                size="s"
                accessibilityLabel="Period"
                options={PERIODS}
                value={period}
                onValueChange={setPeriod}
              />
            </HStack>

            <HStack wrap spacing="m">
              <Stat
                style={{ flexGrow: 1, flexBasis: 160 }}
                label="Revenue"
                value={stats.revenue}
                icon="cash-multiple"
                trend="up"
                delta="12.5%"
              />
              <Stat
                style={{ flexGrow: 1, flexBasis: 160 }}
                label="Orders"
                value={stats.orders}
                icon="cart-outline"
                trend="up"
                delta="4.1%"
              />
              <Stat
                style={{ flexGrow: 1, flexBasis: 160 }}
                label="Conversion"
                value={stats.conversion}
                icon="percent-outline"
                trend="flat"
                delta="0.0%"
              />
              <Stat
                style={{ flexGrow: 1, flexBasis: 160 }}
                label="Refunds"
                value={stats.refunds}
                icon="cash-refund"
                trend="down"
                delta="8%"
                invertTrendColors
              />
            </HStack>

            <HStack wrap spacing="l" align="flex-start">
              <VStack spacing="m" style={{ flexGrow: 1, flexBasis: 220 }}>
                <Typography
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface }}
                >
                  Traffic sources
                </Typography>
                {CHANNELS.map((channel) => (
                  <VStack key={channel.label} spacing="xs">
                    <HStack justify="space-between">
                      <Typography
                        variant="bodyMedium"
                        style={{ color: theme.colors.onSurface }}
                      >
                        {channel.label}
                      </Typography>
                      <Typography
                        variant="labelLarge"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {Math.round(channel.share * 100)}%
                      </Typography>
                    </HStack>
                    <LinearProgress progress={channel.share} height={6} />
                  </VStack>
                ))}
              </VStack>

              <VStack spacing="m" style={{ flexGrow: 2, flexBasis: 320 }}>
                <HStack justify="space-between" align="center">
                  <Typography
                    variant="titleMedium"
                    style={{ color: theme.colors.onSurface }}
                  >
                    Recent orders
                  </Typography>
                  <Button
                    variant="text"
                    iconName="arrow-right"
                    iconPosition="end"
                  >
                    View all
                  </Button>
                </HStack>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell width={80}>Order</TableHeaderCell>
                        <TableHeaderCell width={160}>Customer</TableHeaderCell>
                        <TableHeaderCell width={100}>Total</TableHeaderCell>
                        <TableHeaderCell width={130}>Status</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    {ORDERS.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell width={80}>{order.id}</TableCell>
                        <TableCell width={160}>{order.customer}</TableCell>
                        <TableCell width={100}>{order.total}</TableCell>
                        <TableCell width={130}>
                          <StatusBadge
                            label={order.status}
                            type={
                              STATUS_TYPE[
                                order.status as keyof typeof STATUS_TYPE
                              ]
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </Table>
                </ScrollView>
              </VStack>
            </HStack>
          </VStack>

          {!isWide && (
            <>
              <Divider />
              <NavBar
                items={[...NAV]}
                activeId={section}
                onClick={setSection}
              />
            </>
          )}
        </View>
      </HStack>
    </Box>
  );
}
