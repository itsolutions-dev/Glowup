import React from "react";
import { Text } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ThemeProvider, Tree, type TreeNode, type TreeProps } from "..";

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

describe("rendering", () => {
  it("draws the roots and keeps closed branches out", async () => {
    const { getByText, queryByText } = await draw(tree());
    expect(getByText("Fruits")).toBeTruthy();
    expect(getByText("Salt")).toBeTruthy();
    expect(queryByText("Apple")).toBeNull();
  });

  it("opens the nodes in defaultExpanded", async () => {
    const { getByText, queryByText } = await draw(
      tree({ defaultExpanded: ["fruits"] }),
    );
    expect(getByText("Apple")).toBeTruthy();
    expect(getByText("Pear")).toBeTruthy();
    expect(queryByText("Leek")).toBeNull();
  });

  it("draws an icon, a count badge and any node as a label or badge", async () => {
    const { getByText, getByTestId } = await draw(
      <Tree
        testID="t"
        data={[
          {
            id: "a",
            label: "Inbox",
            icon: "inbox-outline",
            badge: 12,
          },
          {
            id: "b",
            label: <Text>Custom label</Text>,
            badge: <Text>new</Text>,
          },
        ]}
      />,
    );
    expect(getByText("12")).toBeTruthy();
    expect(getByText("Custom label")).toBeTruthy();
    expect(getByText("new")).toBeTruthy();
    expect(getByTestId("t-item-a")).toBeTruthy();
  });

  it("renders nothing for empty data", async () => {
    const { toJSON } = await draw(<Tree data={[]} testID="t" />);
    expect(JSON.stringify(toJSON())).toContain('"testID":"t"');
  });

  it.each(["small", "medium", "large"] as const)(
    "takes showLines, a custom indent and size %s",
    async (size) => {
      const { getByText } = await draw(
        tree({
          size,
          showLines: true,
          indent: 40,
          defaultExpanded: ["fruits"],
        }),
      );
      expect(getByText("Apple")).toBeTruthy();
    },
  );
});

describe("expanding", () => {
  it("opens and closes a row on press and reports the open ids", async () => {
    const onExpandedChange = jest.fn();
    const { getByText, getByRole } = await draw(tree({ onExpandedChange }));
    await fireEvent.press(getByText("Fruits"));
    expect(onExpandedChange).toHaveBeenLastCalledWith(["fruits"]);
    expect(getByText("Apple")).toBeTruthy();
    expect(
      getByRole("button", { name: "Fruits" }).props.accessibilityState,
    ).toMatchObject({ expanded: true });
    await fireEvent.press(getByText("Fruits"));
    expect(onExpandedChange).toHaveBeenLastCalledWith([]);
    expect(
      getByRole("button", { name: "Fruits" }).props.accessibilityState,
    ).toMatchObject({ expanded: false });
  });

  it("opens from the chevron", async () => {
    const onExpandedChange = jest.fn();
    const { getByTestId } = await draw(
      tree({ onExpandedChange, selectionMode: "single" }),
    );
    await fireEvent.press(getByTestId("t-chevron-veg"));
    expect(onExpandedChange).toHaveBeenCalledWith(["veg"]);
  });

  it("is controlled by `expanded`", async () => {
    const onExpandedChange = jest.fn();
    const { getByText, queryByText, rerender } = await draw(
      tree({ expanded: [], onExpandedChange }),
    );
    await fireEvent.press(getByText("Fruits"));
    expect(onExpandedChange).toHaveBeenCalledWith(["fruits"]);
    expect(queryByText("Apple")).toBeNull();
    await rerender(
      <ThemeProvider>{tree({ expanded: ["fruits"] })}</ThemeProvider>,
    );
    expect(getByText("Apple")).toBeTruthy();
  });

  it("has no chevron and no expanded state on a leaf", async () => {
    const { queryByTestId, queryByRole } = await draw(tree());
    expect(queryByTestId("t-chevron-salt")).toBeNull();
    expect(queryByRole("button", { name: "Salt" })).toBeNull();
  });

  it("treats a node whose children are an empty array as a leaf", async () => {
    const { queryByTestId } = await draw(
      <Tree testID="t" data={[{ id: "x", label: "Empty", children: [] }]} />,
    );
    expect(queryByTestId("t-chevron-x")).toBeNull();
  });

  it("offers expand and collapse as screen reader actions on native", async () => {
    const { getByRole } = await draw(tree());
    const row = getByRole("button", { name: "Fruits" });
    expect(row.props.accessibilityActions).toEqual([{ name: "expand" }]);
    await fireEvent(row, "accessibilityAction", {
      nativeEvent: { actionName: "expand" },
    });
    expect(
      getByRole("button", { name: "Fruits" }).props.accessibilityActions,
    ).toEqual([{ name: "collapse" }]);
  });
});

describe("single selection", () => {
  it("selects the pressed row and only it", async () => {
    const onSelectedChange = jest.fn();
    const { getByText, getByRole } = await draw(
      tree({
        selectionMode: "single",
        defaultExpanded: ["fruits"],
        onSelectedChange,
      }),
    );
    await fireEvent.press(getByText("Apple"));
    expect(onSelectedChange).toHaveBeenLastCalledWith(["apple"]);
    await fireEvent.press(getByText("Pear"));
    expect(onSelectedChange).toHaveBeenLastCalledWith(["pear"]);
    expect(
      getByRole("button", { name: "Pear" }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      getByRole("button", { name: "Apple" }).props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("does not report the row that is already selected", async () => {
    const onSelectedChange = jest.fn();
    const { getByText } = await draw(
      tree({
        selectionMode: "single",
        defaultSelected: ["salt"],
        onSelectedChange,
      }),
    );
    await fireEvent.press(getByText("Salt"));
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it("does not open a parent on press: the chevron does", async () => {
    const { getByText, queryByText, getByTestId } = await draw(
      tree({ selectionMode: "single" }),
    );
    await fireEvent.press(getByText("Fruits"));
    expect(queryByText("Apple")).toBeNull();
    await fireEvent.press(getByTestId("t-chevron-fruits"));
    expect(getByText("Apple")).toBeTruthy();
  });

  it("is controlled by `selected`", async () => {
    const onSelectedChange = jest.fn();
    const { getByText, getByRole, rerender } = await draw(
      tree({ selectionMode: "single", selected: ["salt"], onSelectedChange }),
    );
    await fireEvent.press(getByText("Fruits"));
    expect(onSelectedChange).toHaveBeenCalledWith(["fruits"]);
    expect(
      getByRole("button", { name: "Salt" }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    await rerender(
      <ThemeProvider>
        {tree({ selectionMode: "single", selected: ["fruits"] })}
      </ThemeProvider>,
    );
    expect(
      getByRole("button", { name: "Fruits" }).props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it("ignores a disabled row", async () => {
    const onSelectedChange = jest.fn();
    const { getByText } = await draw(
      tree({
        selectionMode: "single",
        defaultExpanded: ["veg"],
        onSelectedChange,
      }),
    );
    await fireEvent.press(getByText("Kale"));
    expect(onSelectedChange).not.toHaveBeenCalled();
  });
});

describe("multiple selection", () => {
  it("toggles each row on its own, without cascading", async () => {
    const onSelectedChange = jest.fn();
    const { getByText } = await draw(
      tree({
        selectionMode: "multiple",
        defaultExpanded: ["fruits"],
        onSelectedChange,
      }),
    );
    await fireEvent.press(getByText("Apple"));
    await fireEvent.press(getByText("Fruits"));
    expect(onSelectedChange).toHaveBeenLastCalledWith(["apple", "fruits"]);
    await fireEvent.press(getByText("Apple"));
    expect(onSelectedChange).toHaveBeenLastCalledWith(["fruits"]);
  });
});

describe("checkboxes", () => {
  const boxes = (props: Partial<TreeProps> = {}) =>
    tree({
      selectionMode: "multiple",
      checkboxes: true,
      defaultExpanded: ["fruits", "veg"],
      ...props,
    });
  const state = (view: Awaited<ReturnType<typeof draw>>, name: string) =>
    view.getByRole("checkbox", { name }).props.accessibilityState.checked;

  it("checks everything under a parent, and the parent is listed too", async () => {
    const onSelectedChange = jest.fn();
    const view = await draw(boxes({ onSelectedChange }));
    await fireEvent.press(view.getByText("Fruits"));
    expect(onSelectedChange).toHaveBeenLastCalledWith([
      "fruits",
      "apple",
      "pear",
    ]);
    expect(state(view, "Fruits")).toBe(true);
    expect(state(view, "Apple")).toBe(true);
    expect(state(view, "Pear")).toBe(true);
    await fireEvent.press(view.getByText("Fruits"));
    expect(onSelectedChange).toHaveBeenLastCalledWith([]);
    expect(state(view, "Apple")).toBe(false);
  });

  it("shows the mixed state when only some children are checked", async () => {
    const onSelectedChange = jest.fn();
    const view = await draw(boxes({ onSelectedChange }));
    await fireEvent.press(view.getByText("Apple"));
    expect(onSelectedChange).toHaveBeenLastCalledWith(["apple"]);
    expect(state(view, "Fruits")).toBe("mixed");
    expect(state(view, "Pear")).toBe(false);
    // A mixed parent checks all on the next press.
    await fireEvent.press(view.getByText("Fruits"));
    expect(onSelectedChange).toHaveBeenLastCalledWith([
      "fruits",
      "apple",
      "pear",
    ]);
    // Unchecking one child takes the parent out again.
    await fireEvent.press(view.getByText("Pear"));
    expect(onSelectedChange).toHaveBeenLastCalledWith(["apple"]);
    expect(state(view, "Fruits")).toBe("mixed");
  });

  it("checks the parent when the last child is checked", async () => {
    const onSelectedChange = jest.fn();
    const view = await draw(boxes({ onSelectedChange }));
    await fireEvent.press(view.getByText("Apple"));
    await fireEvent.press(view.getByText("Pear"));
    expect(onSelectedChange).toHaveBeenLastCalledWith([
      "fruits",
      "apple",
      "pear",
    ]);
    expect(state(view, "Fruits")).toBe(true);
  });

  it("skips a disabled child when its parent is toggled, and keeps its state", async () => {
    const onSelectedChange = jest.fn();
    const view = await draw(boxes({ onSelectedChange }));
    await fireEvent.press(view.getByText("Vegetables"));
    expect(onSelectedChange).toHaveBeenLastCalledWith(["leek"]);
    expect(state(view, "Vegetables")).toBe("mixed");
    // Everything enabled is checked and the parent is still mixed: the next
    // press unchecks, it does not get stuck.
    await fireEvent.press(view.getByText("Vegetables"));
    expect(onSelectedChange).toHaveBeenLastCalledWith([]);
    await fireEvent.press(view.getByText("Kale"));
    expect(onSelectedChange).toHaveBeenCalledTimes(2);
  });

  it("takes a parent id in `selected` to mean its whole branch", async () => {
    const view = await draw(boxes({ defaultSelected: ["fruits"] }));
    expect(state(view, "Apple")).toBe(true);
    expect(state(view, "Pear")).toBe(true);
    expect(state(view, "Fruits")).toBe(true);
    expect(state(view, "Leek")).toBe(false);
  });

  it("ignores `checkboxes` outside the multiple mode", async () => {
    const view = await draw(
      tree({ selectionMode: "single", checkboxes: true }),
    );
    expect(view.queryByRole("checkbox")).toBeNull();
  });
});

describe("loadChildren", () => {
  const lazy: TreeNode[] = [{ id: "root", label: "Root", hasChildren: true }];
  const kids: TreeNode[] = [
    { id: "c1", label: "Child one" },
    { id: "c2", label: "Child two" },
  ];

  it("loads when a lazy node opens, with a loading row meanwhile", async () => {
    let resolve!: (nodes: TreeNode[]) => void;
    const loadChildren = jest.fn(
      () => new Promise<TreeNode[]>((r) => (resolve = r)),
    );
    const { getByText, queryByText } = await draw(
      <Tree data={lazy} loadChildren={loadChildren} testID="t" />,
    );
    expect(loadChildren).not.toHaveBeenCalled();
    await fireEvent.press(getByText("Root"));
    await waitFor(() => expect(getByText("Loading…")).toBeTruthy());
    expect(loadChildren).toHaveBeenCalledTimes(1);
    expect(loadChildren).toHaveBeenCalledWith(lazy[0]);
    resolve(kids);
    await waitFor(() => expect(getByText("Child one")).toBeTruthy());
    expect(queryByText("Loading…")).toBeNull();
  });

  it("keeps what it loaded: closing and opening again does not ask twice", async () => {
    const loadChildren = jest.fn(async () => kids);
    const { getByText } = await draw(
      <Tree data={lazy} loadChildren={loadChildren} testID="t" />,
    );
    await fireEvent.press(getByText("Root"));
    await waitFor(() => expect(getByText("Child one")).toBeTruthy());
    await fireEvent.press(getByText("Root"));
    await fireEvent.press(getByText("Root"));
    expect(getByText("Child two")).toBeTruthy();
    expect(loadChildren).toHaveBeenCalledTimes(1);
  });

  it("loads for a node that starts open", async () => {
    const loadChildren = jest.fn(async () => kids);
    const { getByText } = await draw(
      <Tree
        data={lazy}
        defaultExpanded={["root"]}
        loadChildren={loadChildren}
        testID="t"
      />,
    );
    await waitFor(() => expect(getByText("Child one")).toBeTruthy());
    expect(loadChildren).toHaveBeenCalledTimes(1);
  });

  it("shows a retry row when the load fails, and tries again on press", async () => {
    const onLoadError = jest.fn();
    const loadChildren = jest
      .fn<Promise<TreeNode[]>, [TreeNode]>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(kids);
    const { getByText, queryByText } = await draw(
      <Tree
        data={lazy}
        loadChildren={loadChildren}
        onLoadError={onLoadError}
        testID="t"
      />,
    );
    await fireEvent.press(getByText("Root"));
    await waitFor(() =>
      expect(getByText("Could not load. Try again")).toBeTruthy(),
    );
    expect(onLoadError).toHaveBeenCalledWith(expect.any(Error), lazy[0]);
    await fireEvent.press(getByText("Could not load. Try again"));
    await waitFor(() => expect(getByText("Child one")).toBeTruthy());
    expect(queryByText("Could not load. Try again")).toBeNull();
    expect(loadChildren).toHaveBeenCalledTimes(2);
  });

  it("makes a node whose load comes back empty a leaf", async () => {
    const { getByText, queryByTestId } = await draw(
      <Tree data={lazy} loadChildren={async () => []} testID="t" />,
    );
    await fireEvent.press(getByText("Root"));
    await waitFor(() => expect(queryByTestId("t-chevron-root")).toBeNull());
  });

  it("checks the loaded children of a branch that was checked before loading", async () => {
    const onSelectedChange = jest.fn();
    const { getByText, getByTestId, getByRole } = await draw(
      <Tree
        data={lazy}
        selectionMode="multiple"
        checkboxes
        loadChildren={async () => kids}
        onSelectedChange={onSelectedChange}
        testID="t"
      />,
    );
    await fireEvent.press(getByText("Root"));
    expect(onSelectedChange).toHaveBeenLastCalledWith(["root"]);
    await fireEvent.press(getByTestId("t-chevron-root"));
    await waitFor(() => expect(getByText("Child one")).toBeTruthy());
    expect(
      getByRole("checkbox", { name: "Child one" }).props.accessibilityState
        .checked,
    ).toBe(true);
  });
});
