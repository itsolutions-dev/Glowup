import React from "react";
import { ScrollView } from "react-native";
import { render } from "@testing-library/react-native";
import { DatePicker, ThemeProvider } from "..";

// The endless calendar is a FlatList of months inside a box of fixed height.
// A form that scrolls (nearly every one) put it inside a vertical ScrollView,
// and React Native warned "VirtualizedLists should never be nested inside
// plain ScrollViews" on every such screen (seen on the emulator, 2/11). The
// list scrolls in its own box, so its windowing is sound; on Android it also
// has to keep the finger from the page around it (nestedScrollEnabled).
const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("the endless calendar inside a page that scrolls", () => {
  // What a vertical ScrollView hands its children; under jest ScrollView is a
  // stand-in that does not provide it.
  const ScrollContext = (
    ScrollView as unknown as {
      Context: React.Context<{ horizontal: boolean } | null>;
    }
  ).Context;
  const page = () =>
    draw(
      <ScrollContext.Provider value={{ horizontal: false }}>
        <DatePicker
          testID="cal"
          variant="static"
          locale="en-US"
          value={new Date(2024, 2, 10)}
          onChange={() => {}}
        />
      </ScrollContext.Provider>,
    );

  it("does not warn about a nested VirtualizedList", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    await page();
    const nested = error.mock.calls.filter((args) =>
      String(args[0]).includes("VirtualizedLists should never be nested"),
    );
    error.mockRestore();
    expect(nested).toHaveLength(0);
  });

  it("scrolls its months itself, also inside a scrolling page on Android", async () => {
    const screen = await page();
    expect(
      screen.getByTestId("cal-calendar-months").props.nestedScrollEnabled,
    ).toBe(true);
  });
});
