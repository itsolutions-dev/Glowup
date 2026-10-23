import { useState } from "react";
import {
  Avatar,
  HStack,
  SearchBar,
  StatusBadge,
  Table,
  Typography,
  VStack,
  type TableColumn,
  type TableProps,
} from "@its/glowup-ui";

const props: Partial<TableProps> = {
  tableTitle: "Orders",
  rowsPerPage: 5,
  hover: true,
  emptyMessage: "No orders match your search.",
};

const COLUMNS: TableColumn[] = [
  { id: "id", label: "Order", width: 90 },
  { id: "customer", label: "Customer", fallback: "Guest checkout" },
  { id: "status", label: "Status", width: 130 },
  { id: "total", label: "Total", width: 100, alignment: "right" },
];

const STATUS_TYPE = {
  Paid: "success",
  Pending: "warning",
  Refunded: "error",
} as const;

const ORDERS = [
  { id: "#4821", customer: "Mara Quinn", status: "Paid", total: "€129.00" },
  { id: "#4820", customer: "Theo Alvarez", status: "Pending", total: "€54.90" },
  { id: "#4819", customer: "Priya Nair", status: "Paid", total: "€310.00" },
  { id: "#4818", customer: "", status: "Paid", total: "€18.50" },
  { id: "#4817", customer: "Jonas Weber", status: "Refunded", total: "€76.00" },
  { id: "#4816", customer: "Lena Fischer", status: "Paid", total: "€42.00" },
  { id: "#4815", customer: "Omar Haddad", status: "Pending", total: "€208.40" },
  { id: "#4814", customer: "Sofia Rossi", status: "Paid", total: "€15.90" },
  { id: "#4813", customer: "Kenji Mori", status: "Paid", total: "€64.00" },
  { id: "#4812", customer: "Ines Duarte", status: "Refunded", total: "€99.00" },
] as const;

export default function TableExample() {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);

  const visible = ORDERS.filter((order) =>
    order.customer.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const picked = ORDERS.find((order) => order.id === pickedId);

  // Cells can be any node: a customer with an avatar, a status badge.
  const rows = visible.map((order) => ({
    id: order.id,
    customer: order.customer ? (
      <HStack spacing="s" align="center">
        <Avatar name={order.customer} size="small" />
        <Typography variant="bodyMedium">{order.customer}</Typography>
      </HStack>
    ) : undefined,
    status: (
      <StatusBadge label={order.status} type={STATUS_TYPE[order.status]} />
    ),
    total: order.total,
  }));

  return (
    <VStack spacing="s">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by customer"
      />
      <Table
        {...props}
        columns={COLUMNS}
        data={rows}
        // An index in `data` (the filtered rows), not in the page shown.
        selected={visible.findIndex((order) => order.id === pickedId)}
        onClick={(_row, index) => setPickedId(visible[index].id)}
      />
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {picked
          ? `${picked.id}: ${picked.customer || "Guest"}, ${picked.total}`
          : "Press a row to see the order."}
      </Typography>
    </VStack>
  );
}
