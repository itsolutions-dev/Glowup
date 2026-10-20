/**
 * A statically exported web page prerenders in Node, where the window is 0
 * wide. Grid picks each item's size from the window width's breakpoint (and
 * from its own measured width, which a server never has), so the prerender and
 * the hydrating client must both start from that same width, or the items
 * differ and React throws the page away (#418).
 */
import { act, render, screen } from "@testing-library/react-native";
import { renderToString } from "react-dom/server";
import { Dimensions, StyleSheet, Text } from "react-native";

import { Grid, ThemeProvider } from "..";

// Prerendered, react-dom does not serialise a style array: hand the host View
// a flat style, as react-native-web does, so the html shows the widths.
jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native");
  const React = jest.requireActual("react");
  const FlatView = (props: { style?: unknown }) =>
    React.createElement(actual.View, {
      ...props,
      style: actual.StyleSheet.flatten(props.style),
    });
  return new Proxy(actual, {
    get: (target, key) => (key === "View" ? FlatView : target[key as string]),
  });
});

const cells = ["A", "B", "C", "D"].map((label) => (
  <Grid key={label} testID={label} size={{ xs: 12, md: 6 }}>
    <Text>{label}</Text>
  </Grid>
));

const widthOf = (label: string) =>
  StyleSheet.flatten(screen.getByTestId(label).props.style).width;

it("prerenders the smallest breakpoint, whatever the window", () => {
  const get = jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ width: 1000, height: 800, scale: 1, fontScale: 1 });
  // react-dom does not know the host names of react-native: it warns about them.
  const warn = jest.spyOn(console, "error").mockImplementation(() => {});
  const html = renderToString(
    <ThemeProvider>
      <Grid container>{cells}</Grid>
    </ThemeProvider>,
  );
  warn.mockRestore();
  get.mockRestore();
  // A 0-wide window is `xs`: every item spans the 12 columns, in percent and
  // without a column gap because a server cannot measure the container.
  expect(html.match(/>[ABCD]</g)).toEqual([">A<", ">B<", ">C<", ">D<"]);
  expect((html.match(/width:100%/g) ?? []).length).toBe(4);
  expect(html).not.toContain("width:50%");
  expect(html).toContain("column-gap:0");
});

it("uses the window width before its first layout pass on the client", async () => {
  const get = jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ width: 1000, height: 800, scale: 1, fontScale: 1 });
  await render(
    <ThemeProvider>
      <Grid container spacing={0}>
        {cells}
      </Grid>
    </ThemeProvider>,
  );
  // 1000 px is `md`: two items per row, half the columns each.
  expect(widthOf("A")).toBe("50%");
  expect(widthOf("D")).toBe("50%");
  get.mockRestore();
  await act(async () => {});
});
