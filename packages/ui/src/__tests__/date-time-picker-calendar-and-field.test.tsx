import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { render, fireEvent, within } from "@testing-library/react-native";
import {
  DatePicker,
  DateRange,
  DateTimePicker,
  ThemeProvider,
  TimePicker,
} from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

type Screen = Awaited<ReturnType<typeof draw>>;
type Node = ReturnType<Screen["getByLabelText"]>;

/** What the calendar calls a day button, for the `en-US` locale. */
const dayLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(date);

const OPENED = new Date(2024, 2, 10, 14, 30);

describe("the calendar header", () => {
  const march = (extra: object = {}) =>
    draw(
      <DatePicker
        variant="static"
        locale="en-US"
        value={OPENED}
        onChange={() => {}}
        {...extra}
      />,
    );

  it("shows the month and the year in one control that opens the year grid", async () => {
    const screen = await march();
    // One text, not a month here and a year there.
    expect(screen.getAllByText("March 2024")).toHaveLength(1);
    const control = screen.getByLabelText("Select year");
    expect(within(control).getByText("March 2024")).toBeTruthy();

    await fireEvent.press(control);
    expect(screen.getByText("2024")).toBeTruthy();
    expect(screen.getByLabelText("Select year")).toBeExpanded();
    // The header stays on the same month while the years are shown.
    expect(screen.getByText("March 2024")).toBeTruthy();

    await fireEvent.press(screen.getByText("2027"));
    expect(screen.getByText("March 2027")).toBeTruthy();
    expect(screen.queryByText("2024")).toBeNull();
  });

  it("is not repeated above every month of the endless scroller", async () => {
    const screen = await march({ startYear: 2024, endYear: 2024 });
    expect(screen.queryAllByText(/\w+ 2024/)).toHaveLength(1);
  });

  it("follows the month the endless scroller is on", async () => {
    const screen = await march({
      startYear: 2024,
      endYear: 2024,
      testID: "cal",
    });
    const list = screen.getByTestId("cal-calendar-months");
    // Every month is six 40 px rows tall.
    const scrollTo = (month: number) =>
      fireEvent.scroll(list, {
        nativeEvent: {
          contentOffset: { x: 0, y: month * 240 },
          contentSize: { width: 280, height: 12 * 240 },
          layoutMeasurement: { width: 280, height: 240 },
        },
      });

    await scrollTo(5);
    expect(screen.getByText("June 2024")).toBeTruthy();
    await scrollTo(0);
    expect(screen.getByText("January 2024")).toBeTruthy();
  });

  it("follows the page of the paged calendar", async () => {
    const screen = await march({ scrollMode: "paged" });
    expect(screen.getByText("March 2024")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Next month"));
    expect(screen.getByText("April 2024")).toBeTruthy();
    expect(screen.queryByText("March 2024")).toBeNull();

    await fireEvent.press(screen.getByLabelText("Previous month"));
    await fireEvent.press(screen.getByLabelText("Previous month"));
    expect(screen.getByText("February 2024")).toBeTruthy();
  });

  it("is written in the locale's own order", async () => {
    const screen = await march({ locale: "ja-JP" });
    expect(screen.getByText("2024年3月")).toBeTruthy();
  });
});

describe("range preview", () => {
  const MARCH_10 = new Date(2024, 2, 10);
  const open: DateRange = { startDate: MARCH_10, endDate: null };
  /** A day of March 2024, where the open range sits; a `Date` is taken as it is. */
  const at = (day: number | Date) =>
    typeof day === "number" ? new Date(2024, 2, day) : day;

  const Range = ({
    initial = open,
    spy = jest.fn(),
    ...rest
  }: {
    initial?: DateRange;
    spy?: (range: DateRange) => void;
    isDateDisabled?: (date: Date) => boolean;
    variant?: "default" | "static";
    defaultOpen?: boolean;
  }) => {
    const [range, setRange] = useState(initial);
    return (
      <DatePicker
        locale="en-US"
        selectionMode="range"
        value={range}
        onChange={(next) => {
          spy(next);
          setRange(next);
        }}
        {...rest}
      />
    );
  };

  /** The fill behind a day: the band the range is drawn with, if it has one. */
  const band = (screen: Screen, day: number | Date) => {
    let node = screen.getByLabelText(dayLabel(at(day))).parent;
    while (node && !StyleSheet.flatten(node.props.style)?.flexWrap) {
      const style =
        typeof node.props.style === "function"
          ? undefined
          : StyleSheet.flatten(node.props.style);
      if (style?.backgroundColor) return style.backgroundColor as string;
      node = node.parent;
    }
    return undefined;
  };
  const hover = (screen: Screen, day: number | Date) =>
    fireEvent(screen.getByLabelText(dayLabel(at(day))), "hoverIn");
  const leave = (screen: Screen, day: number | Date) =>
    fireEvent(screen.getByLabelText(dayLabel(at(day))), "hoverOut");

  it("draws the stretch from the start to the day under the pointer", async () => {
    const spy = jest.fn();
    const screen = await draw(<Range variant="static" spy={spy} />);
    expect(band(screen, 12)).toBeUndefined();

    await hover(screen, 14);
    const preview = band(screen, 12);
    expect(preview).toBeTruthy();
    // Both ends and everything between, nothing beyond.
    expect(band(screen, 10)).toBe(preview);
    expect(band(screen, 11)).toBe(preview);
    expect(band(screen, 14)).toBe(preview);
    expect(band(screen, 15)).toBeUndefined();
    expect(band(screen, 9)).toBeUndefined();
    // Only drawn: nothing was chosen, nothing was reported.
    expect(spy).not.toHaveBeenCalled();
  });

  it("is lighter than the band of a finished range", async () => {
    const preview = await draw(<Range variant="static" />);
    await hover(preview, 14);
    const lighter = band(preview, 12)!;

    const done = await draw(
      <Range
        variant="static"
        initial={{ startDate: MARCH_10, endDate: at(14) }}
      />,
    );
    const real = band(done, 12)!;
    expect(real).toBeTruthy();
    expect(lighter).not.toBe(real);
    // The real colour, with alpha.
    expect(lighter).toMatch(/^rgba\(/);
  });

  it("works backwards, from a day before the start", async () => {
    const screen = await draw(<Range variant="static" />);
    await hover(screen, 6);
    expect(band(screen, 7)).toBeTruthy();
    expect(band(screen, 9)).toBe(band(screen, 7));
    expect(band(screen, 10)).toBe(band(screen, 7));
    expect(band(screen, 11)).toBeUndefined();
  });

  it("goes when the pointer leaves, and when the range is complete", async () => {
    const spy = jest.fn();
    const screen = await draw(<Range variant="static" spy={spy} />);

    await hover(screen, 14);
    expect(band(screen, 12)).toBeTruthy();
    await leave(screen, 14);
    expect(band(screen, 12)).toBeUndefined();

    await hover(screen, 14);
    await fireEvent.press(screen.getByLabelText(dayLabel(at(14))));
    expect(spy).toHaveBeenLastCalledWith({
      startDate: MARCH_10,
      endDate: at(14),
    });
    // Complete: the real band is there, and hovering elsewhere adds nothing to it.
    const real = band(screen, 12);
    expect(real).toBeTruthy();
    await hover(screen, 20);
    expect(band(screen, 18)).toBeUndefined();
    expect(band(screen, 12)).toBe(real);
  });

  it("previews nothing before the first day is chosen", async () => {
    const screen = await draw(
      <Range variant="static" initial={{ startDate: null, endDate: null }} />,
    );
    // Nothing is chosen, so the calendar is on the current month.
    const now = new Date();
    const thisMonth = (day: number) =>
      new Date(now.getFullYear(), now.getMonth(), day);
    await hover(screen, thisMonth(14));
    expect(band(screen, thisMonth(12))).toBeUndefined();
  });

  it("does not run to a disabled day", async () => {
    const screen = await draw(
      <Range
        variant="static"
        isDateDisabled={(date) => date.getDate() === 14}
      />,
    );
    await hover(screen, 14);
    expect(band(screen, 12)).toBeUndefined();
    await hover(screen, 13);
    expect(band(screen, 12)).toBeTruthy();
  });

  it("is there in the popup too", async () => {
    const spy = jest.fn();
    const screen = await draw(<Range defaultOpen spy={spy} />);
    await hover(screen, 13);
    expect(band(screen, 12)).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("fieldVariant", () => {
  /** The box the field draws: the nearest ancestor of `node` with the field's height. */
  const box = (node: Node) => {
    let current: { props: any; parent: any } | null = node;
    while (
      current &&
      StyleSheet.flatten(current.props.style)?.minHeight !== 52
    ) {
      current = current.parent;
    }
    return StyleSheet.flatten(current!.props.style);
  };

  const fields = {
    "typed date": (extra = {}) => (
      <DatePicker
        locale="en-US"
        value={OPENED}
        onChange={() => {}}
        {...extra}
      />
    ),
    "date button": (extra = {}) => (
      <DatePicker
        locale="en-US"
        inputEnabled={false}
        label="Day"
        value={OPENED}
        onChange={() => {}}
        {...extra}
      />
    ),
    "time button": (extra = {}) => (
      <TimePicker
        locale="en-US"
        label="Time"
        value={OPENED}
        onChange={() => {}}
        {...extra}
      />
    ),
    "datetime button": (extra = {}) => (
      <DateTimePicker
        locale="en-US"
        mode="datetime"
        label="Both"
        value={OPENED}
        onChange={() => {}}
        {...extra}
      />
    ),
  };
  type Name = keyof typeof fields;
  const labelOf: Record<Exclude<Name, "typed date">, string> = {
    "date button": "Day",
    "time button": "Time",
    "datetime button": "Both",
  };
  const fieldOf = (screen: Screen, name: Name) =>
    name === "typed date"
      ? screen.getByPlaceholderText("MM/DD/YYYY")
      : screen.getByLabelText(labelOf[name]);

  it.each(Object.keys(fields) as Name[])(
    "%s: outlined by default, a tinted box with no border when filled",
    async (name) => {
      const outlined = await draw(fields[name]());
      const plain = box(fieldOf(outlined, name));
      expect(plain.borderColor).not.toBe("transparent");

      const explicit = await draw(fields[name]({ fieldVariant: "outlined" }));
      expect(box(fieldOf(explicit, name))).toEqual(plain);

      const filled = await draw(fields[name]({ fieldVariant: "filled" }));
      const tinted = box(fieldOf(filled, name));
      expect(tinted.borderColor).toBe("transparent");
      expect(tinted.backgroundColor).not.toBe(plain.backgroundColor);
    },
  );

  it("shows its border while the picker is open, or in error", async () => {
    const open = await draw(
      fields["date button"]({ fieldVariant: "filled", defaultOpen: true }),
    );
    expect(box(fieldOf(open, "date button")).borderColor).not.toBe(
      "transparent",
    );

    const failed = await draw(
      fields["time button"]({ fieldVariant: "filled", error: "Too late" }),
    );
    expect(box(fieldOf(failed, "time button")).borderColor).not.toBe(
      "transparent",
    );
  });

  it("changes nothing in a static picker, which has no field", async () => {
    const screen = await draw(
      <DatePicker
        variant="static"
        fieldVariant="filled"
        locale="en-US"
        value={OPENED}
        onChange={() => {}}
      />,
    );
    expect(screen.queryByLabelText("Open picker")).toBeNull();
    expect(screen.getByLabelText(dayLabel(OPENED))).toBeTruthy();
  });
});
