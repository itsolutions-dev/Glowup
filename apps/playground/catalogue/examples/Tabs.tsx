import { useState } from "react";
import {
  Box,
  ListItem,
  StatusBadge,
  Tabs,
  Typography,
  useTheme,
  type TabsProps,
} from "@its/glowup-ui";

const props: Partial<TabsProps> = {
  variant: "standard",
  fullWidth: true,
};

const TABS = ["All", "Open", "Shipped", "Returned"];

const STATUS = {
  Open: "warning",
  Shipped: "success",
  Returned: "error",
} as const;

const ORDERS = [
  ["#4821", "Mara Quinn", "Shipped"],
  ["#4820", "Theo Alvarez", "Open"],
  ["#4819", "Priya Nair", "Shipped"],
  ["#4818", "Jonas Weber", "Returned"],
  ["#4817", "Lena Fischer", "Open"],
  ["#4816", "Omar Haddad", "Shipped"],
] as const;

export default function TabsExample() {
  const { theme } = useTheme();
  const [tab, setTab] = useState(0);
  const orders = ORDERS.filter(
    ([, , status]) => tab === 0 || status === TABS[tab],
  );

  return (
    <Box
      background="surface"
      radius="large"
      borderWidth={1}
      borderColor="outlineVariant"
      width="100%"
      style={{ maxWidth: 480, alignSelf: "center", overflow: "hidden" }}
    >
      <Typography variant="titleMedium" style={{ padding: theme.spacing.m }}>
        Orders
      </Typography>
      <Tabs {...props} tabs={TABS} activeTab={tab} onChange={setTab} />
      {orders.map(([id, customer, status]) => (
        <ListItem
          key={id}
          primaryText={customer}
          secondaryText={`Order ${id}`}
          action={<StatusBadge label={status} type={STATUS[status]} />}
        />
      ))}
    </Box>
  );
}
