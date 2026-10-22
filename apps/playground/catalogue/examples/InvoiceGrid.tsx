import { useState } from "react";
import {
  Box,
  Checkbox,
  DataGrid,
  StatusBadge,
  Typography,
  VStack,
  type ColumnDefinition,
} from "@its/glowup-ui";

const STATUS_TYPE = {
  Paid: "success",
  Due: "warning",
  Overdue: "error",
} as const;

const INVOICES = (
  [
    ["INV-2051", "Brightside Studio", "2026-11-30", "Due", 1240.5],
    ["INV-2050", "Hollis & Park", "2026-11-28", "Due", 380],
    ["INV-2049", "Lumen Logistics", "2026-11-12", "Overdue", 4905.2],
    ["INV-2048", "Kestrel Foods", "2026-11-09", "Paid", 72.9],
    ["INV-2047", "Fernhill Dental", "2026-11-05", "Overdue", 2110],
    ["INV-2046", "Oakline Joinery", "2026-11-01", "Paid", 960],
    ["INV-2045", "Tidewater Café", "2026-10-29", "Paid", 145.3],
    ["INV-2044", "Northgate Books", "2026-10-22", "Paid", 518.75],
  ] as const
).map(([id, client, issued, status, total]) => ({
  id,
  client,
  issued,
  status,
  total,
}));
type Invoice = (typeof INVOICES)[number];

// How each sortable column orders two rows.
const COMPARE: Record<string, (a: Invoice, b: Invoice) => number> = {
  client: (a, b) => a.client.localeCompare(b.client),
  issued: (a, b) => a.issued.localeCompare(b.issued),
  total: (a, b) => a.total - b.total,
};

export default function InvoiceGrid() {
  const [sort, setSort] = useState<{
    column: string;
    direction: "asc" | "desc";
  }>({ column: "issued", direction: "desc" });
  const [picked, setPicked] = useState<string[]>([]);

  // The grid only reports the sort: ordering the rows is the app's job.
  const rows = [...INVOICES].sort(
    (a, b) => COMPARE[sort.column](a, b) * (sort.direction === "asc" ? 1 : -1),
  );
  const toggle = (id: string) =>
    setPicked((now) =>
      now.includes(id) ? now.filter((i) => i !== id) : [...now, id],
    );
  const total = rows
    .filter((invoice) => picked.includes(invoice.id))
    .reduce((sum, invoice) => sum + invoice.total, 0);

  const columns: ColumnDefinition[] = [
    {
      id: "id",
      label: "Invoice",
      width: 150,
      renderCell: (id: string) => (
        <Checkbox
          label={id}
          checked={picked.includes(id)}
          onValueChange={() => toggle(id)}
        />
      ),
    },
    { id: "client", label: "Client", width: 170, sortable: true },
    { id: "issued", label: "Issued", width: 120, sortable: true },
    {
      id: "status",
      label: "Status",
      width: 120,
      renderCell: (status: keyof typeof STATUS_TYPE) => (
        <StatusBadge label={status} type={STATUS_TYPE[status]} />
      ),
    },
    {
      id: "total",
      label: "Total",
      width: 120,
      align: "right",
      sortable: true,
      renderCell: (amount: number) => `€${amount.toFixed(2)}`,
    },
  ];

  return (
    <VStack spacing="s">
      <Typography variant="bodyMedium" color="onSurfaceVariant">
        {picked.length
          ? `${picked.length} selected, €${total.toFixed(2)}`
          : "Select invoices to see their total."}
      </Typography>
      {/* The columns add up to 680: a wider grid would leave an empty strip. */}
      <Box height={360} style={{ maxWidth: 682 }}>
        <DataGrid
          data={rows}
          columns={columns}
          sortColumn={sort.column}
          sortDirection={sort.direction}
          onSort={(column, direction) => setSort({ column, direction })}
        />
      </Box>
    </VStack>
  );
}
