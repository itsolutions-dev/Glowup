import React from "react";
import {
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@its/glowup-ui";

// TableHead is the header band of a Table; it is shown inside one.
const fit: React.CSSProperties = {
  width: 402,
  display: "flex",
  flexDirection: "column",
};
const row = { minHeight: 48 };

export const HeaderBand = () => (
  <div style={fit}>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell width={160}>Product</TableHeaderCell>
          <TableHeaderCell width={120}>Stock</TableHeaderCell>
          <TableHeaderCell width={120}>Price</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableRow style={row}>
        <TableCell width={160}>Desk lamp</TableCell>
        <TableCell width={120}>42</TableCell>
        <TableCell width={120}>€ 39.00</TableCell>
      </TableRow>
      <TableRow style={row}>
        <TableCell width={160}>Office chair</TableCell>
        <TableCell width={120}>7</TableCell>
        <TableCell width={120}>€ 189.00</TableCell>
      </TableRow>
    </Table>
  </div>
);
