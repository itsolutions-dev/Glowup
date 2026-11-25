import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { DayTimeline, PortalHost, ThemeProvider } from "..";
import type { DayTimelineEvent, DayTimelineProps } from "..";

const at = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m);
const MON = at(2, 0);
const TUE = at(3, 0);

const VISIT: DayTimelineEvent = {
  id: 1,
  title: "Mario Rossi",
  start: at(2, 9),
  end: at(2, 9, 30),
  overline: "Appuntamento",
  color: "#1D5B9D",
};
const OVERLAP: DayTimelineEvent = {
  id: 2,
  title: "Anna Bianchi",
  start: at(2, 9, 15),
  end: at(2, 10),
};
const LATER: DayTimelineEvent = {
  id: 3,
  title: "Luca Verdi",
  start: at(3, 14),
  end: at(3, 14, 10),
};

// The test renderer cannot measure: each view's window rect comes from its testID.
// Hours from 8 at 48 dp: 9:00 is 48 dp down; the columns start after the 48 dp gutter.
const RECTS: Record<string, [number, number, number, number]> = {
  tl: [0, 0, 300, 600],
  "tl-day-0": [48, 0, 100, 576],
  "tl-day-1": [148, 0, 100, 576],
  "tl-event-1": [48, 48, 50, 24],
};

beforeEach(() => {
  jest.useFakeTimers();
  for (const component of [View, ScrollView])
    jest
      .spyOn(component.prototype as any, "measureInWindow")
      .mockImplementation(function (this: any, cb: any) {
        cb(...(RECTS[this.props?.testID] ?? [0, 0, 0, 0]));
      });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const point = (x: number, y: number) => ({
  nativeEvent: { pageX: x, pageY: y },
});

const draw = (props: Partial<DayTimelineProps> = {}) =>
  render(
    <ThemeProvider>
      <PortalHost>
        <DayTimeline
          layout="grid"
          days={[MON, TUE]}
          events={[VISIT, OVERLAP, LATER]}
          locale="it-IT"
          testID="tl"
          {...props}
        />
      </PortalHost>
    </ThemeProvider>,
  );

describe("DayTimeline grid", () => {
  it("draws the hours, a heading per day and each event on its day", async () => {
    const view = await draw({ onEventPress: () => {} });
    expect(view.getByText("08:00")).toBeTruthy();
    expect(view.getByText("19:00")).toBeTruthy();
    expect(view.queryByText("20:00")).toBeNull();
    expect(view.getByText("lun")).toBeTruthy();
    expect(view.getByText("mar")).toBeTruthy();
    expect(view.getByTestId("tl-day-0")).toHaveTextContent(
      /Mario Rossi.*Anna Bianchi/,
    );
    expect(view.getByTestId("tl-day-1")).toHaveTextContent(/Luca Verdi/);
  });

  it("places an event by its time and puts overlapping ones side by side", async () => {
    const view = await draw();
    const first = StyleSheet.flatten(view.getByTestId("tl-slot-1").props.style);
    const second = StyleSheet.flatten(
      view.getByTestId("tl-slot-2").props.style,
    );
    expect(first).toMatchObject({
      top: 48,
      height: 24,
      left: "0%",
      width: "50%",
    });
    expect(second).toMatchObject({
      top: 60,
      height: 36,
      left: "50%",
      width: "50%",
    });
    // Ten minutes still get a readable card, and the whole width.
    expect(
      StyleSheet.flatten(view.getByTestId("tl-slot-3").props.style),
    ).toMatchObject({ height: 20, width: "100%" });
  });

  it("reports the pressed event", async () => {
    const onEventPress = jest.fn();
    const view = await draw({ onEventPress });
    await fireEvent.press(view.getByLabelText(/Luca Verdi/));
    expect(onEventPress).toHaveBeenCalledWith(LATER);
  });

  it("reports a press on an empty slot, at the step it falls in", async () => {
    const onSlotPress = jest.fn();
    const view = await draw({ onSlotPress });
    // 100 dp down is 10:05: the 10:00 slot.
    await fireEvent.press(view.getByTestId("tl-empty-1"), {
      nativeEvent: { locationY: 100 },
    });
    expect(onSlotPress).toHaveBeenCalledWith(at(3, 10));
  });

  it("reports a press on a day's heading", async () => {
    const onDayPress = jest.fn();
    const view = await draw({ onDayPress });
    await fireEvent.press(view.getByLabelText(/martedì 3 novembre 2026/));
    expect(onDayPress).toHaveBeenCalledWith(TUE);
  });

  it("moves a dragged event to the day and time it is dropped on, keeping its length", async () => {
    const onEventChange = jest.fn();
    const view = await draw({ onEventChange });
    const card = view.getByTestId("tl-event-1");
    card.props.onStartShouldSetResponderCapture(point(60, 60));
    expect(card.props.onStartShouldSetResponder(point(60, 60))).toBe(true);
    await fireEvent(card, "responderGrant", point(60, 60));
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    // 100 dp right and 48 down: Tuesday, an hour later.
    await fireEvent(card, "responderMove", point(160, 108));
    await fireEvent(card, "responderRelease", point(160, 108));
    expect(onEventChange).toHaveBeenCalledWith(VISIT, {
      start: at(3, 10),
      end: at(3, 10, 30),
    });
  });

  it("resizes an event from its foot, snapped to the step", async () => {
    const onEventChange = jest.fn();
    const view = await draw({ onEventChange, resizable: true });
    const foot = view.getByTestId("tl-resize-1");
    await fireEvent(foot, "responderGrant", { nativeEvent: { pageY: 72 } });
    await fireEvent(foot, "responderMove", { nativeEvent: { pageY: 98 } });
    // Half an hour longer while the foot is held.
    expect(
      StyleSheet.flatten(view.getByTestId("tl-slot-1").props.style).height,
    ).toBe(48);
    await fireEvent(foot, "responderRelease", { nativeEvent: { pageY: 98 } });
    expect(onEventChange).toHaveBeenCalledWith(VISIT, {
      start: VISIT.start,
      end: at(2, 10),
    });
  });

  it("lets a screen reader lengthen or shorten an event by a step", async () => {
    const onEventChange = jest.fn();
    const view = await draw({
      onEventChange,
      resizable: true,
      labels: { resize: "Cambia la fine" },
    });
    const foot = view.getByLabelText("Cambia la fine, Anna Bianchi");
    await fireEvent(foot, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(onEventChange).toHaveBeenCalledWith(OVERLAP, {
      start: OVERLAP.start,
      end: at(2, 10, 30),
    });
  });

  it("has no handles and no dragging without onEventChange", async () => {
    const view = await draw({ resizable: true });
    expect(view.queryByTestId("tl-resize-1")).toBeNull();
    expect(
      view.getByTestId("tl-event-1").props.onStartShouldSetResponderCapture,
    ).toBeUndefined();
  });
});
