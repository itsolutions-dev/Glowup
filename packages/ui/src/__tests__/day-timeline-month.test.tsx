import React from "react";
import { ScrollView, View } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { DayTimeline, PortalHost, ThemeProvider } from "..";
import type { DayTimelineEvent, DayTimelineProps } from "..";

const at = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m);
const event = (id: number, day: number, h: number): DayTimelineEvent => ({
  id,
  title: `Cliente ${id}`,
  start: at(day, h),
  end: at(day, h, 30),
});
// Four on the 4th, one canceled on the 5th.
const EVENTS = [
  event(4, 4, 15),
  event(1, 4, 9),
  event(2, 4, 10),
  event(3, 4, 11),
  { ...event(5, 5, 9), canceled: true },
];

const RECTS: Record<string, [number, number, number, number]> = {
  "m-day-2026-11-4": [100, 100, 100, 112],
  "m-day-2026-11-5": [200, 100, 100, 112],
  "m-event-1": [104, 130, 92, 16],
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
          layout="month"
          month={at(15, 0)}
          events={EVENTS}
          locale="it-IT"
          firstDayOfWeek={1}
          testID="m"
          {...props}
        />
      </PortalHost>
    </ThemeProvider>,
  );

describe("DayTimeline month", () => {
  it("draws the month's weeks from the first day of the week", async () => {
    const view = await draw();
    expect(view.getByText("lun")).toBeTruthy();
    expect(view.getByText("dom")).toBeTruthy();
    // From Monday 26 October to Sunday 6 December.
    expect(view.getByTestId("m-day-2026-10-26")).toBeTruthy();
    expect(view.getByTestId("m-day-2026-12-6")).toBeTruthy();
    expect(view.queryByTestId("m-day-2026-12-7")).toBeNull();
  });

  it("shows a day's first events by start, and +N for the rest", async () => {
    const view = await draw({ labels: { more: (n) => `+${n} altri` } });
    const day = view.getByTestId("m-day-2026-11-4");
    expect(day).toHaveTextContent(
      /09:00 Cliente 1.*10:00 Cliente 2.*11:00 Cliente 3.*\+1 altri/,
    );
    expect(day).not.toHaveTextContent(/Cliente 4/);
  });

  it("opens every event of the day from +N, and reports the one pressed", async () => {
    const onEventPress = jest.fn();
    const view = await draw({ onEventPress, maxPerDay: 2 });
    await fireEvent.press(view.getByText("+2 more"));
    expect(view.getByText("mercoledì 4 novembre 2026")).toBeTruthy();
    await fireEvent.press(view.getAllByLabelText(/Cliente 4/)[0]);
    expect(onEventPress).toHaveBeenCalledWith(EVENTS[0]);
  });

  it("strikes a canceled event through and says so", async () => {
    const view = await draw({ labels: { canceled: "annullato" } });
    expect(
      view.getByLabelText("Cliente 5, 09:00 – 09:30, annullato"),
    ).toBeTruthy();
  });

  it("reports a press on a day's number and on its empty part", async () => {
    const onDayPress = jest.fn();
    const onSlotPress = jest.fn();
    const view = await draw({ onDayPress, onSlotPress, startHour: 9 });
    await fireEvent.press(view.getByLabelText("giovedì 5 novembre 2026"));
    expect(onDayPress).toHaveBeenCalledWith(at(5, 0));
    await fireEvent.press(view.getByTestId("m-empty-2026-11-6"));
    expect(onSlotPress).toHaveBeenCalledWith(at(6, 9));
  });

  it("moves a dragged event to another day at the same time", async () => {
    const onEventChange = jest.fn();
    const view = await draw({ onEventChange });
    const chip = view.getByTestId("m-event-1");
    chip.props.onStartShouldSetResponderCapture(point(110, 135));
    expect(chip.props.onStartShouldSetResponder(point(110, 135))).toBe(true);
    await fireEvent(chip, "responderGrant", point(110, 135));
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    await fireEvent(chip, "responderMove", point(210, 135));
    await fireEvent(chip, "responderRelease", point(210, 135));
    expect(onEventChange).toHaveBeenCalledWith(EVENTS[1], {
      start: at(5, 9),
      end: at(5, 9, 30),
    });
  });
});
