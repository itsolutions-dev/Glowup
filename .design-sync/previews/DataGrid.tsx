import React from "react";
import { DataGrid } from "@its/glowup-ui";

const columns = [
  { id: "invoice", label: "Invoice", width: 120 },
  { id: "client", label: "Client", width: 180, sortable: true },
  { id: "issued", label: "Issued", width: 120, sortable: true },
  { id: "total", label: "Total", width: 110, sortable: true },
];

const rows = [
  {
    id: 1,
    invoice: "INV-2041",
    client: "Acme Inc.",
    issued: "12 Aug",
    total: "€1,240.50",
  },
  {
    id: 2,
    invoice: "INV-2042",
    client: "Northwind Ltd",
    issued: "14 Aug",
    total: "€380.00",
  },
  {
    id: 3,
    invoice: "INV-2043",
    client: "Globex GmbH",
    issued: "19 Aug",
    total: "€4,905.20",
  },
  {
    id: 4,
    invoice: "INV-2044",
    client: "Initech BV",
    issued: "23 Aug",
    total: "€72.90",
  },
  {
    id: 5,
    invoice: "INV-2045",
    client: "Umbrella SpA",
    issued: "01 Sep",
    total: "€2,110.00",
  },
];

const frame: React.CSSProperties = { width: 560, height: 320, display: "flex" };

export const Sorted = () => (
  <div style={frame}>
    <DataGrid
      data={rows}
      columns={columns}
      sortColumn="issued"
      sortDirection="asc"
      onSort={() => {}}
    />
  </div>
);

export const Dense = () => (
  <div style={frame}>
    <DataGrid data={rows} columns={columns} density="dense" />
  </div>
);

export const Loading = () => (
  <div style={frame}>
    <DataGrid data={[]} columns={columns} loading />
  </div>
);

export const Empty = () => (
  <div style={frame}>
    <DataGrid
      data={[]}
      columns={columns}
      emptyMessage="No invoices in this period"
    />
  </div>
);
