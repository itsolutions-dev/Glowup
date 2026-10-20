import React from "react";
import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Table, TableCell, TableRow, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const json = async (ui: React.ReactElement) =>
  JSON.stringify((await draw(ui)).toJSON());

const columns = [
  { id: "name", label: "Name" },
  { id: "total", label: "Total", alignment: "right" as const },
];

const rows = [
  { name: "Ada", total: 10 },
  { name: "Grace", total: 20 },
  { name: "Linus", total: 30 },
  { name: "Margaret", total: 40 },
  { name: "Ken", total: 50 },
];

describe("Table (data driven)", () => {
  it("draws the title, the header and a cell for every column of every row", async () => {
    const { getByText, getAllByText } = await draw(
      <Table tableTitle="Customers" columns={columns} data={rows} />,
    );
    expect(getByText("Customers").props.accessibilityRole).toBe("header");
    expect(getByText("Name")).toBeTruthy();
    expect(getByText("Total")).toBeTruthy();
    expect(getByText("Ada")).toBeTruthy();
    expect(getByText("50")).toBeTruthy();
    expect(getAllByText(/^\d+$/)).toHaveLength(5);
  });

  it("aligns a column's header and cells, and sizes fixed and flexible columns", async () => {
    const out = await json(
      <Table
        columns={[
          { id: "name", label: "Name", width: 90 },
          { id: "total", label: "Total", alignment: "right" },
        ]}
        data={rows}
      />,
    );
    expect(out).toContain('"textAlign":"right"');
    expect(out).toContain('"alignItems":"flex-end"');
    // The fixed column keeps its width, the other shares the free width.
    expect(out).toContain('"width":90');
    expect(out).toContain('"flex":1');
  });

  it("draws a column's fallback for an empty cell, and 0 is not empty", async () => {
    const { getAllByText, getByText, queryByText } = await draw(
      <Table
        columns={[
          { id: "name", label: "Name", fallback: "Unknown" },
          { id: "total", label: "Total", fallback: <Text>n/a</Text> },
        ]}
        data={[
          { name: "", total: 0 },
          { name: null, total: undefined },
          { name: undefined, total: null },
        ]}
      />,
    );
    expect(getAllByText("Unknown")).toHaveLength(3);
    expect(getAllByText("n/a")).toHaveLength(2);
    expect(getByText("0")).toBeTruthy();
    expect(queryByText("No data")).toBeNull();
  });

  it("leaves an empty cell empty without a fallback", async () => {
    const { toJSON } = await draw(
      <Table columns={[{ id: "a", label: "A" }]} data={[{ a: undefined }]} />,
    );
    expect(JSON.stringify(toJSON())).not.toContain("N/A");
  });

  it("shows the empty message under the header when there is no data", async () => {
    const empty = await draw(<Table columns={columns} data={[]} />);
    expect(empty.getByText("No data")).toBeTruthy();
    expect(empty.getByText("Name")).toBeTruthy();
    const custom = await draw(
      <Table
        columns={columns}
        data={[]}
        rowsPerPage={5}
        emptyMessage={<Text testID="none">Nothing yet</Text>}
      />,
    );
    expect(custom.getByTestId("none")).toBeTruthy();
    // No pager for a table with nothing to page.
    expect(custom.queryByRole("button", { name: "Next page" })).toBeNull();
  });

  it("with rowsPerPage slices the rows into pages under a Pagination", async () => {
    const { getByText, queryByText, getByRole } = await draw(
      <Table columns={columns} data={rows} rowsPerPage={2} />,
    );
    expect(getByText("Ada")).toBeTruthy();
    expect(getByText("Grace")).toBeTruthy();
    expect(queryByText("Linus")).toBeNull();
    expect(getByRole("button", { name: "Page 3" })).toBeTruthy();

    await fireEvent.press(getByRole("button", { name: "Page 2" }));
    expect(queryByText("Ada")).toBeNull();
    expect(getByText("Linus")).toBeTruthy();
    expect(getByText("Margaret")).toBeTruthy();

    await fireEvent.press(getByRole("button", { name: "Next page" }));
    expect(getByText("Ken")).toBeTruthy();
    expect(queryByText("Linus")).toBeNull();
  });

  it("draws every row in one page and no pager without rowsPerPage", async () => {
    const { getByText, queryByRole } = await draw(
      <Table columns={columns} data={rows} />,
    );
    expect(getByText("Ada")).toBeTruthy();
    expect(getByText("Ken")).toBeTruthy();
    expect(queryByRole("button", { name: "Next page" })).toBeNull();
  });

  it("goes back to the first page when rowsPerPage or the number of rows changes", async () => {
    const ui = (props: { rowsPerPage: number; data: typeof rows }) => (
      <ThemeProvider>
        <Table columns={columns} {...props} />
      </ThemeProvider>
    );
    const { getByText, getByRole, queryByText, rerender } = await render(
      ui({ rowsPerPage: 2, data: rows }),
    );
    await fireEvent.press(getByRole("button", { name: "Page 3" }));
    expect(getByText("Ken")).toBeTruthy();

    // The same rows in a new array (an inline `data` prop) keep the page.
    await rerender(ui({ rowsPerPage: 2, data: [...rows] }));
    expect(getByText("Ken")).toBeTruthy();

    await rerender(ui({ rowsPerPage: 3, data: [...rows] }));
    expect(getByText("Ada")).toBeTruthy();
    expect(queryByText("Ken")).toBeNull();

    await fireEvent.press(getByRole("button", { name: "Page 2" }));
    expect(getByText("Ken")).toBeTruthy();
    await rerender(ui({ rowsPerPage: 3, data: rows.slice(0, 4) }));
    expect(getByText("Ada")).toBeTruthy();
  });

  it("marks the selected rows, by their index in data, even on another page", async () => {
    // Counted without a pager, whose active page is marked selected too.
    const marked = (tree: unknown) =>
      (JSON.stringify(tree).match(/"selected":true/g) ?? []).length;
    const count = async (selected?: number | number[]) =>
      marked(
        (
          await draw(
            <Table columns={columns} data={rows} selected={selected} />,
          )
        ).toJSON(),
      );
    expect(await count()).toBe(0);
    expect(await count(1)).toBe(1);
    expect(await count([0, 1])).toBe(2);
    expect(await count([9])).toBe(0);

    // Index 3 is on the second page: the first page marks nothing but its pager.
    const paged = await draw(
      <Table columns={columns} data={rows} rowsPerPage={2} selected={3} />,
    );
    expect(marked(paged.toJSON())).toBe(1);
    await fireEvent.press(paged.getByRole("button", { name: "Page 2" }));
    expect(marked(paged.toJSON())).toBe(2);
  });

  it("makes the rows buttons that report the row and its index, only with onClick", async () => {
    const onClick = jest.fn();
    const withClick = await draw(
      <Table columns={columns} data={rows} rowsPerPage={2} onClick={onClick} />,
    );
    await fireEvent.press(withClick.getByRole("button", { name: /Grace/ }));
    expect(onClick).toHaveBeenLastCalledWith(rows[1], 1);
    // The index is the row's position in data, not on the page.
    await fireEvent.press(withClick.getByRole("button", { name: "Page 2" }));
    await fireEvent.press(withClick.getByRole("button", { name: /Margaret/ }));
    expect(onClick).toHaveBeenLastCalledWith(rows[3], 3);

    const without = await draw(<Table columns={columns} data={rows} />);
    expect(without.queryByRole("button")).toBeNull();
  });

  it("with hover highlights rows without making them buttons", async () => {
    const hover = await draw(<Table columns={columns} data={rows} hover />);
    expect(hover.queryByRole("button")).toBeNull();
    expect(hover.getByText("Ada")).toBeTruthy();
  });

  it("takes width, height and style, and scrolls the body only with a height", async () => {
    const plain = await json(
      <Table columns={columns} data={rows} width={320} style={{ margin: 7 }} />,
    );
    expect(plain).toContain('"width":320');
    expect(plain).toContain('"margin":7');
    expect(plain).not.toContain('"height":200');
    // One ScrollView: the horizontal one.
    expect(plain.match(/RCTScrollView/g)).toHaveLength(1);

    const tall = await json(
      <Table columns={columns} data={rows} height={200} width="50%" />,
    );
    expect(tall).toContain('"height":200');
    expect(tall).toContain('"width":"50%"');
    // The horizontal one and the body's.
    expect(tall.match(/RCTScrollView/g)).toHaveLength(2);
  });
});

describe("Table (primitives)", () => {
  it("is still only the container of its children without columns", async () => {
    const { getByText } = await draw(
      <Table>
        <TableRow>
          <TableCell>Ada</TableCell>
        </TableRow>
      </Table>,
    );
    expect(getByText("Ada")).toBeTruthy();
  });

  it("makes a TableRow with onClick a button, marked selected", async () => {
    const onClick = jest.fn();
    const { getByRole } = await draw(
      <Table>
        <TableRow onClick={onClick} selected>
          <TableCell>Ada</TableCell>
        </TableRow>
      </Table>,
    );
    const row = getByRole("button", { name: /Ada/ });
    expect(row.props.accessibilityState).toMatchObject({ selected: true });
    await fireEvent.press(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
