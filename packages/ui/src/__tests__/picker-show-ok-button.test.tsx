import React, { useState } from "react";
import { render, fireEvent } from "@testing-library/react-native";
import {
  DatePicker,
  DateRange,
  DateTimePicker,
  EMPTY_RANGE,
  ThemeProvider,
  TimePicker,
} from "..";
import { startOfDay } from "../components/DateTimePicker.shared";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

type Screen = Awaited<ReturnType<typeof draw>>;

const dayLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(date);

const OPENED = new Date(2024, 2, 10, 14, 30);
const MARCH_15 = new Date(2024, 2, 15);

// The dial is 256 px wide and its numbers sit on a 100 px circle: these are the
// 3, 6 and 9 o'clock positions, i.e. hour 3 / 6 / 9 and minute 15 / 30 / 45.
const THREE = { locationX: 128 + 100, locationY: 128 };
const NINE = { locationX: 128 - 100, locationY: 128 };

/** A press on the dial: the finger goes down, the point is read, it lifts. */
const tapDial = async (
  screen: Screen,
  at: { locationX: number; locationY: number },
) => {
  // A static picker has no popup around it, hence no "-surface" in its ids.
  const dial =
    screen.queryByTestId("p-surface-clock-dial") ??
    screen.getByTestId("p-clock-dial");
  await fireEvent(dial, "responderGrant", { nativeEvent: at });
  await fireEvent(dial, "responderRelease");
};

const Time = ({
  spy,
  ...rest
}: {
  spy: (date: Date) => void;
  showOkButton?: boolean;
  variant?: "static";
}) => {
  const [value, setValue] = useState<Date | null>(OPENED);
  return (
    <TimePicker
      testID="p"
      locale="en-US"
      defaultOpen
      value={value}
      onChange={(next) => {
        spy(next);
        setValue(next);
      }}
      {...rest}
    />
  );
};

describe("showOkButton on TimePicker", () => {
  it("false: the minute sets the value and closes, with no OK", async () => {
    const spy = jest.fn();
    const screen = await draw(<Time spy={spy} showOkButton={false} />);
    expect(screen.queryByText("OK")).toBeNull();

    await tapDial(screen, THREE); // the hour
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Hours")).toBeTruthy();

    await tapDial(screen, NINE); // the minute
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(new Date(2024, 2, 10, 15, 45));
    expect(screen.queryByLabelText("Hours")).toBeNull();
  });

  it("default: stays open after the minute and waits for OK", async () => {
    const spy = jest.fn();
    const screen = await draw(<Time spy={spy} />);

    await tapDial(screen, THREE);
    await tapDial(screen, NINE);
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Hours")).toBeTruthy();

    await fireEvent.press(screen.getByText("OK"));
    expect(spy).toHaveBeenCalledWith(new Date(2024, 2, 10, 15, 45));
    expect(screen.queryByLabelText("Hours")).toBeNull();
  });

  it("does nothing on a static picker, which reports every change", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <Time spy={spy} showOkButton={false} variant="static" />,
    );
    await tapDial(screen, THREE);
    expect(spy).toHaveBeenCalledWith(new Date(2024, 2, 10, 15, 30));
    expect(screen.getByLabelText("Hours")).toBeTruthy();
  });
});

describe("showOkButton on DateTimePicker", () => {
  it("false: the day, the hour and the minute set the value and close", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <DateTimePicker
        testID="p"
        mode="datetime"
        locale="en-US"
        defaultOpen
        showOkButton={false}
        value={OPENED}
        onChange={spy}
      />,
    );
    expect(screen.queryByText("OK")).toBeNull();

    await fireEvent.press(screen.getByLabelText(dayLabel(MARCH_15)));
    expect(screen.queryByText("OK")).toBeNull();
    await tapDial(screen, THREE);
    expect(spy).not.toHaveBeenCalled();
    await tapDial(screen, NINE);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(new Date(2024, 2, 15, 15, 45));
    expect(screen.queryByLabelText("Hours")).toBeNull();
  });

  it("default: the clock step still needs OK", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <DateTimePicker
        testID="p"
        mode="datetime"
        locale="en-US"
        defaultOpen
        value={OPENED}
        onChange={spy}
      />,
    );
    await fireEvent.press(screen.getByLabelText(dayLabel(MARCH_15)));
    await tapDial(screen, THREE);
    await tapDial(screen, NINE);
    expect(spy).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("OK"));
    expect(spy).toHaveBeenCalledWith(new Date(2024, 2, 15, 15, 45));
  });
});

describe("showOkButton on DatePicker", () => {
  const Range = ({
    spy,
    showOkButton,
  }: {
    spy: (range: DateRange) => void;
    showOkButton?: boolean;
  }) => {
    const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
    return (
      <DatePicker
        locale="en-US"
        defaultOpen
        selectionMode="range"
        showOkButton={showOkButton}
        value={range}
        onChange={(next) => {
          spy(next);
          setRange(next);
        }}
      />
    );
  };
  const today = startOfDay(new Date());

  it("false: a range closes on its second end, with no OK", async () => {
    const spy = jest.fn();
    const screen = await draw(<Range spy={spy} showOkButton={false} />);
    expect(screen.queryByText("OK")).toBeNull();

    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Previous month")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ startDate: today, endDate: today });
    expect(screen.queryByLabelText("Previous month")).toBeNull();
  });

  it("default: a range waits for OK", async () => {
    const spy = jest.fn();
    const screen = await draw(<Range spy={spy} />);
    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    expect(spy).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("OK"));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("false: a set of days cannot know it is finished, so OK stays", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <DatePicker
        locale="en-US"
        defaultOpen
        selectionMode="multiple"
        showOkButton={false}
        value={[]}
        onChange={spy}
      />,
    );
    await fireEvent.press(screen.getByLabelText(dayLabel(today)));
    expect(spy).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("OK"));
    expect(spy).toHaveBeenCalledWith([today]);
  });

  it("false: typed entry keeps its OK", async () => {
    const spy = jest.fn();
    const screen = await draw(
      <DatePicker
        locale="it-IT"
        defaultOpen
        inputEnabled={false}
        defaultInputType="keyboard"
        showOkButton={false}
        value={null}
        onChange={spy}
      />,
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("DD/MM/YYYY"),
      "15/03/2024",
    );
    await fireEvent.press(screen.getByText("OK"));
    expect(spy).toHaveBeenCalledWith(MARCH_15);
  });
});
