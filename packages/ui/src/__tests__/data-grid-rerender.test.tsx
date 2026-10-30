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

  it("a row whose selection changes is drawn again, and only that one", async () => {
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
    expect(cellRenders).toBe(1);
  });
});
