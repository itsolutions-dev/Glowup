import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { PivotEngine } from "../index";
import PivotGrid from "../PivotGrid";

describe("PivotGrid (native)", () => {
  test("a short message instead of the grid", async () => {
    await render(
      <ThemeProvider>
        <PivotGrid engine={new PivotEngine()} />
      </ThemeProvider>,
    );
    expect(screen.getByText(/not available/)).toBeTruthy();
  });
});
