/**
 * A statically exported web page prerenders in Node, where the window is 0
 * wide. Grid's column count falls back to the window width until its first
 * layout pass, so the prerender and the hydrating client must both start from
 * that same width, or the rows differ and React throws the page away (#418).
 */
import { act, render, screen } from "@testing-library/react-native";
import { renderToString } from "react-dom/server";
import { Dimensions, Text } from "react-native";

import { Grid, ThemeProvider } from "..";

const cells = ["A", "B", "C", "D"].map((label) => (
  <Text key={label}>{label}</Text>
));

it("prerenders one column, whatever the window", () => {
  const html = renderToString(
    <ThemeProvider>
      <Grid minChildWidth={100}>{cells}</Grid>
    </ThemeProvider>,
  );
  // Four rows of one cell each: the column count of a 0-wide window.
  expect(html.match(/A|B|C|D/g)).toEqual(["A", "B", "C", "D"]);
  expect((html.match(/flex-direction:row/g) ?? []).length).toBe(4);
});

it("uses the window width before its first layout pass on the client", async () => {
  const get = jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ width: 1000, height: 800, scale: 1, fontScale: 1 });
  await render(
    <ThemeProvider>
      <Grid minChildWidth={100} spacing={0}>
        {cells}
      </Grid>
    </ThemeProvider>,
  );
  // 1000 px of 100 px columns: one row holds all four cells.
  expect(screen.getByText("A").parent?.parent?.parent).toBe(
    screen.getByText("D").parent?.parent?.parent,
  );
  get.mockRestore();
  await act(async () => {});
});
