import React from "react";
import {
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  useTheme,
} from "@its/glowup-ui";

// TableRow is content-height: body rows set their own height, as DataGrid does.
const fit: React.CSSProperties = {
  width: 402,
  display: "flex",
  flexDirection: "column",
};

const PEOPLE = [
  ["Ada Lovelace", "Analyst"],
  ["Grace Hopper", "Engineer"],
  ["Alan Turing", "Researcher"],
  ["Hedy Lamarr", "Inventor"],
];

const Header = () => (
  <TableHead>
    <TableRow>
      <TableHeaderCell width={200}>Name</TableHeaderCell>
      <TableHeaderCell width={200}>Role</TableHeaderCell>
    </TableRow>
  </TableHead>
);

export const Comfortable = () => (
  <div style={fit}>
    <Table>
      <Header />
      {PEOPLE.map(([name, role]) => (
        <TableRow key={name} style={{ height: 56 }}>
          <TableCell width={200}>{name}</TableCell>
          <TableCell width={200}>{role}</TableCell>
        </TableRow>
      ))}
    </Table>
  </div>
);

export const DenseStriped = () => {
  const { theme } = useTheme();
  return (
    <div style={fit}>
      <Table>
        <Header />
        {PEOPLE.map(([name, role], index) => (
          <TableRow
            key={name}
            style={{
              height: 40,
              backgroundColor:
                index % 2 === 1 ? theme.colors.surfaceContainer : undefined,
            }}
          >
            <TableCell width={200}>{name}</TableCell>
            <TableCell width={200}>{role}</TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
};
