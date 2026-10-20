import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { render, fireEvent, within } from "@testing-library/react-native";
import {
  DatePicker,
  DateRange,
  DateTimePicker,
  EMPTY_RANGE,
  ThemeProvider,
  TimePicker,
} from "..";
import { addDays, startOfDay } from "../components/DateTimePicker.shared";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

type Screen = Awaited<ReturnType<typeof draw>>;

/** What the calendar calls a day button, for the `en-US` locale. */
const dayLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(date);

const OPENED = new Date(2024, 2, 10, 14, 30);
const MARCH_15 = new Date(2024, 2, 15);
const MARCH_16 = new Date(2024, 2, 16);

/** A picker that keeps the value it is given, the way a screen would. */
const Live = ({
  initial,
  spy,
  variant,
  mode,
  ...rest
}: {
  initial: Date | null;
  spy: (date: Date) => void;
  variant?: "default" | "static";
  mode: "date" | "time" | "datetime";
  defaultOpen?: boolean;
  showToday?: boolean;
  validRange?: { startDate: Date };
}) => {
  const [value, setValue] = useState<Date | null>(initial);
  const onChange = (date: Date) => {
    spy(date);
    setValue(date);
  };
  const common = { variant, locale: "en-US", value, onChange, ...rest };
  if (mode === "date") return <DatePicker {...common} />;
  if (mode === "time") return <TimePicker {...common} />;
  return <DateTimePicker {...common} mode="datetime" />;
};

/** Every button the old footer and header carried, now gone. */
const expectNoRemovedChrome = (screen: Screen) => {
  expect(screen.queryByText("Cancel")).toBeNull();
  expect(screen.queryByText("Next")).toBeNull();
  expect(screen.queryByLabelText("Switch to text input")).toBeNull();
  expect(screen.queryByLabelText("Switch to calendar")).toBeNull();
  expect(screen.queryByLabelText("Switch to clock")).toBeNull();
};

describe('variant="static"', () => {
  it("DatePicker is the calendar inline: a day reports at once, no field, no OK", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <Live mode="date" variant="static" initial={OPENED} spy={spy} />,
    );

    expect(screen.queryByLabelText("Open picker")).toBeNull();
    expect(screen.queryByText("OK")).toBeNull();
    expectNoRemovedChrome(screen);
    expect(spy).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText(dayLabel(MARCH_15)));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(MARCH_15);

    // Still on screen, and the live value moved to the new day.
    await fireEvent.press(screen.getByLabelText(dayLabel(MARCH_16)));
    expect(spy).toHaveBeenLastCalledWith(MARCH_16);
    expect(screen.getByLabelText(dayLabel(MARCH_16))).toBeSelected();
  });

  it("DatePicker range reports every tap through onChange, partial ranges included", async () => {
    const spy = jest.fn();
    const Range = () => {
      const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
      return (
        <DatePicker
          variant="static"
          locale="en-US"
          selectionMode="range"
          value={range}
          onChange={(next) => {
            spy(next);
            setRange(next);
          }}
        />
      );
    };
    const screen = await draw(<Range />);

    const today = startOfDay(new Date());

    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith({ startDate: today, endDate: null });

    // The second tap closes the range, and reports it without an OK.
    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith({ startDate: today, endDate: today });
    expect(screen.queryByText("OK")).toBeNull();
  });

  it("DatePicker multiple reports the whole set on every tap", async () => {
    const spy = jest.fn();
    const Multiple = () => {
      const [dates, setDates] = useState<Date[]>([]);
      return (
        <DatePicker
          variant="static"
          locale="en-US"
          selectionMode="multiple"
          value={dates}
          onChange={(next) => {
            spy(next);
            setDates(next);
          }}
        />
      );
    };
    const screen = await draw(<Multiple />);
    const today = startOfDay(new Date());

    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    expect(spy).toHaveBeenLastCalledWith([today]);
    // A second tap on the same day takes it out again.
    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    expect(spy).toHaveBeenLastCalledWith([]);
  });

  it("TimePicker is the clock inline and reports each change", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <Live mode="time" variant="static" initial={OPENED} spy={spy} />,
    );

    expect(screen.queryByLabelText("Open picker")).toBeNull();
    expect(screen.queryByText("OK")).toBeNull();
    expect(screen.getByLabelText("Hours")).toBeTruthy();

    // 14:30 is PM; AM keeps the minutes and moves the hour back by twelve.
    await fireEvent.press(screen.getByLabelText("AM"));
    expect(spy).toHaveBeenCalledTimes(1);
    const next: Date = spy.mock.calls[0][0];
    expect([next.getHours(), next.getMinutes()]).toEqual([2, 30]);
  });

  it("DateTimePicker shows the date step, then the time step, reporting live", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <Live mode="datetime" variant="static" initial={OPENED} spy={spy} />,
    );

    expect(screen.queryByText("OK")).toBeNull();
    expect(screen.queryByLabelText("Hours")).toBeNull();

    // A day tap reports the new day with the time kept, and moves to the clock.
    await fireEvent.press(screen.getByLabelText(dayLabel(MARCH_15)));
    expect(spy).toHaveBeenLastCalledWith(new Date(2024, 2, 15, 14, 30));
    expect(screen.getByLabelText("Hours")).toBeTruthy();
    expect(screen.queryByLabelText("Previous month")).toBeNull();

    await fireEvent.press(screen.getByLabelText("AM"));
    expect(spy).toHaveBeenLastCalledWith(new Date(2024, 2, 15, 2, 30));
    expect(screen.queryByText("OK")).toBeNull();
    expectNoRemovedChrome(screen);

    // The date readout is the way back to the calendar.
    await fireEvent.press(screen.getByText(/Mar 15/));
    expect(screen.getByLabelText("Previous month")).toBeTruthy();
    expect(screen.queryByLabelText("Hours")).toBeNull();
  });

  it("is greyed out and inert when disabled", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <DatePicker
        variant="static"
        locale="en-US"
        disabled
        value={OPENED}
        onChange={spy}
        testID="cal"
      />,
    );
    const root = screen.getByTestId("cal");
    expect(root.props.pointerEvents).toBe("none");
    expect(StyleSheet.flatten(root.props.style).opacity).toBe(0.38);
  });
});

describe("the popup surface", () => {
  it("a single date settles on the day tap: no OK, and the dialog closes", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <Live mode="date" initial={OPENED} spy={spy} defaultOpen />,
    );

    expect(screen.queryByText("OK")).toBeNull();
    expectNoRemovedChrome(screen);

    await fireEvent.press(screen.getByLabelText(dayLabel(MARCH_15)));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(MARCH_15);
    expect(screen.queryByLabelText("Previous month")).toBeNull();
  });

  it("datetime switches to the time step on a date tap, then confirms with OK", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <Live mode="datetime" initial={OPENED} spy={spy} defaultOpen />,
    );

    // The calendar step has no Next and no OK: the tap is the way on.
    expect(screen.getByLabelText("Previous month")).toBeTruthy();
    expect(screen.queryByText("OK")).toBeNull();
    expectNoRemovedChrome(screen);

    await fireEvent.press(screen.getByLabelText(dayLabel(MARCH_15)));
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Hours")).toBeTruthy();
    expect(screen.queryByLabelText("Previous month")).toBeNull();
    expect(screen.getByText("OK")).toBeTruthy();
    expectNoRemovedChrome(screen);

    await fireEvent.press(screen.getByLabelText("AM"));
    await fireEvent.press(screen.getByText("OK"));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(new Date(2024, 2, 15, 2, 30));
    expect(screen.queryByText("OK")).toBeNull();
  });

  it("datetime goes back to the calendar by tapping the date readout", async () => {
    const screen = await draw(
      <Live mode="datetime" initial={OPENED} spy={jest.fn()} defaultOpen />,
    );
    await fireEvent.press(screen.getByLabelText(dayLabel(MARCH_15)));
    expect(screen.queryByLabelText("Previous month")).toBeNull();

    await fireEvent.press(screen.getByText(/Mar 15/));
    expect(screen.getByLabelText("Previous month")).toBeTruthy();
    // Back on the date step there is nothing to confirm yet.
    expect(screen.queryByText("OK")).toBeNull();
  });

  it("time keeps its single OK", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <Live mode="time" initial={OPENED} spy={spy} defaultOpen />,
    );
    expectNoRemovedChrome(screen);

    await fireEvent.press(screen.getByLabelText("AM"));
    expect(spy).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("OK"));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("range keeps its OK, which waits for both ends and then reports", async () => {
    const spy = jest.fn();
    const Range = () => {
      const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
      return (
        <DatePicker
          locale="en-US"
          defaultOpen
          selectionMode="range"
          value={range}
          onChange={(next) => {
            spy(next);
            setRange(next);
          }}
        />
      );
    };
    const screen = await draw(<Range />);
    const today = startOfDay(new Date());
    expectNoRemovedChrome(screen);

    // Nothing to confirm until the range has two ends.
    expect(screen.getByText("OK")).toBeDisabled();
    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    expect(screen.getByText("OK")).toBeDisabled();
    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    await fireEvent.press(screen.getByText("OK"));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ startDate: today, endDate: today });
  });

  it("multiple keeps its OK, which reports the whole set", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <DatePicker
        locale="en-US"
        defaultOpen
        selectionMode="multiple"
        value={[]}
        onChange={spy}
      />,
    );
    const today = startOfDay(new Date());
    expectNoRemovedChrome(screen);

    expect(screen.getByText("OK")).toBeDisabled();
    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    expect(spy).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("OK"));
    expect(spy).toHaveBeenCalledWith([today]);
  });

  it("is dismissed by tapping outside, without reporting anything", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <Live mode="datetime" initial={OPENED} spy={spy} defaultOpen />,
    );
    await fireEvent.press(screen.getByLabelText("Close picker"));
    expect(screen.queryByLabelText("Previous month")).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("typed entry, now only reachable through defaultInputType, still needs OK", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <DatePicker
        locale="it-IT"
        defaultOpen
        inputEnabled={false}
        defaultInputType="keyboard"
        value={null}
        onChange={spy}
      />,
    );
    expectNoRemovedChrome(screen);
    await fireEvent.changeText(
      screen.getByPlaceholderText("DD/MM/YYYY"),
      "15/03/2024",
    );
    expect(spy).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("OK"));
    expect(spy).toHaveBeenCalledWith(MARCH_15);
  });
});

describe("Today in the calendar controls", () => {
  const todayButton = (screen: Screen) => {
    let node = screen.getByText("Today");
    while (node.props.accessibilityRole !== "button" && node.parent) {
      node = node.parent;
    }
    return node;
  };

  it("sits beside the month arrows, as an outlined button, and not in a footer row", async () => {
    const screen = await draw(
      <Live mode="date" variant="static" initial={OPENED} spy={jest.fn()} />,
    );
    expect(screen.getAllByText("Today")).toHaveLength(1);

    // The arrows and Today share one controls row.
    const controls = screen.getByLabelText("Next month").parent!;
    expect(within(controls).getByText("Today")).toBeTruthy();
    expect(within(controls).getByLabelText("Previous month")).toBeTruthy();

    // Outlined: a hairline in the outline colour over a transparent fill.
    const style = StyleSheet.flatten(todayButton(screen).props.style);
    expect(style.borderWidth).toBe(1);
    expect(style.backgroundColor).toBe("transparent");
  });

  it("selects today", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <Live mode="date" variant="static" initial={OPENED} spy={spy} />,
    );
    await fireEvent.press(screen.getByText("Today"));
    expect(spy).toHaveBeenCalledWith(startOfDay(new Date()));
  });

  it("is disabled while today is outside validRange", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <Live
        mode="date"
        variant="static"
        initial={null}
        spy={spy}
        validRange={{ startDate: addDays(new Date(), 2) }}
      />,
    );
    expect(todayButton(screen)).toBeDisabled();
    await fireEvent.press(screen.getByText("Today"));
    expect(spy).not.toHaveBeenCalled();
  });

  it("goes away with showToday={false}", async () => {
    const screen = await draw(
      <Live
        mode="date"
        variant="static"
        initial={OPENED}
        spy={jest.fn()}
        showToday={false}
      />,
    );
    expect(screen.queryByText("Today")).toBeNull();
    expect(screen.getByLabelText("Next month")).toBeTruthy();
  });

  it("takes the label from labels.today", async () => {
    const screen = await draw(
      <DatePicker
        variant="static"
        locale="en-US"
        labels={{ today: "Oggi" }}
        value={OPENED}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("Oggi")).toBeTruthy();
    expect(screen.queryByText("Today")).toBeNull();
  });
});
