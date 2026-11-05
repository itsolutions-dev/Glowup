import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { DayTimeline, ThemeProvider, toneFromColor } from "..";
import type { DayTimelineEvent } from "..";

const at = (h: number, m = 0) => new Date(2026, 10, 4, h, m);

const VISIT: DayTimelineEvent = {
  id: 1,
  title: "Mario Rossi",
  start: at(9),
  end: at(9, 30),
  overline: "Appuntamento",
  note: "Studio",
  color: "#1D5B9D",
};
const RECALL: DayTimelineEvent = {
  id: 2,
  title: "Anna Bianchi",
  start: at(11),
  end: at(11, 15),
  overline: "Richiamo",
};

const draw = (props: Partial<React.ComponentProps<typeof DayTimeline>> = {}) =>
  render(
    <ThemeProvider>
      <DayTimeline events={[VISIT]} onEventPress={() => {}} {...props} />
    </ThemeProvider>,
  );

describe("DayTimeline", () => {
  it("orders the events by start", async () => {
    const view = await draw({ events: [RECALL, VISIT] });
    const labels = view
      .getAllByRole("button")
      .map((b) => b.props.accessibilityLabel);
    expect(labels).toEqual([
      "Appuntamento, Mario Rossi, 09:00 – 09:30, Studio",
      "Richiamo, Anna Bianchi, 11:00 – 11:15",
    ]);
  });

  it("shows the time, the overline, the title and start – end · note", async () => {
    const view = await draw();
    expect(view.getByText("09:00")).toBeTruthy();
    expect(view.getByText("Appuntamento")).toBeTruthy();
    expect(view.getByText("Mario Rossi")).toBeTruthy();
    expect(view.getByText("09:00 – 09:30 · Studio")).toBeTruthy();
  });

  it("reports the pressed event", async () => {
    const onEventPress = jest.fn();
    const view = await draw({ onEventPress });
    await fireEvent.press(view.getByRole("button"));
    expect(onEventPress).toHaveBeenCalledWith(VISIT);
  });

  it("is not a button without onEventPress", async () => {
    const view = await draw({ onEventPress: undefined });
    expect(view.queryByRole("button")).toBeNull();
    expect(view.getByLabelText(/Mario Rossi/)).toBeTruthy();
  });

  it("tints the card from color", async () => {
    const view = await draw();
    const style = StyleSheet.flatten(view.getByRole("button").props.style);
    expect(style.backgroundColor).toBe(
      toneFromColor("#1D5B9D", "light").background,
    );
  });

  it("falls back to the theme's colour for a colour that is not #RRGGBB", async () => {
    const view = await draw({ events: [{ ...VISIT, color: "red" }] });
    const style = StyleSheet.flatten(view.getByRole("button").props.style);
    expect(style.backgroundColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(style.borderStartColor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("strikes a canceled event through", async () => {
    const view = await draw({
      events: [{ ...VISIT, canceled: true }],
      labels: { canceled: "annullato" },
    });
    const title = StyleSheet.flatten(view.getByText("Mario Rossi").props.style);
    expect(title.textDecorationLine).toBe("line-through");
    expect(view.getByRole("button").props.accessibilityLabel).toBe(
      "Appuntamento, Mario Rossi, 09:00 – 09:30, Studio, annullato",
    );
  });

  it("shows the skeleton while loading", async () => {
    const view = await draw({ loading: true });
    expect(view.getByLabelText("Loading")).toBeTruthy();
    expect(view.queryByText("Mario Rossi")).toBeNull();
  });

  it("shows the empty state", async () => {
    const empty = await draw({ events: [] });
    expect(empty.getByText("Nothing scheduled")).toBeTruthy();
    const custom = await draw({
      events: [],
      emptyState: { title: "Nessun impegno" },
    });
    expect(custom.getByText("Nessun impegno")).toBeTruthy();
  });
});
