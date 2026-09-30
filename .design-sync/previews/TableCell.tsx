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
