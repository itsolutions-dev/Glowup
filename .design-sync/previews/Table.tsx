import React from "react";
import {
  StatusBadge,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@its/glowup-ui";

// TableRow is content-height; body rows set their own height, as DataGrid does.
const row = { minHeight: 48 };

const fit = (width: number): React.CSSProperties => ({
  width,
  display: "flex",
  flexDirection: "column",
});

const COLUMNS = [
  { key: "name", label: "Name", width: 180 },
  { key: "role", label: "Role", width: 140 },
  { key: "city", label: "City", width: 120 },
] as const;

const ROWS = [
  { name: "Ada Lovelace", role: "Analyst", city: "London" },
  { name: "Grace Hopper", role: "Engineer", city: "New York" },
  { name: "Katherine Johnson", role: "Mathematician", city: "Hampton" },
];

export const Basic = () => (
  <div style={fit(442)}>
    <Table>
      <TableHead>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableHeaderCell key={column.key} width={column.width}>
              {column.label}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      {ROWS.map((r) => (
        <TableRow key={r.name} style={row}>
          {COLUMNS.map((column) => (
            <TableCell key={column.key} width={column.width}>
              {r[column.key]}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </Table>
  </div>
);

export const SortedColumn = () => (
  <div style={fit(442)}>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell
            width={180}
            sortable
            sortDirection="asc"
            onPress={() => {}}
          >
            Name
          </TableHeaderCell>
          <TableHeaderCell width={140} sortable onPress={() => {}}>
            Role
          </TableHeaderCell>
          <TableHeaderCell width={120}>City</TableHeaderCell>
        </TableRow>
      </TableHead>
      {ROWS.map((r) => (
        <TableRow key={r.name} style={row}>
          <TableCell width={180}>{r.name}</TableCell>
          <TableCell width={140}>{r.role}</TableCell>
          <TableCell width={120}>{r.city}</TableCell>
        </TableRow>
      ))}
    </Table>
  </div>
);

export const RichCells = () => (
  <div style={fit(402)}>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell width={140}>Invoice</TableHeaderCell>
          <TableHeaderCell width={120}>Amount</TableHeaderCell>
          <TableHeaderCell width={140}>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      {[
        {
          id: "#10428",
          amount: "€ 1,240.00",
          status: "success",
          label: "Paid",
        },
        { id: "#10429", amount: "€ 385.50", status: "warning", label: "Due" },
        {
          id: "#10430",
          amount: "€ 2,010.00",
          status: "error",
          label: "Overdue",
        },
      ].map((r) => (
        <TableRow key={r.id} style={row}>
          <TableCell width={140}>{r.id}</TableCell>
          <TableCell width={120}>{r.amount}</TableCell>
          <TableCell width={140}>
            <StatusBadge
              type={r.status as "success" | "warning" | "error"}
              label={r.label}
            />
          </TableCell>
        </TableRow>
      ))}
    </Table>
  </div>
);
