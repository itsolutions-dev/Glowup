import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { act, fireEvent, render } from "@testing-library/react-native";
import { SpeedDial, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );

const actions = [
  { id: 1, icon: "pencil" as const, label: "Edit", onPress: () => {} },
];

describe("SpeedDial accessibility", () => {
  it("names the trigger and each action by its label, read once", async () => {
    const { getByRole, queryAllByText } = await draw(
      <SpeedDial mainIcon="plus" defaultOpen actions={actions} />,
    );
    expect(getByRole("button", { name: "Close actions" })).toBeTruthy();
    expect(getByRole("button", { name: "Edit" })).toBeTruthy();
    // The visible label card repeats the button's name: screen readers skip it.
    expect(queryAllByText("Edit")).toHaveLength(0);
    expect(
      queryAllByText("Edit", { includeHiddenElements: true }),
    ).toHaveLength(1);
  });

  it("keeps closed actions out of screen readers and the tab order", async () => {
    jest.useFakeTimers();
    const { getByRole, queryByRole } = await draw(
      <SpeedDial mainIcon="plus" actions={actions} />,
    );
    expect(queryByRole("button", { name: "Edit" })).toBeNull();
    const hidden = getByRole("button", {
      name: "Edit",
      includeHiddenElements: true,
    });
    // Disabled is what takes a Pressable out of the web tab order.
    expect(hidden.props.accessibilityState?.disabled).toBe(true);

    await fireEvent.press(getByRole("button", { name: "Open actions" }));
    expect(getByRole("button", { name: "Edit" })).toBeTruthy();
    expect(
      getByRole("button", { name: "Edit" }).props.accessibilityState?.disabled,
    ).toBeFalsy();

    // Closing hides them at once, and disables them once the spring settles,
    // so they never turn grey while still visible.
    await fireEvent.press(getByRole("button", { name: "Close actions" }));
    expect(queryByRole("button", { name: "Edit" })).toBeNull();
    await act(async () => {
      jest.runAllTimers();
    });
    expect(
      getByRole("button", { name: "Edit", includeHiddenElements: true }).props
        .accessibilityState?.disabled,
    ).toBe(true);
    jest.useRealTimers();
  });
});
