import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { ThemeProvider, WeekStrip } from "..";

// Tuesday 3 November 2026.
const TUESDAY = new Date(2026, 10, 3);

const draw = (props: Partial<React.ComponentProps<typeof WeekStrip>> = {}) =>
  render(
    <ThemeProvider>
      <WeekStrip
        value={TUESDAY}
        onChange={() => {}}
        locale="it-IT"
        {...props}
      />
    </ThemeProvider>,
  );

const days = (view: Awaited<ReturnType<typeof draw>>) =>
  view.getAllByRole("button").map((b) => b.props.accessibilityLabel);

describe("WeekStrip", () => {
  it("shows Monday to Friday of the week, with the chosen day selected", async () => {
    const view = await draw();
    const labels = days(view);
    expect(labels).toHaveLength(5);
    expect(labels[0]).toMatch(/lunedì 2 novembre 2026/i);
    expect(labels[4]).toMatch(/venerdì 6 novembre 2026/i);
    const selected = view
      .getAllByRole("button")
      .filter((b) => b.props.accessibilityState?.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0].props.accessibilityLabel).toMatch(/martedì 3/i);
    // The short weekday and the day of the month are drawn.
    expect(view.getByText("3")).toBeTruthy();
  });

  it("reports the pressed day", async () => {
    const onChange = jest.fn();
    const view = await draw({ onChange });
    await fireEvent.press(view.getAllByRole("button")[3]);
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 5));
  });

  it("shows the days asked for, from the locale's first day of the week", async () => {
    const all = [0, 1, 2, 3, 4, 5, 6];
    const italy = days(await draw({ weekDays: all }));
    expect(italy).toHaveLength(7);
    expect(italy[0]).toMatch(/lunedì 2/i);
    expect(italy[6]).toMatch(/domenica 8/i);
    // In the United States the week starts on Sunday.
    const us = days(await draw({ weekDays: all, locale: "en-US" }));
    expect(us[0]).toMatch(/Sunday, November 1/);
    expect(us[6]).toMatch(/Saturday, November 7/);
  });

  it("moves a week, keeping the weekday, from a screen reader's actions", async () => {
    const onChange = jest.fn();
    const view = await draw({ onChange });
    const day = view.getAllByRole("button")[1];
    const names = day.props.accessibilityActions.map(
      (a: { label: string }) => a.label,
    );
    expect(names).toEqual(["Next week", "Previous week"]);
    await fireEvent(day, "accessibilityAction", {
      nativeEvent: { actionName: "nextWeek" },
    });
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 10, 10));
    await fireEvent(day, "accessibilityAction", {
      nativeEvent: { actionName: "previousWeek" },
    });
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 27));
  });

  it("names the actions in the app's language", async () => {
    const view = await draw({
      labels: { nextWeek: "Settimana dopo", previousWeek: "Settimana prima" },
    });
    expect(
      view
        .getAllByRole("button")[0]
        .props.accessibilityActions.map((a: { label: string }) => a.label),
    ).toEqual(["Settimana dopo", "Settimana prima"]);
  });

  it("fills the chosen day with the primary colour, or the brand gradient", async () => {
    const plain = await draw();
    const chosen = (view: Awaited<ReturnType<typeof draw>>) =>
      StyleSheet.flatten(
        view
          .getAllByRole("button")
          .find((b) => b.props.accessibilityState?.selected)!.props.style,
      );
    expect(chosen(plain).backgroundColor).toBeTruthy();
    const gradient = await draw({ gradient: true });
    expect(JSON.stringify(chosen(gradient))).toMatch(/linear-gradient/);
  });
});
