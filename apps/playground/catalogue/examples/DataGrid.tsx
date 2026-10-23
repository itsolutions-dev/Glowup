import { useState } from "react";
import {
  Box,
  ChipGroup,
  DataGrid,
  StatusBadge,
  Typography,
  VStack,
  type ColumnDefinition,
  type DataGridProps,
} from "@its/glowup-ui";

const props: Partial<DataGridProps> = {
  density: "normal",
  emptyMessage: "No invoices with this status.",
};

const STATUS_TYPE = {
  Paid: "success",
  Due: "warning",
  Overdue: "error",
} as const;

// "Void" has no invoices, so choosing it shows the empty message.
const FILTERS = [...Object.keys(STATUS_TYPE), "Void"].map((value) => ({
  value,
  label: value,
}));

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
    ["INV-2043", "Pinecrest Vets", "2026-10-18", "Paid", 2300],
    ["INV-2042", "Marlow Print Co.", "2026-10-15", "Paid", 89],
  ] as const
).map(([id, client, issued, status, total]) => ({
  id,
  client,
  issued,
  status,
  total,
}));
type Invoice = (typeof INVOICES)[number];

// How each sortable column orders two rows: the grid reports the sort, the
// app orders the rows.
const COMPARE: Record<string, (a: Invoice, b: Invoice) => number> = {
  client: (a, b) => a.client.localeCompare(b.client),
  issued: (a, b) => a.issued.localeCompare(b.issued),
  total: (a, b) => a.total - b.total,
};

const COLUMNS: ColumnDefinition[] = [
  { id: "id", label: "Invoice", width: 110 },
  { id: "client", label: "Client", width: 190, sortable: true },
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

export default function DataGridExample() {
  const [status, setStatus] = useState<string | null>(null);
  const [sort, setSort] = useState({
    column: "issued",
    direction: "desc" as "asc" | "desc",
  });

  const rows = INVOICES.filter(
    (invoice) => !status || invoice.status === status,
  ).sort(
    (a, b) => COMPARE[sort.column](a, b) * (sort.direction === "asc" ? 1 : -1),
  );

  return (
    <VStack spacing="s">
      <ChipGroup
        accessibilityLabel="Status"
        options={FILTERS}
        value={status}
        onChange={setStatus}
      />
      <Typography variant="bodyMedium" color="onSurfaceVariant">
        {`${rows.length} of ${INVOICES.length} invoices, sorted by ${sort.column}.`}
      </Typography>
      {/* The columns add up to 660: a wider grid would leave an empty strip. */}
      <Box height={360} style={{ maxWidth: 662 }}>
        <DataGrid
          {...props}
          data={rows}
          columns={COLUMNS}
          sortColumn={sort.column}
          sortDirection={sort.direction}
          onSort={(column, direction) => setSort({ column, direction })}
        />
      </Box>
    </VStack>
  );
}
