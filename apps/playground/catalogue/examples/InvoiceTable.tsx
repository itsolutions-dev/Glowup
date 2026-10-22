import { useState } from "react";
import {
  IconButton,
  StatusBadge,
  Table,
  Typography,
  VStack,
  type TableColumn,
} from "@its/glowup-ui";

const COLUMNS: TableColumn[] = [
  { id: "number", label: "Invoice", width: 110 },
  { id: "client", label: "Client" },
  { id: "due", label: "Due", width: 100, fallback: "On receipt" },
  { id: "status", label: "Status", width: 120 },
  { id: "amount", label: "Amount", width: 110, alignment: "right" },
  { id: "pay", label: "Pay", width: 72, alignment: "center" },
];

const STATUS_TYPE = {
  Paid: "success",
  Due: "warning",
  Overdue: "error",
} as const;

const INVOICES = [
  ["INV-2051", "Brightside Studio", "30 Nov", "Due", "€1,240.50"],
  ["INV-2050", "Hollis & Park", "28 Nov", "Due", "€380.00"],
  ["INV-2049", "Lumen Logistics", "12 Nov", "Overdue", "€4,905.20"],
  ["INV-2048", "Kestrel Foods", "", "Paid", "€72.90"],
  ["INV-2047", "Fernhill Dental", "05 Nov", "Overdue", "€2,110.00"],
  ["INV-2046", "Oakline Joinery", "01 Nov", "Paid", "€960.00"],
  ["INV-2045", "Tidewater Café", "29 Oct", "Paid", "€145.30"],
  ["INV-2044", "Northgate Books", "22 Oct", "Paid", "€518.75"],
  ["INV-2043", "Pinecrest Vets", "18 Oct", "Paid", "€2,300.00"],
  ["INV-2042", "Marlow Print Co.", "15 Oct", "Paid", "€89.00"],
  ["INV-2041", "Sable & Finch", "09 Oct", "Paid", "€1,075.40"],
  ["INV-2040", "Quayside Bikes", "02 Oct", "Paid", "€640.00"],
].map(([number, client, due, status, amount]) => ({
  number,
  client,
  due,
  status: status as keyof typeof STATUS_TYPE,
  amount,
}));

export default function InvoiceTable() {
  const [paid, setPaid] = useState<string[]>([]);
  const unpaid = INVOICES.filter(
    (i) => i.status !== "Paid" && !paid.includes(i.number),
  ).length;

  const rows = INVOICES.map((invoice) => {
    const status = paid.includes(invoice.number) ? "Paid" : invoice.status;
    return {
      ...invoice,
      status: <StatusBadge label={status} type={STATUS_TYPE[status]} />,
      pay: (
        <IconButton
          icon="cash-check"
          size="small"
          title="Mark as paid"
          accessibilityLabel={`Mark ${invoice.number} as paid`}
          disabled={status === "Paid"}
          onClick={() => setPaid([...paid, invoice.number])}
        />
      ),
    };
  });

  return (
    <VStack spacing="s">
      <Typography variant="bodyMedium" color="onSurfaceVariant">
        {unpaid ? `${unpaid} invoices still to collect.` : "All paid."}
      </Typography>
      {/* A height makes the rows scroll under a header that stays put. */}
      <Table
        tableTitle="Invoices"
        columns={COLUMNS}
        data={rows}
        height={360}
        hover
      />
    </VStack>
  );
}
