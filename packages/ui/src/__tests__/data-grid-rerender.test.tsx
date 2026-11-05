import React, { useEffect, useMemo, useState } from "react";
import { Text } from "react-native";
import { act, render } from "@testing-library/react-native";
import { DataGrid, ThemeProvider, type ColumnDefinition } from "..";

// A screen that re-rendered around its grid (a keystroke in a search box
// before its debounce, a counter elsewhere) re-rendered every row the grid
// had drawn, with the same rows: 0.14 s a keystroke with 2,000 contacts.
const rows = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  name: `Contact ${i}`,
}));

let cellRenders = 0;
let bump: () => void = () => {};

const Screen = ({ selected }: { selected?: number }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    bump = () => setTick((t) => t + 1);
  });
  const columns = useMemo<ColumnDefinition[]>(
    () => [
      {
        id: "name",
        label: "Name",
        renderCell: (value: string) => {
          cellRenders++;
          return <Text>{value}</Text>;
        },
      },
    ],
    [],
  );
  return (
    <DataGrid columns={columns} data={rows} selected={selected} height={400} />
  );
};

describe("DataGrid rows", () => {
  it("are not drawn again when the screen re-renders with the same rows", async () => {
    await render(
      <ThemeProvider>
        <Screen />
      </ThemeProvider>,
    );
    expect(cellRenders).toBeGreaterThan(0);
    cellRenders = 0;
    await act(async () => bump());
    expect(cellRenders).toBe(0);
  });

  // The row is drawn again for its selected look; its cells show the same
  // value, so they are not (since 2/11, when custom cells got their own memo).
  it("a row whose selection changes does not draw its cells again", async () => {
    const view = await render(
      <ThemeProvider>
        <Screen />
      </ThemeProvider>,
    );
    cellRenders = 0;
    await view.rerender(
      <ThemeProvider>
        <Screen selected={2} />
      </ThemeProvider>,
    );
    expect(cellRenders).toBe(0);
    expect(view.getByText("Contact 2")).toBeTruthy();
  });
});

// A sort hands the same row objects back in another order. Each row that moved
// has a new index, so the row itself is drawn again; its custom cells were too,
// and they are where the time goes (chips, avatars, formatted amounts): 0.2 s a
// sort with the contacts pilot's 2,000 rows (29/10). A renderCell that does not
// take the index cannot change when only the index does.
describe("DataGrid after a sort", () => {
  // Few enough to be all on screen: rows scrolled into view are drawn anyway.
  const few = rows.slice(0, 8);
  const sortable = (renderCell: ColumnDefinition["renderCell"]) =>
    function Sorted({ order }: { order: "asc" | "desc" }) {
      const columns = useMemo<ColumnDefinition[]>(
        () => [{ id: "name", label: "Name", renderCell }],
        [],
      );
      const data = useMemo(
        () => (order === "asc" ? few : [...few].reverse()),
        [order],
      );
      return <DataGrid columns={columns} data={data} height={400} />;
    };

  it("does not draw a cell again when its renderCell does not take the index", async () => {
    let calls = 0;
    const Sorted = sortable((value: string) => {
      calls++;
      return <Text>{value}</Text>;
    });
    const view = await render(
      <ThemeProvider>
        <Sorted order="asc" />
      </ThemeProvider>,
    );
    expect(calls).toBeGreaterThan(0);
    calls = 0;
    await view.rerender(
      <ThemeProvider>
        <Sorted order="desc" />
      </ThemeProvider>,
    );
    expect(view.getByText("Contact 7")).toBeTruthy();
    expect(calls).toBe(0);
  });

  it("draws it again when renderCell takes the index (a row number, say)", async () => {
    let calls = 0;
    const Sorted = sortable((_value: string, _row: unknown, index: number) => {
      calls++;
      return <Text>{`#${index + 1}`}</Text>;
    });
    const view = await render(
      <ThemeProvider>
        <Sorted order="asc" />
      </ThemeProvider>,
    );
    calls = 0;
    await view.rerender(
      <ThemeProvider>
        <Sorted order="desc" />
      </ThemeProvider>,
    );
    expect(calls).toBeGreaterThan(0);
    expect(view.getAllByText("#1")).toHaveLength(1);
  });
});

describe("DataGrid custom cells", () => {
  // Memoising the custom cells (2/11) first dropped the Text a TableCell puts
  // around a string, and a renderCell returning "€1240.50" threw on native.
  it("draw a string or a number returned by renderCell as the table's text", async () => {
    const view = await render(
      <ThemeProvider>
        <DataGrid
          columns={[
            {
              id: "total",
              label: "Total",
              renderCell: (value: number) => `€${value.toFixed(2)}`,
            },
            { id: "qty", label: "Qty", renderCell: (value: number) => value },
          ]}
          data={[{ id: 1, total: 1240.5, qty: 3 }]}
        />
      </ThemeProvider>,
    );
    expect(view.getByText("€1240.50").type).toBe("Text");
    expect(view.getByText("3").type).toBe("Text");
  });
});
