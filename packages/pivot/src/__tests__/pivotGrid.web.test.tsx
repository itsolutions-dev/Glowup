import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { PivotEngine } from "../index";
import { CHEVRON_WIDTH } from "../grid/layout";
import PivotGrid from "../PivotGrid.web";

const META = {
  site: { type: "string", caption: "Site" },
  cat: { type: "string", caption: "Category" },
  flag: { type: "string", caption: "Flag" },
  n: { type: "number", caption: "Count" },
};
const ROWS = [
  { site: "A", cat: "x", flag: "t", n: 5 },
  { site: "A", cat: "y", flag: "f", n: 7 },
  { site: "B", cat: "x", flag: "t", n: 11 },
];

const engineFor = (
  rows: object[],
  slice: object = {},
  data: object[] = ROWS,
) => {
  const engine = new PivotEngine();
  engine.setLocale("en-US");
  engine.setData([META, ...data]);
  engine.setSlice({
    rows: [{ uniqueName: "site" }, { uniqueName: "cat" }],
    columns: [{ uniqueName: "flag" }],
    measures: [{ uniqueName: "n", aggregation: "sum" }],
    filters: [],
    expands: { expandAll: true },
    ...slice,
  } as never);
  return engine;
};

const show = (engine: PivotEngine, height?: number) =>
  render(
    <ThemeProvider>
      <PivotGrid engine={engine} height={height} />
    </ThemeProvider>,
  );

type Json = {
  type: string;
  props: Record<string, any>;
  children?: Json[] | null;
};
/** The first host element of a type in the rendered tree (the scrolling container is a DOM div). */
const findHost = (node: Json | Json[] | null, type: string): Json | null => {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findHost(child, type);
      if (hit) return hit;
    }
    return null;
  }
  if (node.type === type) return node;
  return findHost(node.children ?? null, type);
};
const container = () => findHost(screen.toJSON() as Json, "div")!;

const style = (id: string) =>
  StyleSheet.flatten(screen.getByTestId(id).props.style) as Record<
    string,
    unknown
  >;

describe("PivotGrid (web)", () => {
  test("shows the header and the rows", async () => {
    await show(engineFor(ROWS));
    expect(await screen.findByText("Total")).toBeTruthy();
    expect(screen.getByText("Sum Total of Count")).toBeTruthy();
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getAllByText("x")).toHaveLength(2);
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("23")).toBeTruthy();
  });

  test("opens and closes a row with its arrow", async () => {
    await show(engineFor(ROWS));
    await screen.findByText("y");
    await fireEvent.press(screen.getAllByLabelText("Collapse")[0]);
    expect(screen.queryByText("y")).toBeNull();
    await fireEvent.press(screen.getAllByLabelText("Expand")[0]);
    expect(await screen.findByText("y")).toBeTruthy();
  });

  test("opens and closes a column group", async () => {
    const engine = engineFor(ROWS, {
      rows: [{ uniqueName: "site" }],
      columns: [{ uniqueName: "flag" }, { uniqueName: "cat" }],
      expands: {
        expandAll: false,
        expandedMembers: ["__root__", "__root__|flag:t"],
      },
    });
    await show(engine);
    await screen.findByText("Total");
    expect(screen.queryByText("y")).toBeNull();
    await fireEvent.press(screen.getAllByLabelText("Expand")[0]);
    expect(await screen.findByText("y")).toBeTruthy();
  });

  test("sticky: the container scrolls on both axes and the first two columns stick", async () => {
    await show(engineFor(ROWS), 320);
    await screen.findByText("Total");
    expect(container().props.style).toMatchObject({
      overflow: "auto",
      height: 320,
    });
    expect(style("pivot-header")).toMatchObject({ position: "sticky", top: 0 });
    const key = "__root__|site:A";
    expect(style(`pivot-label-${key}`)).toMatchObject({
      position: "sticky",
      left: CHEVRON_WIDTH,
    });
    expect(style(`pivot-chevron-${key}`)).toMatchObject({
      position: "sticky",
      left: 0,
    });
  });

  test("mounts only the rows of the window", async () => {
    const many = Array.from({ length: 10000 }, (_, i) => ({
      site: `S${String(i).padStart(5, "0")}`,
      cat: "x",
      flag: "t",
      n: 1,
    }));
    await show(engineFor(many, { rows: [{ uniqueName: "site" }] }, many), 320);
    await screen.findByText("S00000");
    expect(screen.queryAllByTestId(/^pivot-row-/).length).toBeLessThan(60);
    await act(async () => {
      container().props.onScroll({ currentTarget: { scrollTop: 100000 } });
    });
    expect(await screen.findByText("S03124")).toBeTruthy();
    expect(screen.queryByText("S00000")).toBeNull();
  }, 90_000); // 10,000 rows take about 3 s alone, far more on a loaded machine

  test("a cell with a formula error is announced, not counted", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const modelModule = require("../grid/model") as {
      buildGridModel: (input: never) => {
        rows: { cells: Record<string, unknown>[] }[];
      };
    };
    const real = modelModule.buildGridModel;
    const spy = jest
      .spyOn(modelModule, "buildGridModel")
      .mockImplementation((input: never) => {
        const built = real(input);
        built.rows[1].cells[2] = {
          ...built.rows[1].cells[2],
          text: "",
          value: null,
          error: "boom",
        };
        return built;
      });
    try {
      await show(engineFor(ROWS));
      expect(await screen.findByLabelText(/boom/)).toBeTruthy();
    } finally {
      spy.mockRestore();
    }
  });

  test("no data shows the empty message", async () => {
    await show(engineFor([], {}, []));
    expect(await screen.findByText("No data to display")).toBeTruthy();
  });

  test("the table fills the width it is given instead of stopping at its columns", async () => {
    await show(engineFor(ROWS));
    await screen.findByText("Total");
    // 32 + 240 + three columns of 120: a minimum, not a width, so a wider container stretches it.
    const content = style("pivot-content");
    expect(content.minWidth).toBe(632);
    expect(content.width).toBeUndefined();
    expect(style("pivot-cell-__root__|site:A-0").flexGrow).toBe(1);
  });

  test("on a narrow container the fixed columns shrink to leave room for the numbers", async () => {
    await show(engineFor(ROWS));
    await screen.findByText("Total");
    await act(async () => {
      screen.getByTestId("pivot-grid").props.onLayout({
        nativeEvent: { layout: { width: 310, height: 480 } },
      });
    });
    const key = "__root__|site:A";
    expect(style(`pivot-chevron-${key}`).width).toBe(28);
    expect(style(`pivot-label-${key}`)).toMatchObject({ width: 124, left: 28 });
    expect(style("pivot-corner").width).toBe(152);
    expect(style("pivot-content").minWidth).toBe(28 + 124 + 3 * 84);
  });

  test("the cells fill the row without hiding its bottom border", async () => {
    await show(engineFor(ROWS));
    await screen.findByText("Total");
    const key = "__root__|site:A";
    // A fixed height as tall as the row would cover the 1 px border under the sticky cells.
    for (const id of [
      `pivot-chevron-${key}`,
      `pivot-label-${key}`,
      `pivot-cell-${key}-0`,
    ]) {
      expect(style(id).height).toBeUndefined();
    }
  });
});
