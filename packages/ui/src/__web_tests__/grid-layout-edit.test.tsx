import React from "react";
import { render, screen } from "@testing-library/react";
import { GridLayout, ThemeProvider, ViewportProvider } from "..";

// What only the browser shows of an editable grid: the cursors that say an
// item can be grabbed and which way each handle pulls.
describe("GridLayout editable on the web", () => {
  it("offers a grab cursor on the items and a resize cursor on the selected one's handles", () => {
    render(
      <ThemeProvider>
        <ViewportProvider width={1280}>
          <GridLayout
            editable
            selected="a"
            testID="grid"
            layout={[{ id: "a", x: 0, y: 0, w: 4, h: 2 }]}
          >
            <span key="a">A</span>
          </GridLayout>
        </ViewportProvider>
      </ThemeProvider>,
    );
    expect(getComputedStyle(screen.getByTestId("grid-a")).cursor).toBe("grab");
    expect(getComputedStyle(screen.getByLabelText("Resize e")).cursor).toBe(
      "ew-resize",
    );
    expect(getComputedStyle(screen.getByLabelText("Resize se")).cursor).toBe(
      "nwse-resize",
    );
  });
});
