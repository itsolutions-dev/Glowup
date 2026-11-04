import React from "react";
import { StyleSheet } from "react-native";
import { render } from "@testing-library/react-native";
import { Skeleton, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("Skeleton preset list", () => {
  it("draws count rows of itemHeight, rounded from the theme", async () => {
    const view = await draw(
      <Skeleton preset="list" count={4} itemHeight={72} testID="sk" />,
    );
    // Hidden from screen readers on purpose: the list says "Loading" once.
    const rows = view.getAllByTestId("sk-row", { includeHiddenElements: true });
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      const style = StyleSheet.flatten(row.props.style);
      expect(style.height).toBe(72);
      // theme.shape.large
      expect(style.borderRadius).toBe(16);
    }
  });

  it("announces loading once", async () => {
    const view = await draw(<Skeleton preset="list" count={3} />);
    expect(view.getAllByLabelText("Loading")).toHaveLength(1);
  });

  it("leaves a plain Skeleton unchanged", async () => {
    const view = await draw(<Skeleton />);
    const one = view.getAllByLabelText("Loading");
    expect(one).toHaveLength(1);
    const style = StyleSheet.flatten(one[0].props.style);
    expect(style.height).toBe(48);
    expect(style.borderRadius).toBe(8);
  });
});
