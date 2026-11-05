import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AccessibilityInfo, StyleSheet } from "react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { PivotEngine } from "../index";
import PivotGrid from "../PivotGrid";

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

const engineFor = (slice: object = {}, data: object[] = ROWS) => {
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

const style = (id: string) =>
  StyleSheet.flatten(screen.getByTestId(id).props.style) as Record<string, any>;

const scrollBody = (y: number, x = 0) =>
  fireEvent.scroll(screen.getByTestId("pivot-body-y"), {
    nativeEvent: { contentOffset: { x, y } },
  });

describe("PivotGrid (phone)", () => {
  test("shows the header, the labels and the numbers", async () => {
    await show(engineFor());
    expect(await screen.findByText("Total")).toBeTruthy();
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("23")).toBeTruthy();
  });

  test("a number fills its cell on one line, aligned right", async () => {
    // Sized to its content, the number was measured a fraction short on Android 15 at density 1
    // (the CI emulator) and drawn on two lines: 22 showed as "2" over "2" (CI of 2026-10-26).
    await show(engineFor());
    const number = await screen.findByText("23");
    expect(number.props.numberOfLines).toBe(1);
    const flat = StyleSheet.flatten(number.props.style) as Record<string, any>;
    expect(flat.alignSelf).toBe("stretch");
    expect(flat.textAlign).toBe("right");
  });

  test("opens and closes a row, and a column group", async () => {
    await show(engineFor());
    await screen.findByText("y");
    await fireEvent.press(screen.getAllByLabelText("Collapse")[0]);
    expect(screen.queryByText("y")).toBeNull();
    await fireEvent.press(screen.getAllByLabelText("Expand")[0]);
    expect(await screen.findByText("y")).toBeTruthy();
  });

  test("opens a collapsed column group", async () => {
    await show(
      engineFor({
        rows: [{ uniqueName: "site" }],
        columns: [{ uniqueName: "flag" }, { uniqueName: "cat" }],
        expands: {
          expandAll: false,
          expandedMembers: ["__root__", "__root__|flag:t"],
        },
      }),
    );
    await screen.findByText("Total");
    expect(screen.queryByText("y")).toBeNull();
    await fireEvent.press(screen.getAllByLabelText("Expand")[0]);
    expect(await screen.findByText("y")).toBeTruthy();
  });

  test("the fixed parts sit in clipped boxes moved by animated values", async () => {
    await show(engineFor());
    await screen.findByText("Total");
    expect(style("pivot-header-clip").overflow).toBe("hidden");
    expect(style("pivot-label-clip").overflow).toBe("hidden");
    expect(JSON.stringify(style("pivot-header-track").transform)).toContain(
      "translateX",
    );
    expect(JSON.stringify(style("pivot-label-track").transform)).toContain(
      "translateY",
    );
    expect(screen.getByTestId("pivot-body-x").props.horizontal).toBe(true);
    expect(screen.getByTestId("pivot-body-y").props.nestedScrollEnabled).toBe(
      true,
    );
    expect(screen.getByLabelText("Pivot grid")).toBeTruthy();
  });

  test("mounts only the rows of the window, and moves it with a scroll", async () => {
    const many = Array.from({ length: 10000 }, (_, i) => ({
      site: `S${String(i).padStart(5, "0")}`,
      cat: "x",
      flag: "t",
      n: 1,
    }));
    await show(engineFor({ rows: [{ uniqueName: "site" }] }, many), 320);
    await screen.findByText("S00000");
    expect(screen.queryAllByTestId(/^pivot-row-/).length).toBeLessThan(60);
    await act(async () => {
      scrollBody(100000);
    });
    expect(await screen.findByText("S03124")).toBeTruthy();
    expect(screen.queryByText("S00000")).toBeNull();
  }, 90_000);

  test("with a screen reader on, only the rows in view are mounted", async () => {
    // The rows kept above and below the view are clipped out of sight but Android still reports them
    // to TalkBack (React Native clips by drawing), so a reader could land on rows nobody can see.
    // Replaced and put back by hand: the jest setup already makes it a mock, and restoring a spy on
    // a mock leaves it with no implementation for the tests after this one.
    const original = AccessibilityInfo.isScreenReaderEnabled;
    AccessibilityInfo.isScreenReaderEnabled = () => Promise.resolve(true);
    try {
      const many = Array.from({ length: 1000 }, (_, i) => ({
        site: `S${String(i).padStart(4, "0")}`,
        cat: "x",
        flag: "t",
        n: 1,
      }));
      await show(engineFor({ rows: [{ uniqueName: "site" }] }, many), 320);
      await screen.findByText("S0000");
      // 320 - 36 px of header leaves 284 px: nine rows of 32 px are in view, the ninth in part.
      await waitFor(() =>
        expect(screen.queryAllByTestId(/^pivot-row-/).length).toBe(9),
      );
    } finally {
      AccessibilityInfo.isScreenReaderEnabled = original;
    }
  });

  test("after a deep scroll, closing the groups still leaves the last rows mounted", async () => {
    const sites = Array.from(
      { length: 60 },
      (_, i) => `S${String(i).padStart(2, "0")}`,
    );
    const data = sites.flatMap((site) =>
      ["x", "y"].map((cat) => ({ site, cat, flag: "t", n: 1 })),
    );
    const engine = engineFor({}, data);
    await show(engine, 320);
    await screen.findByText("S00");
    await act(async () => {
      scrollBody(181 * 32);
    });
    expect(await screen.findByText("S59")).toBeTruthy();
    await act(async () => {
      sites.forEach((site) => engine.toggleExpanded(`__root__|site:${site}`));
    });
    // 61 rows left; the viewport (320 - 36 px of header) shows 9 of them, so at least 9 are mounted.
    expect(
      screen.queryAllByTestId(/^pivot-row-/).length,
    ).toBeGreaterThanOrEqual(9);
    expect(await screen.findByText("S59")).toBeTruthy();
  });

  test("narrow container: the fixed columns shrink", async () => {
    await show(engineFor());
    await screen.findByText("Total");
    await act(async () => {
      fireEvent(screen.getByTestId("pivot-grid"), "layout", {
        nativeEvent: { layout: { width: 310, height: 480 } },
      });
    });
    const key = "__root__|site:A";
    expect(style(`pivot-chevron-${key}`).width).toBe(28);
    expect(style(`pivot-label-${key}`).width).toBe(124);
    expect(style("pivot-corner").width).toBe(152);
    expect(style(`pivot-cell-${key}-0`).width).toBe(84);
  });

  test("no data and loading show their message", async () => {
    await show(engineFor({}, []));
    expect(await screen.findByText("No data to display")).toBeTruthy();
    jest.useFakeTimers();
    try {
      const many = Array.from({ length: 5001 }, (_, i) => ({
        site: `S${i % 7}`,
        cat: "x",
        flag: "t",
        n: i,
      }));
      await show(engineFor({}, many));
      expect(screen.getByText("Processing…")).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

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
      await show(engineFor());
      // `accessible` is what makes VoiceOver read the label instead of the "!" inside.
      expect((await screen.findByLabelText(/boom/)).props.accessible).toBe(
        true,
      );
    } finally {
      spy.mockRestore();
    }
  });
});
