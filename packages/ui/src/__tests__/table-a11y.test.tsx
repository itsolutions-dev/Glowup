import React from "react";
import { Platform } from "react-native";
import { render } from "@testing-library/react-native";
import { Button, TableHeaderCell, TableRow, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("TableHeaderCell", () => {
  it.each([
    ["asc", "ascending"],
    ["desc", "descending"],
    [null, "none"],
  ] as const)("a column sorted %s is aria-sort=%s", async (dir, aria) => {
    const view = await draw(
      <TableHeaderCell sortable sortDirection={dir} onClick={() => {}}>
        Name
      </TableHeaderCell>,
    );
    const header = view.container.queryAll(
      (n: { props: Record<string, unknown> }) =>
        n.props.role === "columnheader",
    )[0];
    expect(header.props["aria-sort"]).toBe(aria);
  });

  it("a column that cannot sort has no aria-sort", async () => {
    const view = await draw(<TableHeaderCell>Name</TableHeaderCell>);
    const header = view.container.queryAll(
      (n: { props: Record<string, unknown> }) =>
        n.props.role === "columnheader",
    )[0];
    expect(header.props["aria-sort"]).toBeUndefined();
  });

  it("the sort and reorder controls are named buttons", async () => {
    const view = await draw(
      <TableHeaderCell
        sortable
        sortDirection="asc"
        onClick={() => {}}
        onMoveLeft={() => {}}
        onMoveRight={() => {}}
      >
        Name
      </TableHeaderCell>,
    );
    expect(view.getByRole("button", { name: "Sort by Name" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Move Name left" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Move Name right" })).toBeTruthy();
  });
});

describe("TableRow with onClick on the web", () => {
  it("stays a row, so buttons in its cells are not nested in a button", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const view = await draw(
      <TableRow onClick={() => {}} testID="row">
        <Button onClick={() => {}}>Call</Button>
      </TableRow>,
    );
    expect(view.getByTestId("row").props.role).toBe("row");
  });
});
