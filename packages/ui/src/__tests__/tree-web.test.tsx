import React from "react";
import { Platform } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { ThemeProvider, Tree, type TreeNode, type TreeProps } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);
type View = Awaited<ReturnType<typeof draw>>;

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

const getElementById = jest.fn();
const focus = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  jest.replaceProperty(Platform, "OS", "web");
  focus.mockClear();
  getElementById.mockReset().mockImplementation(() => ({ focus }));
  (globalThis as Record<string, unknown>).document = { getElementById };
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  delete (globalThis as Record<string, unknown>).document;
});

const item = (view: View, id: string) => view.getByTestId(`t-item-${id}`);
const IDS = ["fruits", "apple", "pear", "veg", "leek", "kale", "salt"];
// The rows in the tab order: there should always be one.
const stops = (view: View) =>
  IDS.filter((id) => view.queryByTestId(`t-item-${id}`)?.props.tabIndex === 0);
const key = (name: string, extra: object = {}) => ({
  key: name,
  preventDefault: jest.fn(),
  ...extra,
});
const keys = async (view: View, ...names: string[]) => {
  for (const name of names) {
    await fireEvent(view.getByTestId("t"), "keyDown", key(name));
  }
};
const focusTree = (view: View) => fireEvent(view.getByTestId("t"), "focus");

describe("ARIA tree pattern", () => {
  it("has tree, treeitem and group roles with level, position, size and state", async () => {
    const view = await draw(
      tree({
        selectionMode: "multiple",
        defaultExpanded: ["fruits"],
        defaultSelected: ["pear"],
        accessibilityLabel: "Produce",
      }),
    );
    const root = view.getByTestId("t");
    expect(root.props.role).toBe("tree");
    expect(root.props["aria-multiselectable"]).toBe(true);
    expect(root.props["aria-label"]).toBe("Produce");
    expect(item(view, "fruits").props).toMatchObject({
      role: "treeitem",
      "aria-level": 1,
      "aria-posinset": 1,
      "aria-setsize": 3,
      "aria-expanded": true,
      "aria-selected": false,
    });
    expect(item(view, "pear").props).toMatchObject({
      "aria-level": 2,
      "aria-posinset": 2,
      "aria-setsize": 2,
      "aria-selected": true,
    });
    expect(item(view, "pear").props["aria-expanded"]).toBeUndefined();
    expect(item(view, "veg").props["aria-expanded"]).toBe(false);
    expect(
      view.container.queryAll(
        (n) => n.type === "View" && n.props.role === "group",
      ),
    ).toHaveLength(1);
  });

  it("names an item by its own label, not by the rows under it", async () => {
    const view = await draw(tree({ defaultExpanded: ["fruits"] }));
    const fruits = item(view, "fruits");
    expect(fruits.props["aria-labelledby"]).toBe(`${fruits.props.id}-label`);
    expect(
      view.container.queryAll(
        (n) => n.type === "View" && n.props.id === `${fruits.props.id}-label`,
      )[0],
    ).toBeTruthy();
  });

  it("uses aria-checked, mixed included, with checkboxes, and no aria-selected", async () => {
    const view = await draw(
      tree({
        selectionMode: "multiple",
        checkboxes: true,
        defaultExpanded: ["fruits"],
        defaultSelected: ["apple"],
      }),
    );
    expect(item(view, "fruits").props["aria-checked"]).toBe("mixed");
    expect(item(view, "apple").props["aria-checked"]).toBe(true);
    expect(item(view, "pear").props["aria-checked"]).toBe(false);
    expect(item(view, "apple").props["aria-selected"]).toBeUndefined();
  });

  it("leaves aria-selected out when nothing can be selected, and marks disabled rows", async () => {
    const view = await draw(tree({ defaultExpanded: ["veg"] }));
    expect(item(view, "fruits").props["aria-selected"]).toBeUndefined();
    expect(item(view, "kale").props["aria-disabled"]).toBe(true);
    expect(item(view, "leek").props["aria-disabled"]).toBeUndefined();
  });

  it("keeps the rows out of the tab order but the one stop", async () => {
    const view = await draw(tree({ defaultExpanded: ["fruits"] }));
    expect(stops(view)).toEqual(["fruits"]);
    expect(item(view, "apple").props.tabIndex).toBe(-1);
  });
});

describe("keyboard", () => {
  it("moves with Down, Up, Home and End, and focuses the row it lands on", async () => {
    const view = await draw(tree({ defaultExpanded: ["fruits"] }));
    await focusTree(view);
    await keys(view, "ArrowDown");
    expect(stops(view)).toEqual(["apple"]);
    expect(getElementById).toHaveBeenLastCalledWith(
      item(view, "apple").props.id,
    );
    expect(focus).toHaveBeenCalledTimes(1);
    await keys(view, "End");
    expect(stops(view)).toEqual(["salt"]);
    await keys(view, "ArrowDown");
    expect(stops(view)).toEqual(["salt"]);
    await keys(view, "ArrowUp", "ArrowUp");
    expect(stops(view)).toEqual(["pear"]);
    await keys(view, "Home");
    expect(stops(view)).toEqual(["fruits"]);
    await keys(view, "ArrowUp");
    expect(stops(view)).toEqual(["fruits"]);
  });

  it("opens with Right, steps in with Right, closes with Left, steps out with Left", async () => {
    const onExpandedChange = jest.fn();
    const view = await draw(tree({ onExpandedChange }));
    await focusTree(view);
    await keys(view, "ArrowRight");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["fruits"]);
    expect(stops(view)).toEqual(["fruits"]);
    await keys(view, "ArrowRight");
    expect(stops(view)).toEqual(["apple"]);
    await keys(view, "ArrowRight"); // a leaf: nothing happens
    expect(stops(view)).toEqual(["apple"]);
    await keys(view, "ArrowLeft");
    expect(stops(view)).toEqual(["fruits"]);
    await keys(view, "ArrowLeft");
    expect(onExpandedChange).toHaveBeenLastCalledWith([]);
    await keys(view, "ArrowLeft"); // a closed root: nothing happens
    expect(stops(view)).toEqual(["fruits"]);
  });

  it("acts on the row with Enter and Space", async () => {
    const onSelectedChange = jest.fn();
    const view = await draw(
      tree({
        selectionMode: "multiple",
        defaultExpanded: ["fruits"],
        onSelectedChange,
      }),
    );
    await focusTree(view);
    await keys(view, "ArrowDown", "Enter");
    expect(onSelectedChange).toHaveBeenLastCalledWith(["apple"]);
    await keys(view, " ");
    expect(onSelectedChange).toHaveBeenLastCalledWith([]);
  });

  it("opens a row on Enter when nothing can be selected", async () => {
    const view = await draw(tree());
    await focusTree(view);
    await keys(view, "Enter");
    expect(view.getByText("Apple")).toBeTruthy();
  });

  it("does not select a disabled row from the keyboard", async () => {
    const onSelectedChange = jest.fn();
    const view = await draw(
      tree({
        selectionMode: "single",
        defaultExpanded: ["veg"],
        onSelectedChange,
      }),
    );
    await focusTree(view);
    await keys(view, "ArrowDown", "ArrowDown", "ArrowDown", "Enter");
    expect(stops(view)).toEqual(["kale"]);
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it("opens every closed sibling with *", async () => {
    const onExpandedChange = jest.fn();
    const view = await draw(tree({ onExpandedChange }));
    await focusTree(view);
    await keys(view, "*");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["fruits", "veg"]);
    expect(view.getByText("Leek")).toBeTruthy();
  });

  it("jumps to the next label that starts with the typed letters", async () => {
    const view = await draw(tree({ defaultExpanded: ["fruits", "veg"] }));
    await focusTree(view);
    await keys(view, "v");
    expect(stops(view)).toEqual(["veg"]);
    await keys(view, "e"); // "ve" is still Vegetables
    expect(stops(view)).toEqual(["veg"]);
  });

  it("steps to the next match when one letter is typed again after a pause", async () => {
    const now = jest.spyOn(Date, "now");
    now.mockReturnValue(1000);
    const nodes: TreeNode[] = [
      { id: "a1", label: "Alpha" },
      { id: "b1", label: "Beta" },
      { id: "a2", label: "Atlas" },
    ];
    const view = await draw(<Tree data={nodes} testID="t" />);
    await focusTree(view);
    await keys(view, "a");
    expect(view.getByTestId("t-item-a2").props.tabIndex).toBe(0);
    now.mockReturnValue(5000);
    await keys(view, "a");
    expect(view.getByTestId("t-item-a1").props.tabIndex).toBe(0);
  });

  it("prevents the browser's handling of the keys it takes, and ignores shortcuts", async () => {
    const view = await draw(tree());
    await focusTree(view);
    const down = key("ArrowDown");
    await fireEvent(view.getByTestId("t"), "keyDown", down);
    expect(down.preventDefault).toHaveBeenCalled();
    const shortcut = key("ArrowDown", { ctrlKey: true });
    await fireEvent(view.getByTestId("t"), "keyDown", shortcut);
    expect(shortcut.preventDefault).not.toHaveBeenCalled();
    const tab = key("Tab");
    await fireEvent(view.getByTestId("t"), "keyDown", tab);
    expect(tab.preventDefault).not.toHaveBeenCalled();
  });

  it("takes no key on a disabled tree, and has no tab stop", async () => {
    const view = await draw(tree({ disabled: true }));
    expect(stops(view)).toEqual([]);
    await keys(view, "ArrowDown", "Enter");
    expect(focus).not.toHaveBeenCalled();
  });

  it("falls back to the first row when the focused one goes away", async () => {
    const view = await draw(tree({ defaultExpanded: ["fruits"] }));
    await focusTree(view);
    await keys(view, "ArrowDown", "ArrowDown");
    expect(stops(view)).toEqual(["pear"]);
    await keys(view, "Home", "ArrowDown", "ArrowLeft");
    expect(stops(view)).toEqual(["fruits"]);
  });
});

describe("focus", () => {
  it("moves the focus to a row that is pressed", async () => {
    const view = await draw(
      tree({ selectionMode: "single", defaultExpanded: ["fruits"] }),
    );
    await fireEvent.press(view.getByText("Pear"));
    expect(getElementById).toHaveBeenLastCalledWith(
      item(view, "pear").props.id,
    );
    expect(stops(view)).toEqual(["pear"]);
  });

  it("moves the focus to a row whose chevron is pressed", async () => {
    const view = await draw(tree({ selectionMode: "single" }));
    await fireEvent.press(view.getByTestId("t-chevron-veg"));
    expect(stops(view)).toEqual(["veg"]);
  });

  it("does not touch the document while rendering", async () => {
    delete (globalThis as Record<string, unknown>).document;
    const view = await draw(tree({ defaultExpanded: ["fruits"] }));
    expect(view.getByText("Apple")).toBeTruthy();
  });
});
