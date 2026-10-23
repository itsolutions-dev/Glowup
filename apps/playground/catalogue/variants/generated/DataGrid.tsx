// GENERATED — do not edit.
// Source: .design-sync/previews/DataGrid.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { DataGrid, StatusBadge, Typography } from "@its/glowup-ui";

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

const frame: ViewStyle = { width: 560, height: 320, flexDirection: "row" };

export const Sorted = () => (
  <View style={frame}>
    <DataGrid
      data={rows}
      columns={columns}
      sortColumn="issued"
      sortDirection="asc"
      onSort={() => {}}
    />
  </View>
);

export const Dense = () => (
  <View style={frame}>
    <DataGrid data={rows} columns={columns} density="dense" />
  </View>
);

export const Loading = () => (
  <View style={frame}>
    <DataGrid data={[]} columns={columns} loading />
  </View>
);

export const Empty = () => (
  <View style={frame}>
    <DataGrid
      data={[]}
      columns={columns}
      emptyMessage="No invoices in this period"
    />
  </View>
);

const crmColumns = [
  { id: "client", label: "Client", width: 170 },
  {
    id: "status",
    label: "Status",
    width: 130,
    renderCell: (value: string) => (
      <StatusBadge
        label={value}
        type={value === "Overdue" ? "error" : "success"}
      />
    ),
  },
  { id: "total", label: "Total", width: 120, align: "right" as const },
];

const crmRows = [
  { id: 1, client: "Acme Inc.", status: "Paid", total: "€1,240.50" },
  { id: 2, client: "Northwind Ltd", status: "Overdue", total: "€380.00" },
  { id: 3, client: "Removed client", status: "Paid", total: "€72.90" },
];

export const CellsAndAlignment = () => (
  <View style={frame}>
    <DataGrid
      data={crmRows}
      columns={crmColumns}
      rowStyle={(row: { id: number }) =>
        row.id === 3 ? { opacity: 0.45 } : undefined
      }
    />
  </View>
);

export const EmptyState = () => (
  <View style={frame}>
    <DataGrid
      data={[]}
      columns={crmColumns}
      emptyState={
        <Typography variant="bodyMedium">
          No invoices yet. Create the first one from the button above.
        </Typography>
      }
    />
  </View>
);

export const TitleAndPaging = () => (
  <View style={{ ...frame, height: 420 }}>
    <DataGrid
      data={rows}
      columns={columns}
      tableTitle="Invoices"
      rowsPerPage={3}
      height={400}
    />
  </View>
);

export const HoverSelectedAndClick = () => (
  <View style={frame}>
    <DataGrid
      data={rows}
      columns={columns}
      hover
      selected={1}
      onClick={() => {}}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Sorted",
    title: "Sorted",
    render: Sorted,
  },
  {
    name: "Dense",
    title: "Dense",
    render: Dense,
  },
  {
    name: "Loading",
    title: "Loading",
    render: Loading,
  },
  {
    name: "Empty",
    title: "Empty",
    render: Empty,
  },
  {
    name: "CellsAndAlignment",
    title: "Cells and alignment",
    render: CellsAndAlignment,
  },
  {
    name: "EmptyState",
    title: "Empty state",
    render: EmptyState,
  },
  {
    name: "TitleAndPaging",
    title: "Title and paging",
    render: TitleAndPaging,
  },
  {
    name: "HoverSelectedAndClick",
    title: "Hover selected and click",
    render: HoverSelectedAndClick,
  },
];
