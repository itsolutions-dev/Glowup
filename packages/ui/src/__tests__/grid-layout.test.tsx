import React from "react";
import { StyleSheet, Text } from "react-native";
import { render } from "@testing-library/react-native";
import { GridLayout, ThemeProvider, ViewportProvider } from "..";

const LAYOUT = [
  { id: "b", x: 6, y: 0, w: 6, h: 4 },
  { id: "a", x: 0, y: 0, w: 6, h: 2 },
  { id: "c", x: 0, y: 2, w: 3, h: 1 },
  { id: "y", x: 3, y: 2, w: 3, h: 1 }, // no child
];

const draw = (width: number) =>
  render(
    <ThemeProvider>
      <ViewportProvider width={width}>
        <GridLayout testID="grid" layout={LAYOUT}>
          <Text key="a">A</Text>
          <Text key="b">B</Text>
          <Text key="c">C</Text>
          <Text key="z">Z</Text>
        </GridLayout>
      </ViewportProvider>
    </ThemeProvider>,
  );

const flat = (node: any) => StyleSheet.flatten(node.props.style);

describe("GridLayout", () => {
  it("places each child at its cells", async () => {
    const view = await draw(1280);
    expect(flat(view.getByTestId("grid"))).toMatchObject({ height: 240 }); // 4 rows
    expect(flat(view.getByTestId("grid-a"))).toMatchObject({
      position: "absolute",
      left: "0%",
      marginLeft: 0,
      right: "50%",
      marginRight: 8,
      top: 0,
      height: 112,
    });
    expect(flat(view.getByTestId("grid-c"))).toMatchObject({
      top: 128,
      height: 48,
    });
  });

  it("lets a page scroll and a tap land through an item's own scroll view", async () => {
    const view = await draw(1280);
    // The view that scrolls an item's overflow: no bounce (iOS would take
    // every vertical pan for it), and a tap reaches a control with the
    // keyboard up instead of only closing the keyboard.
    // Only the two props: printing the whole props (children included) on a
    // failure exhausts jest's memory.
    const { bounces, keyboardShouldPersistTaps } = (
      view.getByTestId("grid-a").children[0] as any
    ).props;
    expect({ bounces, keyboardShouldPersistTaps }).toEqual({
      bounces: false,
      keyboardShouldPersistTaps: "handled",
    });
  });

  it("leaves out a child with no place, and a place with no child", async () => {
    const view = await draw(1280);
    expect(view.queryByText("Z")).toBeNull();
    expect(view.queryByTestId("grid-y")).toBeNull();
  });

  it("prerenders at width 0, stacked in reading order", async () => {
    // A static export renders with a 0-wide window: no width to measure,
    // and the same stacked tree the browser hydrates before it knows its size.
    const view = await draw(0);
    expect(
      view.getAllByText(/^[ABC]$/).map((node) => node.props.children),
    ).toEqual(["A", "B", "C"]);
  });

  it("stacks in reading order on a phone", async () => {
    const view = await draw(360);
    expect(
      view.getAllByText(/^[ABC]$/).map((node) => node.props.children),
    ).toEqual(["A", "B", "C"]);
    expect(flat(view.getByTestId("grid-a"))?.position).toBeUndefined();
  });

  it("nests", async () => {
    const view = await render(
      <ThemeProvider>
        <ViewportProvider width={1280}>
          <GridLayout layout={[{ id: "outer", x: 0, y: 0, w: 6, h: 3 }]}>
            <GridLayout
              key="outer"
              testID="inner"
              columns={6}
              layout={[{ id: "n", x: 0, y: 1, w: 6, h: 1 }]}
            >
              <Text key="n">N</Text>
            </GridLayout>
          </GridLayout>
        </ViewportProvider>
      </ThemeProvider>,
    );
    expect(view.getByText("N")).toBeTruthy();
    expect(flat(view.getByTestId("inner-n"))).toMatchObject({
      top: 64,
      left: "0%",
      right: "0%",
    });
  });
});
