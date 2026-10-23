import React from "react";
import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { ThemeProvider, Tree, type TreeNode, type TreeProps } from "..";
import {
  checkStates,
  indexNodes,
  toggleChecked,
  visibleRows,
} from "../components/internal/treeModel";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

// The chevron and the panels run on timers; none should fire between tests.
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const data: TreeNode[] = [
  {
    id: "fruits",
    label: "Fruits",
    children: [
      { id: "apple", label: "Apple" },
      { id: "pear", label: "Pear" },
    ],
  },
  {
    id: "veg",
    label: "Vegetables",
    children: [
      { id: "leek", label: "Leek" },
      { id: "kale", label: "Kale", disabled: true },
    ],
  },
  { id: "salt", label: "Salt" },
];

const tree = (props: Partial<TreeProps> = {}) => (
  <Tree data={data} testID="t" {...props} />
);

describe("disabled", () => {
  it("makes the whole tree inert", async () => {
    const onExpandedChange = jest.fn();
    const onSelectedChange = jest.fn();
    const { getByText, getByTestId } = await draw(
      tree({
        disabled: true,
        selectionMode: "single",
        onExpandedChange,
        onSelectedChange,
      }),
    );
    await fireEvent.press(getByText("Fruits"));
    await fireEvent.press(getByText("Salt"));
    await fireEvent.press(getByTestId("t-chevron-fruits"));
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it("lets a disabled node be opened from its chevron, not selected", async () => {
    const onExpandedChange = jest.fn();
    const onSelectedChange = jest.fn();
    const nodes: TreeNode[] = [
      {
        id: "locked",
        label: "Locked",
        disabled: true,
        children: [{ id: "inner", label: "Inner" }],
      },
    ];
    const { getByText, getByTestId } = await draw(
      <Tree
        data={nodes}
        testID="t"
        selectionMode="single"
        onExpandedChange={onExpandedChange}
        onSelectedChange={onSelectedChange}
      />,
    );
    await fireEvent.press(getByText("Locked"));
    expect(onSelectedChange).not.toHaveBeenCalled();
    await fireEvent.press(getByTestId("t-chevron-locked"));
    expect(onExpandedChange).toHaveBeenCalledWith(["locked"]);
    expect(getByText("Inner")).toBeTruthy();
  });
});

describe("renderLabel", () => {
  it("draws the label and is told the state of the row", async () => {
    const renderLabel = jest.fn((node: TreeNode) => (
      <Text>{`> ${node.id}`}</Text>
    ));
    const { getByText } = await draw(
      tree({
        renderLabel,
        defaultExpanded: ["fruits"],
        defaultSelected: ["apple"],
        selectionMode: "single",
      }),
    );
    expect(getByText("> fruits")).toBeTruthy();
    expect(renderLabel).toHaveBeenCalledWith(
      expect.objectContaining({ id: "apple" }),
      expect.objectContaining({
        level: 2,
        selected: true,
        expanded: false,
        indeterminate: false,
        loading: false,
        disabled: false,
      }),
    );
    expect(renderLabel).toHaveBeenCalledWith(
      expect.objectContaining({ id: "fruits" }),
      expect.objectContaining({ level: 1, expanded: true }),
    );
  });
});

describe("memoised rows", () => {
  const big: TreeNode[] = Array.from({ length: 4 }, (_, p) => ({
    id: `p${p}`,
    label: `Parent ${p}`,
    children: Array.from({ length: 3 }, (_, c) => ({
      id: `p${p}c${c}`,
      label: `Child ${p}.${c}`,
    })),
  }));
  let counts: Record<string, number> = {};
  const renderLabel = (node: TreeNode) => {
    counts[node.id] = (counts[node.id] ?? 0) + 1;
    return <Text>{node.label}</Text>;
  };
  beforeEach(() => {
    counts = {};
  });
  const rendered = () => Object.keys(counts).sort();

  it("draws only the row that changed when it is selected", async () => {
    const { getByText } = await draw(
      <Tree
        data={big}
        testID="t"
        selectionMode="single"
        defaultExpanded={["p0", "p1", "p2", "p3"]}
        renderLabel={renderLabel}
      />,
    );
    counts = {};
    await fireEvent.press(getByText("Child 2.1"));
    // The pressed row, and the row that held the tab stop until now.
    expect(rendered()).toEqual(["p0", "p2c1"]);
  });

  it("draws the row that opened and its new children, no others, on expanding", async () => {
    const { getByText } = await draw(
      <Tree data={big} testID="t" renderLabel={renderLabel} />,
    );
    counts = {};
    await fireEvent.press(getByText("Parent 2"));
    expect(rendered()).toEqual(["p0", "p2", "p2c0", "p2c1", "p2c2"]);
  });

  it("draws the changed child, its parent and the old tab stop when a box is checked", async () => {
    const { getByText } = await draw(
      <Tree
        data={big}
        testID="t"
        selectionMode="multiple"
        checkboxes
        defaultExpanded={["p0", "p1", "p2", "p3"]}
        renderLabel={renderLabel}
      />,
    );
    counts = {};
    await fireEvent.press(getByText("Child 1.0"));
    expect(rendered()).toEqual(["p0", "p1", "p1c0"]);
    counts = {};
    await fireEvent.press(getByText("Parent 3"));
    expect(rendered()).toEqual(["p1c0", "p3", "p3c0", "p3c1", "p3c2"]);
  });

  it("does not draw the rows again when the tree is drawn with the same props", async () => {
    const element = (
      <Tree
        data={big}
        testID="t"
        defaultExpanded={["p0"]}
        renderLabel={renderLabel}
      />
    );
    const { rerender } = await draw(element);
    counts = {};
    await rerender(<ThemeProvider>{element}</ThemeProvider>);
    expect(rendered()).toEqual([]);
  });
});

describe("treeModel", () => {
  const none = new Map<string, TreeNode[]>();
  const index = indexNodes(data, none);

  it("lists the visible rows in drawing order, with level and parent", () => {
    const rows = visibleRows(data, none, new Set(["fruits"]));
    expect(rows.map((r) => [r.id, r.level, r.parent, r.expanded])).toEqual([
      ["fruits", 1, null, true],
      ["apple", 2, "fruits", false],
      ["pear", 2, "fruits", false],
      ["veg", 1, null, false],
      ["salt", 1, null, false],
    ]);
    // Opening a leaf, or an id that is not there, changes nothing.
    expect(visibleRows(data, none, new Set(["salt", "nope"]))).toHaveLength(3);
  });

  it("derives a parent from its children and lets a parent id stand for its branch", () => {
    const states = checkStates(data, none, new Set(["apple"]));
    expect(states.get("fruits")).toBe("mixed");
    expect(states.get("veg")).toBe("unchecked");
    expect(checkStates(data, none, new Set(["veg"])).get("kale")).toBe(
      "checked",
    );
  });

  it("returns null when nothing under the node can be toggled", () => {
    const only: TreeNode[] = [{ id: "a", label: "A", disabled: true }];
    expect(
      toggleChecked(only, none, indexNodes(only, none), new Set(), "a"),
    ).toBeNull();
    expect(toggleChecked(data, none, index, new Set(), "missing")).toBeNull();
  });

  it("lists a three-level selection in tree order", () => {
    const deep: TreeNode[] = [
      {
        id: "a",
        label: "A",
        children: [
          { id: "b", label: "B", children: [{ id: "c", label: "C" }] },
          { id: "d", label: "D" },
        ],
      },
    ];
    const deepIndex = indexNodes(deep, none);
    expect(toggleChecked(deep, none, deepIndex, new Set(), "a")).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(toggleChecked(deep, none, deepIndex, new Set(), "c")).toEqual([
      "b",
      "c",
    ]);
  });
});
