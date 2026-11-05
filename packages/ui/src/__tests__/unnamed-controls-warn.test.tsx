import React from "react";
import { render } from "@testing-library/react-native";
import { Button, FAB, ThemeProvider } from "..";
import { resetDevWarnings } from "../components/internal/devWarning";

// Icons are never read by screen readers (2/11), so a control drawn as an icon
// alone has no name unless the app gives one: TalkBack said "plus FAB" or just
// "Button". The library cannot invent the name; in development it says so,
// once, so the app's author sees it.
const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

let warn: jest.SpyInstance;
beforeEach(() => {
  resetDevWarnings();
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

const warnings = () => warn.mock.calls.map((args) => String(args[0]));

describe("a FAB", () => {
  it("without label warns once in development: it has no name", async () => {
    await draw(
      <>
        <FAB icon="plus" onClick={() => {}} />
        <FAB icon="pencil" onClick={() => {}} />
      </>,
    );
    const fab = warnings().filter((w) => w.includes("FAB"));
    expect(fab).toHaveLength(1);
    expect(fab[0]).toMatch(/label/);
  });

  it("with label says nothing, whatever the variant", async () => {
    await draw(<FAB icon="plus" label="New note" onClick={() => {}} />);
    expect(warnings()).toHaveLength(0);
  });
});

describe("an icon-only Button", () => {
  it("without accessibilityLabel warns once in development", async () => {
    await draw(<Button iconName="cart-outline" onClick={() => {}} />);
    const button = warnings().filter((w) => w.includes("Button"));
    expect(button).toHaveLength(1);
    expect(button[0]).toMatch(/accessibilityLabel/);
  });

  it("with accessibilityLabel, or with text, says nothing", async () => {
    await draw(
      <>
        <Button
          iconName="cart-outline"
          accessibilityLabel="Cart"
          onClick={() => {}}
        />
        <Button iconName="content-save-outline" onClick={() => {}}>
          Save
        </Button>
      </>,
    );
    expect(warnings()).toHaveLength(0);
  });
});
