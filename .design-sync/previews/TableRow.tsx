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

/** `selected` fills the row with the secondary container, and `onClick` makes it a button. */
export const SelectedAndPressable = () => {
  const [chosen, setChosen] = React.useState(1);
  return (
    <div style={fit}>
      <Table>
        <Header />
        {PEOPLE.map(([name, role], index) => (
          <TableRow
            key={name}
            hover
            selected={index === chosen}
            onClick={() => setChosen(index)}
            style={{ height: 48 }}
          >
            <TableCell width={200}>{name}</TableCell>
            <TableCell width={200}>{role}</TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
};

/**
 * `hover` alone only highlights the row under the pointer: the row stays a plain
 * row, not a control. The third row is hovered for the capture (a real
 * `pointerenter` on it, which is what react-native-web's hover listens to).
 */
export const HoverOnly = () => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    hostRef.current
      ?.querySelector('[data-testid="hovered-row"]')
      ?.dispatchEvent(
        new PointerEvent("pointerenter", { pointerType: "mouse" }),
      );
  }, []);
  return (
    <div ref={hostRef} style={fit}>
      <Table>
        <Header />
        {PEOPLE.map(([name, role], index) => (
          <TableRow
            key={name}
            hover
            testID={index === 2 ? "hovered-row" : undefined}
            style={{ height: 48 }}
          >
            <TableCell width={200}>{name}</TableCell>
            <TableCell width={200}>{role}</TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
};
