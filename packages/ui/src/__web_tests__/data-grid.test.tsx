import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { DataGrid, ThemeProvider } from "..";

// In the browser a section header says whether it is open, and actions that
// show on hover show while the pointer is on the row or a button has focus.
const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const columns = [{ id: "name", label: "Name" }];

describe("DataGrid on the web", () => {
  it("marks a section header expanded, then collapsed once pressed", () => {
    draw(
      <DataGrid
        columns={columns}
        sections={[{ key: "a", title: "Area", data: [{ id: 1, name: "x" }] }]}
      />,
    );
    const header = screen.getByRole("button", { name: /Area/ });
    expect(header.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(header);
    expect(
      screen
        .getByRole("button", { name: /Area/ })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    expect(screen.queryByText("x")).toBeNull();
  });

  it("shows hover actions only on hover or focus", () => {
    draw(
      <DataGrid
        columns={columns}
        data={[{ id: 1, name: "Home" }]}
        revealRowActions="hover"
        rowActions={() => [
          { icon: "pencil", label: "Edit", onPress: () => {} },
        ]}
      />,
    );
    const button = screen.getByRole("button", { name: "Edit" });
    // The row of buttons: the nearest box drawn at an opacity.
    let box = button.parentElement as HTMLElement;
    while (!getComputedStyle(box).opacity)
      box = box.parentElement as HTMLElement;
    expect(getComputedStyle(box).opacity).toBe("0");
    act(() => button.focus());
    expect(getComputedStyle(box).opacity).toBe("1");
    act(() => button.blur());
    expect(getComputedStyle(box).opacity).toBe("0");
  });
});
