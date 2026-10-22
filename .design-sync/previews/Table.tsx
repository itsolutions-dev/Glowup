import React from "react";
import type { TableColumn, TableRowData } from "@its/glowup-ui";
import {
  StatusBadge,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Typography,
} from "@its/glowup-ui";

// A Table with `columns` and `data` draws itself; without them it is only the
// container of the primitives, shown last.
const frame = (width: number): React.CSSProperties => ({
  width,
  display: "flex",
  flexDirection: "column",
  gap: 12,
});

const COLUMNS: TableColumn[] = [
  { id: "name", label: "Name" },
  { id: "role", label: "Role" },
  { id: "city", label: "City" },
];

const PEOPLE: TableRowData[] = [
  { name: "Ada Lovelace", role: "Analyst", city: "London" },
  { name: "Grace Hopper", role: "Engineer", city: "New York" },
  { name: "Katherine Johnson", role: "Mathematician", city: "Hampton" },
  { name: "Alan Turing", role: "Researcher", city: "Wilmslow" },
  { name: "Hedy Lamarr", role: "Inventor", city: "Vienna" },
  { name: "Margaret Hamilton", role: "Engineer", city: "Boston" },
  { name: "Dorothy Vaughan", role: "Supervisor", city: "Hampton" },
  { name: "Mary Jackson", role: "Engineer", city: "Hampton" },
];

/** `columns` and `data` are all it takes; `tableTitle` heads it and names it for a screen reader. */
export const Basic = () => (
  <div style={frame(520)}>
    <Table tableTitle="Team" columns={COLUMNS} data={PEOPLE.slice(0, 3)} />
  </div>
);

/** `hover` lights the row under the pointer on web. `selected` takes an index, or an array of them. */
export const HoverAndSelected = () => (
  <div style={frame(520)}>
    <Table
      columns={COLUMNS}
      data={PEOPLE.slice(0, 4)}
      hover
      selected={[0, 2]}
    />
  </div>
);

/** `rowsPerPage` slices the data and puts a Pagination under the table. */
export const Paged = () => (
  <div style={frame(520)}>
    <Table
      tableTitle="Team"
      columns={COLUMNS}
      data={PEOPLE}
      rowsPerPage={3}
      hover
    />
  </div>
);

/** With a `height` the rows scroll under a header that stays in place. */
export const FixedHeight = () => (
  <div style={frame(520)}>
    <Table columns={COLUMNS} data={PEOPLE} height={236} />
  </div>
);

/** No rows: `emptyMessage` stands in, "No data" unless you say otherwise. */
export const Empty = () => (
  <div style={frame(520)}>
    <Table columns={COLUMNS} data={[]} />
    <Table columns={COLUMNS} data={[]} emptyMessage="No one has joined yet" />
  </div>
);

const SPARSE_COLUMNS: TableColumn[] = [
  { id: "name", label: "Name" },
  { id: "phone", label: "Phone", fallback: "Not given" },
  { id: "orders", label: "Orders", alignment: "right", width: 100 },
  { id: "note", label: "Note", fallback: "—" },
];

/** A cell with no value draws its column's `fallback`; `0` is a value, not an empty cell. */
export const FallbackCells = () => (
  <div style={frame(560)}>
    <Table
      columns={SPARSE_COLUMNS}
      data={[
        { name: "Ada Lovelace", phone: "+44 20 7946 0000", orders: 12 },
        { name: "Grace Hopper", phone: null, orders: 0, note: "Prefers email" },
        { name: "Alan Turing", phone: "", orders: 3 },
      ]}
    />
  </div>
);

/** `onClick` makes the rows pressable, and receives the row and its index in `data`. */
export const Clickable = () => {
  const [last, setLast] = React.useState<string | null>(null);
  return (
    <div style={frame(520)}>
      <Table
        columns={COLUMNS}
        data={PEOPLE.slice(0, 4)}
        hover
        selected={last ? PEOPLE.findIndex((p) => p.name === last) : undefined}
        onClick={(row) => setLast(String(row.name))}
      />
      <Typography variant="bodySmall">
        {last ? `Pressed: ${last}` : "Press a row."}
      </Typography>
    </div>
  );
};

const INVOICE_COLUMNS: TableColumn[] = [
  { id: "id", label: "Invoice", width: 110 },
  { id: "amount", label: "Amount", alignment: "right", width: 130 },
  { id: "status", label: "Status", width: 130 },
];

const STATUS: Record<string, "success" | "warning" | "error"> = {
  Paid: "success",
  Due: "warning",
  Overdue: "error",
};

/** A cell can be any node: a StatusBadge here. Columns with a `width` keep it. */
export const RichCells = () => (
  <div style={frame(370)}>
    <Table
      columns={INVOICE_COLUMNS}
      data={[
        ["#10428", "€ 1,240.00", "Paid"],
        ["#10429", "€ 385.50", "Due"],
        ["#10430", "€ 2,010.00", "Overdue"],
      ].map(([id, amount, status]) => ({
        id,
        amount,
        status: <StatusBadge type={STATUS[status]} label={status} />,
      }))}
    />
  </div>
);

/** Columns that add up to more than the table's `width` make it scroll sideways. */
export const SidewaysScroll = () => (
  <div style={frame(360)}>
    <Table
      width={360}
      columns={[
        { id: "name", label: "Name", width: 180 },
        { id: "role", label: "Role", width: 140 },
        { id: "city", label: "City", width: 140 },
        { id: "orders", label: "Orders", alignment: "right", width: 100 },
      ]}
      data={[
        { name: "Ada Lovelace", role: "Analyst", city: "London", orders: 12 },
        {
          name: "Grace Hopper",
          role: "Engineer",
          city: "New York",
          orders: 48,
        },
      ]}
    />
  </div>
);

const ROW = { minHeight: 48 };

/** Without `columns`, `Table` is only the container: lay the rows out with `TableHead`, `TableRow` and `TableCell`. */
export const Primitives = () => (
  <div style={frame(442)}>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell width={180}>Name</TableHeaderCell>
          <TableHeaderCell width={140}>Role</TableHeaderCell>
          <TableHeaderCell width={120}>City</TableHeaderCell>
        </TableRow>
      </TableHead>
      {PEOPLE.slice(0, 3).map((p) => (
        <TableRow key={String(p.name)} style={ROW}>
          <TableCell width={180}>{p.name}</TableCell>
          <TableCell width={140}>{p.role}</TableCell>
          <TableCell width={120}>{p.city}</TableCell>
        </TableRow>
      ))}
    </Table>
  </div>
);

/** A sortable header is a button: `onClick` sorts, `sortDirection` draws the arrow. */
export const SortedColumn = () => (
  <div style={frame(442)}>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell
            width={180}
            sortable
            sortDirection="asc"
            onClick={() => {}}
          >
            Name
          </TableHeaderCell>
          <TableHeaderCell width={140} sortable onClick={() => {}}>
            Role
          </TableHeaderCell>
          <TableHeaderCell width={120}>City</TableHeaderCell>
        </TableRow>
      </TableHead>
      {PEOPLE.slice(0, 3).map((p) => (
        <TableRow key={String(p.name)} style={ROW}>
          <TableCell width={180}>{p.name}</TableCell>
          <TableCell width={140}>{p.role}</TableCell>
          <TableCell width={120}>{p.city}</TableCell>
        </TableRow>
      ))}
    </Table>
  </div>
);
