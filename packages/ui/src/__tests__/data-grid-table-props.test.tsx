import React from "react";
import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { DataGrid, ThemeProvider } from "..";

// DataGrid takes the props `Table` has: title, width, height, paging, hover,
// selected, onClick, and its column spellings (`alignment`, `fallback`).

const columns = [
  { id: "name", label: "Name" },
  { id: "role", label: "Role", fallback: "n/a" },
];
const rows = [
  { id: "1", name: "Ada", role: "Engineer" },
  { id: "2", name: "Grace", role: "" },
  { id: "3", name: "Linus", role: "Maintainer" },
  { id: "4", name: "Margaret", role: "Lead" },
  { id: "5", name: "Ken", role: "Hacker" },
];

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const json = async (ui: React.ReactElement) =>
  JSON.stringify((await draw(ui)).toJSON());

describe("DataGrid, with Table's props", () => {
  it("draws tableTitle as a heading above the header", async () => {
    const { getByRole, queryByRole } = await draw(
      <DataGrid data={rows} columns={columns} tableTitle="Team" />,
    );
    expect(getByRole("header", { name: "Team" })).toBeTruthy();
    const none = await draw(<DataGrid data={rows} columns={columns} />);
    expect(none.queryByRole("header")).toBeNull();
    expect(queryByRole("button")).toBeNull();
  });

  it("takes width and height, and fills its container only without a height", async () => {
    const sized = await json(
      <DataGrid data={rows} columns={columns} width={420} height={240} />,
    );
    // The grid style is the first of Table's style array.
    expect(sized).toContain('[false,{"width":420},{"height":240}');
    const fill = await json(<DataGrid data={rows} columns={columns} />);
    expect(fill).toContain('[{"flex":1},');
  });

  it("with rowsPerPage draws one page at a time under a Pagination", async () => {
    const { getByText, queryByText, getByRole } = await draw(
      <DataGrid data={rows} columns={columns} rowsPerPage={2} />,
    );
    expect(getByText("Ada")).toBeTruthy();
    expect(queryByText("Linus")).toBeNull();
    expect(getByRole("button", { name: "Page 3" })).toBeTruthy();
    await fireEvent.press(getByRole("button", { name: "Page 2" }));
    expect(queryByText("Ada")).toBeNull();
    expect(getByText("Linus")).toBeTruthy();
    expect(getByText("Margaret")).toBeTruthy();
  });

  it("has no pager without rowsPerPage, or without rows", async () => {
    const all = await draw(<DataGrid data={rows} columns={columns} />);
    expect(all.getByText("Ken")).toBeTruthy();
    expect(all.queryByRole("button", { name: "Next page" })).toBeNull();
    const empty = await draw(
      <DataGrid data={[]} columns={columns} rowsPerPage={2} />,
    );
    expect(empty.queryByRole("button", { name: "Next page" })).toBeNull();
  });

  it("goes back to page 1 when rowsPerPage or the row count changes, not for a new equal array", async () => {
    const ui = (props: { rowsPerPage: number; data: typeof rows }) => (
      <ThemeProvider>
        <DataGrid columns={columns} {...props} />
      </ThemeProvider>
    );
    const { getByText, getByRole, queryByText, rerender } = await render(
      ui({ rowsPerPage: 2, data: rows }),
    );
    await fireEvent.press(getByRole("button", { name: "Page 3" }));
    expect(getByText("Ken")).toBeTruthy();

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

  it("marks the selected rows by their index in data, even on another page", async () => {
    // Counted without a pager, whose active page is marked selected too.
    const marked = (tree: unknown) =>
      (JSON.stringify(tree).match(/"selected":true/g) ?? []).length;
    const count = async (selected?: number | number[]) =>
      marked(
        (
          await draw(
            <DataGrid data={rows} columns={columns} selected={selected} />,
          )
        ).toJSON(),
      );
    expect(await count()).toBe(0);
    expect(await count(1)).toBe(1);
    expect(await count([0, 1])).toBe(2);
    expect(await count([9])).toBe(0);

    const paged = await draw(
      <DataGrid data={rows} columns={columns} rowsPerPage={2} selected={3} />,
    );
    expect(marked(paged.toJSON())).toBe(1);
    await fireEvent.press(paged.getByRole("button", { name: "Page 2" }));
    expect(marked(paged.toJSON())).toBe(2);
  });

  it("makes the rows buttons that report the row and its index in data, only with onClick", async () => {
    const onClick = jest.fn();
    const withClick = await draw(
      <DataGrid
        data={rows}
        columns={columns}
        rowsPerPage={2}
        onClick={onClick}
      />,
    );
    await fireEvent.press(withClick.getByRole("button", { name: /Grace/ }));
    expect(onClick).toHaveBeenLastCalledWith(rows[1], 1);
    await fireEvent.press(withClick.getByRole("button", { name: "Page 2" }));
    await fireEvent.press(withClick.getByRole("button", { name: /Margaret/ }));
    expect(onClick).toHaveBeenLastCalledWith(rows[3], 3);

    const without = await draw(<DataGrid data={rows} columns={columns} />);
    expect(without.queryByRole("button")).toBeNull();
  });

  it("with hover highlights rows without making them buttons", async () => {
    const hover = await draw(<DataGrid data={rows} columns={columns} hover />);
    expect(hover.queryByRole("button")).toBeNull();
    expect(hover.getByText("Ada")).toBeTruthy();
  });

  it("takes Table's column spellings: alignment, fallback", async () => {
    const out = await json(
      <DataGrid
        data={rows}
        columns={[
          { id: "name", label: "Name" },
          { id: "role", label: "Role", alignment: "right", fallback: "n/a" },
        ]}
      />,
    );
    expect(out).toContain('"textAlign":"right"');
    expect(out).toContain("n/a");
    // renderCell draws every cell: the fallback is not used beside it.
    const custom = await draw(
      <DataGrid
        data={rows}
        columns={[
          {
            id: "role",
            label: "Role",
            fallback: "n/a",
            renderCell: (v: string) => <Text>{`[${v}]`}</Text>,
          },
        ]}
      />,
    );
    expect(custom.getByText("[]")).toBeTruthy();
    expect(custom.queryByText("n/a")).toBeNull();
  });

  it("takes a node as emptyMessage", async () => {
    const { getByTestId } = await draw(
      <DataGrid
        data={[]}
        columns={columns}
        emptyMessage={<Text testID="none">Nothing</Text>}
      />,
    );
    expect(getByTestId("none")).toBeTruthy();
  });
});

describe("DataGrid column reorder", () => {
  const headers = (tree: unknown) =>
    Array.from(JSON.stringify(tree).matchAll(/"(Name|Role)"/g)).map(
      (m) => m[1],
    );
  // The right arrow of the first column: the only arrow it has.
  const RIGHT = "\u{F0142}";

  const ui = (label = "Role") => (
    <ThemeProvider>
      <DataGrid
        data={rows}
        // An inline array: a new identity on every render.
        columns={[
          { id: "name", label: "Name" },
          { id: "role", label, renderCell: (v: string) => <Text>{v}</Text> },
        ]}
        onColumnReorder={() => {}}
      />
    </ThemeProvider>
  );

  it("keeps the order the user chose when columns is a new but equal array", async () => {
    const { getByText, toJSON, rerender } = await render(ui());
    expect(headers(toJSON())).toEqual(["Name", "Role"]);
    await fireEvent.press(getByText(RIGHT));
    expect(headers(toJSON())).toEqual(["Role", "Name"]);

    await rerender(ui());
    expect(headers(toJSON())).toEqual(["Role", "Name"]);
    // ...and the new definition is what is drawn.
    await rerender(ui("Job"));
    expect(JSON.stringify(toJSON())).toContain("Job");
  });
});
