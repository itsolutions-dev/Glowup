import React from "react";
import { Table, TableHead, TableHeaderCell, TableRow } from "@its/glowup-ui";

// TableHeaderCell is a column header of a Table; it is shown inside one.
const fit: React.CSSProperties = {
  width: 442,
  display: "flex",
  flexDirection: "column",
};

export const Plain = () => (
  <div style={fit}>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell width={180}>Name</TableHeaderCell>
          <TableHeaderCell width={140}>Role</TableHeaderCell>
          <TableHeaderCell width={120}>City</TableHeaderCell>
        </TableRow>
      </TableHead>
    </Table>
  </div>
);

export const SortStates = () => (
  <div style={fit}>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell
            width={180}
            sortable
            sortDirection="asc"
            onPress={() => {}}
          >
            Ascending
          </TableHeaderCell>
          <TableHeaderCell
            width={140}
            sortable
            sortDirection="desc"
            onPress={() => {}}
          >
            Descending
          </TableHeaderCell>
          <TableHeaderCell width={120} sortable onPress={() => {}}>
            Sortable
          </TableHeaderCell>
        </TableRow>
      </TableHead>
    </Table>
  </div>
);
