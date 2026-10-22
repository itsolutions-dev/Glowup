import React from "react";
import {
  Avatar,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Typography,
  useTheme,
} from "@its/glowup-ui";

// TableCell is a body cell of a Table; it is shown inside one.
const fit: React.CSSProperties = {
  width: 402,
  display: "flex",
  flexDirection: "column",
};
const row = { minHeight: 52 };

export const TextCells = () => (
  <div style={fit}>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell width={200}>Project</TableHeaderCell>
          <TableHeaderCell width={100}>Tasks</TableHeaderCell>
          <TableHeaderCell width={100}>Due</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableRow style={row}>
        <TableCell width={200}>Website redesign</TableCell>
        <TableCell width={100}>18</TableCell>
        <TableCell width={100}>12 Oct</TableCell>
      </TableRow>
      <TableRow style={row}>
        <TableCell width={200}>Mobile onboarding</TableCell>
        <TableCell width={100}>7</TableCell>
        <TableCell width={100}>3 Nov</TableCell>
      </TableRow>
    </Table>
  </div>
);

export const CustomContent = () => {
  const { theme } = useTheme();
  return (
    <div style={fit}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell width={240}>Owner</TableHeaderCell>
            <TableHeaderCell width={160}>Balance</TableHeaderCell>
          </TableRow>
        </TableHead>
        {[
          ["Marta Rossi", "€ 1,240.00", false],
          ["Luca Bianchi", "−€ 85.50", true],
        ].map(([name, balance, negative]) => (
          <TableRow key={name as string} style={row}>
            <TableCell width={240}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={name as string} size={28} />
                <Typography variant="bodyMedium">{name as string}</Typography>
              </div>
            </TableCell>
            <TableCell
              width={160}
              textStyle={negative ? { color: theme.colors.error } : undefined}
            >
              {balance as string}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
};

/** `align` sets where the content sits; right suits a number. */
export const Aligned = () => (
  <div style={fit}>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell width={200}>Item</TableHeaderCell>
          <TableHeaderCell width={100} align="center">
            Qty
          </TableHeaderCell>
          <TableHeaderCell width={100} align="right">
            Price
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableRow style={row}>
        <TableCell width={200}>Desk lamp</TableCell>
        <TableCell width={100} align="center">
          2
        </TableCell>
        <TableCell width={100} align="right">
          € 78.00
        </TableCell>
      </TableRow>
    </Table>
  </div>
);

/** With `flex` a cell shares the row's free width instead of keeping a fixed one; `width` is then its minimum. */
export const FlexCells = () => (
  <div style={fit}>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell width={80}>Id</TableHeaderCell>
          <TableHeaderCell width={120} flex>
            Project
          </TableHeaderCell>
          <TableHeaderCell width={120} flex>
            Owner
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableRow style={row}>
        <TableCell width={80}>#12</TableCell>
        <TableCell width={120} flex>
          Website redesign
        </TableCell>
        <TableCell width={120} flex>
          Marta Rossi
        </TableCell>
      </TableRow>
    </Table>
  </div>
);
