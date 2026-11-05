import React from "react";
import { ScrollView, Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Menu, Select, ThemeProvider } from "..";

// Select and Menu drew every option at once (a ScrollView with a
// map): a list of a few hundred customers or cities was hundreds of rows drawn
// the moment it opened, slow on a phone (1.5 of the plan). They are now
// virtualized: what is drawn is about one screen of the list, whatever its
// length. They also open inside pages that scroll, so they must not trip React
// Native's nested-list warning. (Autocomplete shows at most maxSuggestions,
// 8 by default, so it has no long list.)
const MANY = 500;
const names = Array.from({ length: MANY }, (_, i) => `Option ${i + 1}`);

// What a vertical ScrollView hands its children (under jest ScrollView is a
// stand-in that does not provide it).
const ScrollContext = (
  ScrollView as unknown as {
    Context: React.Context<{ horizontal: boolean } | null>;
  }
).Context;
const draw = (ui: React.ReactElement) =>
  render(
    <ThemeProvider>
      <ScrollContext.Provider value={{ horizontal: false }}>
        {ui}
      </ScrollContext.Provider>
    </ThemeProvider>,
  );
type View = Awaited<ReturnType<typeof draw>>;

const drawn = (view: View) =>
  view.queryAllByText(/^Option \d+$/, { includeHiddenElements: true }).length;

let error: jest.SpyInstance;
beforeEach(() => {
  error = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => error.mockRestore());
const nestedWarnings = () =>
  error.mock.calls.filter((args) =>
    String(args[0]).includes("VirtualizedLists should never be nested"),
  );

describe("Select with many options", () => {
  const select = (onChange = jest.fn()) =>
    draw(
      <Select
        label="Customer"
        options={names.map((label, i) => ({ id: String(i), label, value: i }))}
        value={null}
        onChange={onChange}
        defaultOpen
      />,
    );

  it("draws about a screen of them, not all", async () => {
    const view = await select();
    expect(view.getByText("Option 1")).toBeTruthy();
    expect(drawn(view)).toBeLessThan(100);
  });

  it("still picks the one pressed", async () => {
    const onChange = jest.fn();
    const view = await select(onChange);
    await fireEvent.press(view.getByLabelText("Option 3"));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("does not warn inside a page that scrolls", async () => {
    await select();
    expect(nestedWarnings()).toHaveLength(0);
  });
});

describe("Menu with many items", () => {
  it("draws about a screen of them, and no nested-list warning", async () => {
    const view = await draw(
      <Menu
        visible
        anchor={<Text>Open</Text>}
        items={names.map((label, i) => ({ id: String(i), label }))}
        onClose={() => {}}
      />,
    );
    expect(view.getByText("Option 1")).toBeTruthy();
    expect(drawn(view)).toBeLessThan(100);
    expect(nestedWarnings()).toHaveLength(0);
  });
});
