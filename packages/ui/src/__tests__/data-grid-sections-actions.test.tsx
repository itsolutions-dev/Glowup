import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { DataGrid, ThemeProvider, gridMinWidth } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const columns = [{ id: "name", label: "Name" }];

// A permissions matrix: keys grouped by area, each area folded by its header row.
const sections = [
  {
    key: "customers",
    title: "Customers",
    trailing: "2 keys",
    data: [
      { id: "c1", name: "customers.read" },
      { id: "c2", name: "customers.write" },
    ],
  },
  {
    key: "users",
    title: "Users",
    data: [{ id: "u1", name: "users.add" }],
  },
];

describe("DataGrid sections", () => {
  it("draws a header row per section, with its trailing, above its rows", async () => {
    await draw(<DataGrid sections={sections} columns={columns} />);
    expect(screen.getByText("Customers")).toBeTruthy();
    expect(screen.getByText("2 keys")).toBeTruthy();
    expect(screen.getByText("customers.write")).toBeTruthy();
    expect(screen.getByText("users.add")).toBeTruthy();
  });

  it("folds a section's rows when its header is pressed, and unfolds them again", async () => {
    await draw(<DataGrid sections={sections} columns={columns} />);
    const header = screen.getByRole("button", { name: /Customers/ });
    expect(header.props.accessibilityState).toMatchObject({ expanded: true });
    await fireEvent.press(header);
    expect(screen.queryByText("customers.read")).toBeNull();
    expect(screen.getByText("users.add")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Customers/ }).props
        .accessibilityState,
    ).toMatchObject({ expanded: false });
    await fireEvent.press(screen.getByRole("button", { name: /Customers/ }));
    expect(screen.getByText("customers.read")).toBeTruthy();
  });

  it("indexes a row by its place in every section's rows", async () => {
    const renderCell = jest.fn(
      (value: string, _row: unknown, index: number) => (
        <Text>{`${index}:${value}`}</Text>
      ),
    );
    await draw(
      <DataGrid
        sections={sections}
        columns={[{ id: "name", label: "Name", renderCell }]}
        selected={2}
      />,
    );
    expect(screen.getByText("2:users.add")).toBeTruthy();
  });
});

describe("DataGrid row actions", () => {
  it("draws each row's actions as labelled icon buttons that call them", async () => {
    const onEdit = jest.fn();
    const rows = [
      { id: 1, name: "Home" },
      { id: 2, name: "Reports" },
    ];
    await draw(
      <DataGrid
        data={rows}
        columns={columns}
        rowActions={(row) => [
          {
            icon: "pencil",
            label: `Edit ${row.name}`,
            onPress: () => onEdit(row),
          },
          {
            icon: "arrow-up",
            label: `Up ${row.name}`,
            onPress: () => {},
            disabled: row.id === 1,
          },
        ]}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Edit Reports"));
    expect(onEdit).toHaveBeenCalledWith(rows[1]);
    expect(
      screen.getByLabelText("Up Home").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("sizes the actions column for the row with the most, 40 px a button", async () => {
    const out = JSON.stringify(
      (
        await draw(
          <DataGrid
            data={[
              { id: 1, name: "a" },
              { id: 2, name: "b" },
            ]}
            columns={columns}
            rowActions={(row) =>
              Array.from({ length: row.id === 2 ? 3 : 1 }, (_, at) => ({
                icon: "pencil" as const,
                label: `a${row.id}-${at}`,
                onPress: () => {},
              }))
            }
          />,
        )
      ).toJSON(),
    );
    expect(out).toContain(`"width":136`);
  });
});

describe("DataGrid renderRow", () => {
  it("draws the node it returns instead of the row's cells, and the cells otherwise", async () => {
    await draw(
      <DataGrid
        data={[
          { id: 1, name: "Home" },
          { id: 2, name: "divider", note: "Archived" },
        ]}
        columns={columns}
        renderRow={(row) => (row.note ? <Text>{row.note}</Text> : null)}
      />,
    );
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Archived")).toBeTruthy();
    expect(screen.queryByText("divider")).toBeNull();
  });
});

describe("DataGrid widths", () => {
  it("draws a percentage width as a share of the row, and minWidth with flex", async () => {
    const out = JSON.stringify(
      (
        await draw(
          <DataGrid
            data={[{ id: 1, name: "a", role: "b" }]}
            columns={[
              { id: "name", label: "Name", width: "32%", minWidth: 200 },
              { id: "role", label: "Role", minWidth: 72 },
            ]}
          />,
        )
      ).toJSON(),
    );
    expect(out).toContain(`"width":"32%","minWidth":200`);
    expect(out).toContain(`"flex":1,"minWidth":72`);
  });

  // The rest has to fit in what the percentage columns leave.
  it("keeps the grid wide enough for the percentage columns and the others' minimums", () => {
    expect(
      gridMinWidth([
        { id: "a", label: "", width: "50%" },
        { id: "b", label: "", minWidth: 100 },
        { id: "c", label: "", width: 100 },
      ]),
    ).toBe(400);
    // Held at its minWidth, a percentage column counts as fixed.
    expect(
      gridMinWidth([
        { id: "a", label: "", width: "10%", minWidth: 300 },
        { id: "b", label: "", width: 100 },
      ]),
    ).toBe(400);
    expect(gridMinWidth([{ id: "a", label: "" }], 40)).toBe(190);
  });
});

describe("DataGrid in its box", () => {
  // A long header widened the rows past the box: once measured, the rows are as wide as the box.
  it("lays the rows out at the box's width once it is measured, never under the columns' minimum", async () => {
    const { toJSON } = await draw(
      <DataGrid
        data={[{ id: 1, name: "a" }]}
        columns={[{ id: "name", label: "A header far longer than its column" }]}
      />,
    );
    // Fired on the header, the layout reaches the grid's horizontal scroll above it.
    const header = () =>
      screen.getByText("A header far longer than its column");
    await fireEvent(header(), "layout", {
      nativeEvent: { layout: { width: 420, height: 300 } },
    });
    expect(JSON.stringify(toJSON())).toContain(`"width":420`);
    await fireEvent(header(), "layout", {
      nativeEvent: { layout: { width: 100, height: 300 } },
    });
    expect(JSON.stringify(toJSON())).toContain(`"width":150`);
  });
});

describe("DataGrid headers", () => {
  // A long header wrapped out of its 48 px row; a node label nested in the header's Text lost its own numberOfLines.
  it("draws a text header on one line, and a node header as it is", async () => {
    await draw(
      <DataGrid
        data={[]}
        columns={[
          { id: "a", label: "Limited operator" },
          { id: "b", label: <Text numberOfLines={1}>Node</Text> },
        ]}
      />,
    );
    expect(screen.getByText("Limited operator").props.numberOfLines).toBe(1);
    expect(screen.getByText("Node").parent?.type).not.toBe("Text");
  });
});
