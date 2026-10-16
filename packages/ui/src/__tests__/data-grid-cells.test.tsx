import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { DataGrid, ThemeProvider } from "..";

const rows = [
  { id: "1", name: "Marta", total: 1200 },
  { id: "2", name: "Luca", total: 80 },
];

const json = async (ui: React.ReactElement) =>
  JSON.stringify((await render(<ThemeProvider>{ui}</ThemeProvider>)).toJSON());

describe("DataGrid cells", () => {
  it("draws renderCell instead of the raw value, with the value, row and index", async () => {
    const renderCell = jest.fn((value: number) => <Text>{`€ ${value}`}</Text>);
    const out = await json(
      <DataGrid
        data={rows}
        columns={[
          { id: "name", label: "Name" },
          { id: "total", label: "Total", renderCell },
        ]}
      />,
    );
    expect(out).toContain("€ 1200");
    expect(out).toContain("€ 80");
    expect(renderCell).toHaveBeenCalledWith(1200, rows[0], 0);
    expect(renderCell).toHaveBeenCalledWith(80, rows[1], 1);
  });

  it("aligns the header and the cells of a column", async () => {
    const columns = (align?: "right") => [
      { id: "name", label: "Name" },
      { id: "total", label: "Total", align },
    ];
    const right = await json(
      <DataGrid data={rows} columns={columns("right")} />,
    );
    const left = await json(<DataGrid data={rows} columns={columns()} />);
    // Cell container, cell text and header content all follow the column.
    expect(right).toContain('"textAlign":"right"');
    expect(right).toContain('"alignItems":"flex-end"');
    expect(right).toContain('"justifyContent":"flex-end"');
    expect(left).not.toContain('"textAlign":"right"');
    expect(left).not.toContain('"alignItems":"flex-end"');
  });

  it("takes rowStyle as a function of the row", async () => {
    const out = await json(
      <DataGrid
        data={rows}
        columns={[{ id: "name", label: "Name" }]}
        rowStyle={(row) => (row.id === "2" ? { opacity: 0.4 } : undefined)}
      />,
    );
    expect(out.match(/"opacity":0\.4/g)).toHaveLength(1);
  });

  it("draws emptyState, ahead of emptyMessage, only when there is no data", async () => {
    const columns = [{ id: "name", label: "Name" }];
    const empty = await render(
      <ThemeProvider>
        <DataGrid
          data={[]}
          columns={columns}
          emptyMessage="Nothing"
          emptyState={<Text>No clients yet</Text>}
        />
      </ThemeProvider>,
    );
    expect(empty.queryByText("No clients yet")).toBeTruthy();
    expect(empty.queryByText("Nothing")).toBeNull();

    const full = await render(
      <ThemeProvider>
        <DataGrid
          data={rows}
          columns={columns}
          emptyState={<Text>No clients yet</Text>}
        />
      </ThemeProvider>,
    );
    expect(full.queryByText("No clients yet")).toBeNull();
  });
});
