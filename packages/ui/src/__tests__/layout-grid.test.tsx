import React from "react";
import { StyleSheet, Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Grid, ThemeProvider, ViewportProvider } from "..";
import type { GridProps } from "..";

const style = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

/** A grid at a window `width` wide, as a `ViewportProvider` sets it. */
const draw = (ui: React.ReactElement, width = 1000) =>
  render(
    <ThemeProvider>
      <ViewportProvider width={width}>{ui}</ViewportProvider>
    </ThemeProvider>,
  );

/** What the host reports once the container at `testID` has been laid out. */
const layout = (element: Parameters<typeof fireEvent>[0], width: number) =>
  fireEvent(element, "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width, height: 100 } },
  });

const item = (id: string, size: GridProps["size"]) => (
  <Grid key={id} testID={id} size={size}>
    <Text>{id}</Text>
  </Grid>
);

describe("Grid", () => {
  it("is a plain View outside a container", async () => {
    const { getByTestId } = await draw(
      <Grid testID="grid" size={6} style={{ padding: 3 }}>
        <Text>A</Text>
      </Grid>,
    );
    expect(style(getByTestId("grid"))).toEqual({ padding: 3 });
  });

  describe("container", () => {
    it("lays its items out in a wrapping row", async () => {
      const { getByTestId } = await draw(
        <Grid container testID="grid" spacing={0}>
          {item("A", 6)}
        </Grid>,
      );
      expect(style(getByTestId("grid"))).toMatchObject({
        flexDirection: "row",
        flexWrap: "wrap",
      });
    });

    it("does not wrap with wrap={false}, and squeezes its items instead", async () => {
      const { getByTestId } = await draw(
        <Grid container wrap={false} testID="grid" spacing={0}>
          {item("A", 6)}
        </Grid>,
      );
      expect(style(getByTestId("grid")).flexWrap).toBe("nowrap");
      expect(style(getByTestId("A"))).toMatchObject({
        flexShrink: 1,
        minWidth: 0,
      });
    });

    it("keeps the style it is given last", async () => {
      const { getByTestId } = await draw(
        <Grid container testID="grid" style={{ flexDirection: "column" }}>
          {item("A", 6)}
        </Grid>,
      );
      expect(style(getByTestId("grid")).flexDirection).toBe("column");
    });
  });

  describe("sizes", () => {
    it("is a share of the columns, as a percentage before it is measured", async () => {
      const { getByTestId } = await draw(
        <Grid container>
          {item("A", 12)}
          {item("B", 6)}
          {item("C", 4)}
          {item("D", 1)}
        </Grid>,
      );
      expect(style(getByTestId("A")).width).toBe("100%");
      expect(style(getByTestId("B")).width).toBe("50%");
      expect(style(getByTestId("C")).width).toBe(`${(4 / 12) * 100}%`);
      expect(style(getByTestId("D")).width).toBe(`${(1 / 12) * 100}%`);
    });

    it("counts in the container's own columns", async () => {
      const { getByTestId } = await draw(
        <Grid container columns={4}>
          {item("A", 1)}
          {item("B", 3)}
        </Grid>,
      );
      expect(style(getByTestId("A")).width).toBe("25%");
      expect(style(getByTestId("B")).width).toBe("75%");
    });

    it("stays within 1 and the columns", async () => {
      const { getByTestId } = await draw(
        <Grid container>
          {item("A", 20)}
          {item("B", 0)}
        </Grid>,
      );
      expect(style(getByTestId("A")).width).toBe("100%");
      expect(style(getByTestId("B")).width).toBe(`${(1 / 12) * 100}%`);
    });

    it("is whole pixels of the measured container, gaps left out", async () => {
      const { getByTestId } = await draw(
        <Grid container testID="grid" spacing={16}>
          {item("A", 6)}
          {item("B", 6)}
          {item("C", 4)}
          {item("D", 12)}
        </Grid>,
      );
      await layout(getByTestId("grid"), 600);
      // (600 - 11 * 16) / 12 = 35.33 a column, plus the gaps inside the span.
      expect(style(getByTestId("A")).width).toBe(292);
      expect(style(getByTestId("B")).width).toBe(292);
      expect(style(getByTestId("C")).width).toBe(189);
      expect(style(getByTestId("D")).width).toBe(600);
      // Two spans of 6 and their gap make exactly the row.
      expect(292 + 16 + 292).toBe(600);
    });

    it("leaves the container's padding and border out of the row", async () => {
      const { getByTestId } = await draw(
        <Grid
          container
          testID="grid"
          spacing={16}
          style={{ paddingHorizontal: 20, borderWidth: 2 }}
        >
          {item("A", 6)}
          {item("B", 6)}
          {item("D", 12)}
        </Grid>,
      );
      // The layout width includes 2 * 20 of padding and 2 * 2 of border.
      await layout(getByTestId("grid"), 644);
      expect(style(getByTestId("A")).width).toBe(292);
      expect(style(getByTestId("D")).width).toBe(600);
    });

    it("never lets a measured row exceed its container", async () => {
      const { getByTestId } = await draw(
        <Grid container testID="grid" spacing={8}>
          {item("A", 4)}
          {item("B", 4)}
          {item("C", 4)}
        </Grid>,
      );
      await layout(getByTestId("grid"), 1000);
      const widths = ["A", "B", "C"].map(
        (id) => style(getByTestId(id)).width as number,
      );
      expect(widths[0] + widths[1] + widths[2] + 2 * 8).toBeLessThanOrEqual(
        1000,
      );
      expect(widths[0]).toBe(Math.floor((1000 - 8 * 11) * (4 / 12) + 8 * 3));
    });

    it("grows to share the rest of the row", async () => {
      const { getByTestId } = await draw(
        <Grid container>
          {item("A", "grow")}
          {item("B", "grow")}
        </Grid>,
      );
      for (const id of ["A", "B"]) {
        expect(style(getByTestId(id))).toEqual({
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          minWidth: 0,
        });
      }
    });

    it("sizes to the content with auto, and without a size", async () => {
      const { getByTestId } = await draw(
        <Grid container>
          {item("A", "auto")}
          {item("B", undefined)}
        </Grid>,
      );
      expect(style(getByTestId("A"))).toEqual({ flexGrow: 0, flexShrink: 0 });
      expect(style(getByTestId("B"))).toEqual({ flexGrow: 0, flexShrink: 0 });
    });
  });

  describe("breakpoints", () => {
    const size = { xs: 12, md: 6, xl: 3 };
    const widths: [number, string][] = [
      [0, "100%"],
      [360, "100%"],
      [599, "100%"],
      // `sm` sets nothing: the next smaller one, `xs`, applies.
      [600, "100%"],
      [840, "50%"],
      // `lg` sets nothing: `md` applies.
      [1200, "50%"],
      [1600, "25%"],
    ];
    it.each(widths)("at %i dp an item is %s wide", async (window, expected) => {
      const { getByTestId } = await draw(
        <Grid container>{item("A", size)}</Grid>,
        window,
      );
      expect(style(getByTestId("A")).width).toBe(expected);
    });

    it("is auto below the smallest breakpoint it sets", async () => {
      const mdOnly = { md: 6 };
      const small = await draw(<Grid container>{item("A", mdOnly)}</Grid>, 360);
      expect(style(small.getByTestId("A"))).toEqual({
        flexGrow: 0,
        flexShrink: 0,
      });
      const large = await draw(<Grid container>{item("B", mdOnly)}</Grid>, 900);
      expect(style(large.getByTestId("B")).width).toBe("50%");
    });

    it("takes grow and auto per breakpoint too", async () => {
      const mixed = { xs: 12, md: "grow", xl: "auto" } as const;
      const md = await draw(<Grid container>{item("A", mixed)}</Grid>, 900);
      const xl = await draw(<Grid container>{item("B", mixed)}</Grid>, 1700);
      expect(style(md.getByTestId("A")).flexGrow).toBe(1);
      expect(style(xl.getByTestId("B")).flexGrow).toBe(0);
    });
  });

  describe("spacing", () => {
    it("is a number of px, a token, or a numeric string", async () => {
      const { getByTestId } = await draw(
        <>
          <Grid container testID="n" spacing={12}>
            {item("A", 6)}
          </Grid>
          <Grid container testID="t" spacing="l">
            {item("B", 6)}
          </Grid>
          <Grid container testID="s" spacing="10">
            {item("C", 6)}
          </Grid>
        </>,
      );
      expect(style(getByTestId("n")).rowGap).toBe(12);
      expect(style(getByTestId("t")).rowGap).toBe(24);
      expect(style(getByTestId("s")).rowGap).toBe(10);
    });

    it("draws the column gap once the container is measured", async () => {
      const { getByTestId } = await draw(
        <Grid container testID="grid" spacing={{ row: 4, column: 20 }}>
          {item("A", 6)}
        </Grid>,
      );
      // Percent widths ignore the gap, so none is drawn before the layout.
      expect(style(getByTestId("grid"))).toMatchObject({
        rowGap: 4,
        columnGap: 0,
      });
      await layout(getByTestId("grid"), 500);
      expect(style(getByTestId("grid"))).toMatchObject({
        rowGap: 4,
        columnGap: 20,
      });
    });

    it("takes tokens for each axis, and a missing axis is 0", async () => {
      const { getByTestId } = await draw(
        <Grid container testID="grid" spacing={{ row: "m" }}>
          {item("A", 6)}
        </Grid>,
      );
      await layout(getByTestId("grid"), 500);
      expect(style(getByTestId("grid"))).toMatchObject({
        rowGap: 16,
        columnGap: 0,
      });
    });

    it("defaults to the small spacing", async () => {
      const { getByTestId } = await draw(
        <Grid container testID="grid">
          {item("A", 6)}
        </Grid>,
      );
      expect(style(getByTestId("grid")).rowGap).toBe(8);
    });

    it("measures a gap into the widths of the columns it covers", async () => {
      const { getByTestId } = await draw(
        <Grid container testID="grid" spacing={{ row: 0, column: 10 }}>
          {item("A", 1)}
        </Grid>,
      );
      await layout(getByTestId("grid"), 230);
      // (230 - 11 * 10) / 12 = 10 px a column.
      expect(style(getByTestId("A")).width).toBe(10);
    });
  });

  describe("autoSize", () => {
    const cards = ["A", "B", "C"].map((id) => <Text key={id}>{id}</Text>);

    it("sizes nothing by default", async () => {
      const { getByText } = await draw(<Grid container>{cards}</Grid>);
      expect(style(getByText("A").parent!).width).toBeUndefined();
    });

    it("uses a card per row, two from sm and three from md with true", async () => {
      const at = async (window: number) => {
        const { getByTestId } = await draw(
          <Grid container autoSize>
            {["A", "B"].map((id) => (
              <Grid key={id} testID={id}>
                <Text>{id}</Text>
              </Grid>
            ))}
          </Grid>,
          window,
        );
        return style(getByTestId("A")).width;
      };
      expect(await at(360)).toBe("100%");
      expect(await at(700)).toBe("50%");
      expect(await at(900)).toBe(`${(4 / 12) * 100}%`);
      expect(await at(1700)).toBe(`${(4 / 12) * 100}%`);
    });

    it("leaves an item that chose its own size alone", async () => {
      const { getByTestId } = await draw(
        <Grid container autoSize>
          <Grid testID="own" size={3}>
            <Text>A</Text>
          </Grid>
          <Grid testID="auto">
            <Text>B</Text>
          </Grid>
        </Grid>,
        360,
      );
      expect(style(getByTestId("own")).width).toBe("25%");
      expect(style(getByTestId("auto")).width).toBe("100%");
    });

    it("puts a child that is not a Grid in an item of its size", async () => {
      const { getByText } = await draw(
        <Grid container autoSize>
          {cards}
        </Grid>,
        700,
      );
      // The Text's parent is the item `autoSize` made for it.
      expect(style(getByText("A").parent!).width).toBe("50%");
      expect(style(getByText("C").parent!).width).toBe("50%");
    });

    it("takes a size for every child", async () => {
      const { getByText } = await draw(
        <Grid container autoSize={4}>
          {cards}
        </Grid>,
      );
      expect(style(getByText("B").parent!).width).toBe(`${(4 / 12) * 100}%`);
    });

    it("takes a size per breakpoint, or grow", async () => {
      const { getByText } = await draw(
        <>
          <Grid container autoSize={{ xs: 6, lg: 3 }}>
            {[<Text key="a">A</Text>]}
          </Grid>
          <Grid container autoSize="grow">
            {[<Text key="b">B</Text>]}
          </Grid>
        </>,
        1300,
      );
      expect(style(getByText("A").parent!).width).toBe("25%");
      expect(style(getByText("B").parent!).flexGrow).toBe(1);
    });

    it("asks a function for each child, with its index and key", async () => {
      // The `getGridSizing` of the spec: the key picks the size.
      const calls: [number, string | null][] = [];
      const getGridSizing = (index: number, child: React.ReactElement) => {
        calls.push([index, child.key]);
        if (child.key === "notes") return { xs: 12, md: 12 };
        if (child.key === "componentDescription") return { xs: 12, md: 6 };
        return { xs: 12, sm: 6, md: 4 };
      };
      const { getByTestId } = await draw(
        <Grid container autoSize={getGridSizing}>
          <Grid key="notes" testID="notes" />
          {false}
          <Grid key="componentDescription" testID="description" />
          <Grid key="other" testID="other" />
        </Grid>,
        900,
      );
      expect(calls).toEqual([
        [0, "notes"],
        [1, "componentDescription"],
        [2, "other"],
      ]);
      expect(style(getByTestId("notes")).width).toBe("100%");
      expect(style(getByTestId("description")).width).toBe("50%");
      expect(style(getByTestId("other")).width).toBe(`${(4 / 12) * 100}%`);
    });

    it("keeps the keys of mapped children", async () => {
      const { getByTestId } = await draw(
        <Grid container autoSize={(_i, child) => (child.key === "b" ? 12 : 6)}>
          {["a", "b"].map((id) => (
            <Grid key={id} testID={id} />
          ))}
        </Grid>,
      );
      expect(style(getByTestId("a")).width).toBe("50%");
      expect(style(getByTestId("b")).width).toBe("100%");
    });

    it("sizes nothing with false", async () => {
      const { getByTestId } = await draw(
        <Grid container autoSize={false}>
          <Grid testID="A" />
        </Grid>,
      );
      expect(style(getByTestId("A"))).toEqual({ flexGrow: 0, flexShrink: 0 });
    });
  });

  describe("nesting", () => {
    it("makes a container inside a container an item of it, with its own columns", async () => {
      const { getByTestId } = await draw(
        <Grid container testID="outer" spacing={0}>
          <Grid container testID="inner" size={6} columns={4} spacing={0}>
            {item("A", 1)}
            {item("B", 3)}
          </Grid>
        </Grid>,
      );
      expect(style(getByTestId("inner"))).toMatchObject({
        width: "50%",
        flexDirection: "row",
        flexWrap: "wrap",
      });
      expect(style(getByTestId("A")).width).toBe("25%");
      expect(style(getByTestId("B")).width).toBe("75%");

      await layout(getByTestId("outer"), 800);
      expect(style(getByTestId("inner")).width).toBe(400);
      // The inner container is measured on its own.
      await layout(getByTestId("inner"), 400);
      expect(style(getByTestId("A")).width).toBe(100);
      expect(style(getByTestId("B")).width).toBe(300);
    });

    it("does not size a plain Grid inside an item", async () => {
      const { getByTestId } = await draw(
        <Grid container>
          <Grid testID="cell" size={6}>
            <Grid testID="inside" size={3} />
          </Grid>
        </Grid>,
      );
      expect(style(getByTestId("cell")).width).toBe("50%");
      expect(style(getByTestId("inside"))).toBeUndefined();
    });
  });

  it("forwards View props to the container and the items", async () => {
    const { getByLabelText } = await draw(
      <Grid container accessibilityLabel="list">
        <Grid accessibilityLabel="entry" size={6} />
      </Grid>,
    );
    expect(getByLabelText("list")).toBeTruthy();
    expect(getByLabelText("entry")).toBeTruthy();
  });

  it("calls the onLayout it was given", async () => {
    const onLayout = jest.fn();
    const { getByTestId } = await draw(
      <Grid container testID="grid" onLayout={onLayout}>
        {item("A", 6)}
      </Grid>,
    );
    await layout(getByTestId("grid"), 300);
    expect(onLayout).toHaveBeenCalledTimes(1);
  });
});
