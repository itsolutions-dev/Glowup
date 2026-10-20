import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Autocomplete, ThemeProvider } from "..";
import type {
  AutocompleteMultipleProps,
  AutocompleteOption,
  AutocompleteSingleProps,
} from "..";

const MILANO: AutocompleteOption = { id: "1", label: "Milano", value: "MI" };
const MODENA: AutocompleteOption = { id: "2", label: "Modena", value: "MO" };

type Props = Partial<AutocompleteSingleProps>;
type MultipleProps = Partial<AutocompleteMultipleProps> & { multiple: true };

const draw = (props: Props | MultipleProps) =>
  render(
    <ThemeProvider>
      <Autocomplete
        label="Città"
        value=""
        options={[MILANO, MODENA]}
        onChange={() => {}}
        {...props}
      />
    </ThemeProvider>,
  );

describe("Autocomplete onSearch", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("searches once, after the typing pauses, with the last text", async () => {
    const onSearch = jest.fn();
    const { getByLabelText } = await draw({ onSearch, debounce: 300 });
    const input = getByLabelText("Città");
    await fireEvent.changeText(input, "mi");
    await fireEvent.changeText(input, "mil");
    expect(onSearch).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("mil");
  });

  it("waits for minChars", async () => {
    const onSearch = jest.fn();
    const { getByLabelText } = await draw({ onSearch, minChars: 2 });
    await fireEvent.changeText(getByLabelText("Città"), "M");
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("drops a pending search when an option is chosen: its label is not a query", async () => {
    const onSearch = jest.fn();
    const { getByLabelText, getByText } = await draw({
      onSearch,
      value: "Mi",
      options: [MILANO],
    });
    const input = getByLabelText("Città");
    await fireEvent(input, "focus");
    await fireEvent.changeText(input, "Mi");
    await fireEvent.press(getByText("Milano"));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("waits 300 ms by default and honours a shorter debounce", async () => {
    const wait = async (props: Props, ms: number) => {
      const onSearch = jest.fn();
      const { getByLabelText } = await draw({ onSearch, ...props });
      await fireEvent.changeText(getByLabelText("Città"), "mi");
      await act(async () => {
        jest.advanceTimersByTime(ms);
      });
      return onSearch;
    };
    expect(await wait({}, 299)).not.toHaveBeenCalled();
    expect(await wait({}, 300)).toHaveBeenCalledWith("mi");
    expect(await wait({ debounce: 50 }, 49)).not.toHaveBeenCalled();
    expect(await wait({ debounce: 50 }, 50)).toHaveBeenCalledWith("mi");
  });

  it("shows what the server returned, without filtering it again by label", async () => {
    const { getByLabelText, queryByText } = await draw({
      onSearch: () => {},
      value: "xyz",
      options: [MILANO, MODENA],
    });
    await fireEvent(getByLabelText("Città"), "focus");
    expect(queryByText("Milano")).toBeTruthy();
    expect(queryByText("Modena")).toBeTruthy();
  });
});

describe("Autocomplete selected", () => {
  it("reports the chosen option, and null when the text moves away from it", async () => {
    const onSelectedChange = jest.fn();
    const { getByLabelText, getByText, rerender } = await draw({
      value: "M",
      onSelectedChange,
    });
    await fireEvent(getByLabelText("Città"), "focus");
    await fireEvent.press(getByText("Modena"));
    expect(onSelectedChange).toHaveBeenLastCalledWith(MODENA);

    await rerender(
      <ThemeProvider>
        <Autocomplete
          label="Città"
          value="Modena"
          selected={MODENA}
          options={[MILANO, MODENA]}
          onChange={() => {}}
          onSelectedChange={onSelectedChange}
        />
      </ThemeProvider>,
    );
    await fireEvent.changeText(getByLabelText("Città"), "Modena nord");
    expect(onSelectedChange).toHaveBeenLastCalledWith(null);
  });
});

describe("Autocomplete allowCustomValue", () => {
  const blurWith = async (props: Props) => {
    const onChange = jest.fn();
    const { getByLabelText } = await draw({ onChange, ...props });
    await fireEvent(getByLabelText("Città"), "focus");
    await fireEvent(getByLabelText("Città"), "blur");
    return onChange;
  };

  it("keeps free text by default", async () => {
    expect(await blurWith({ value: "Roma" })).not.toHaveBeenCalled();
  });

  it("empties text that is not an option when it is switched off", async () => {
    expect(
      await blurWith({ value: "Roma", allowCustomValue: false }),
    ).toHaveBeenCalledWith("");
  });

  it("puts back the chosen label, and leaves an exact option alone", async () => {
    expect(
      await blurWith({
        value: "Mod",
        selected: MODENA,
        allowCustomValue: false,
      }),
    ).toHaveBeenCalledWith("Modena");
    expect(
      await blurWith({ value: "Milano", allowCustomValue: false }),
    ).not.toHaveBeenCalled();
  });
});

describe("Autocomplete defaultOptions", () => {
  it("offers them before anything is typed, and the options once there is a query", async () => {
    const { getByLabelText, queryByText, rerender } = await draw({
      defaultOptions: [MILANO],
    });
    await fireEvent(getByLabelText("Città"), "focus");
    expect(queryByText("Milano")).toBeTruthy();
    expect(queryByText("Modena")).toBeNull();

    await rerender(
      <ThemeProvider>
        <Autocomplete
          label="Città"
          value="Mo"
          options={[MILANO, MODENA]}
          defaultOptions={[MILANO]}
          onChange={() => {}}
        />
      </ThemeProvider>,
    );
    expect(queryByText("Modena")).toBeTruthy();
    expect(queryByText("Milano")).toBeNull();
  });

  it("keeps the list closed on an empty field when there are none", async () => {
    const { getByLabelText, queryByText } = await draw({});
    await fireEvent(getByLabelText("Città"), "focus");
    expect(queryByText("Milano")).toBeNull();
  });
});

describe("Autocomplete multiple", () => {
  it("shows the chosen options as chips that remove themselves", async () => {
    const onSelectedChange = jest.fn();
    const { getByLabelText } = await draw({
      multiple: true,
      selected: [MILANO, MODENA],
      onSelectedChange,
    });
    await fireEvent.press(getByLabelText("Close Milano"));
    expect(onSelectedChange).toHaveBeenLastCalledWith([MODENA]);
  });

  it("adds a picked option, clears the text and reports the whole set", async () => {
    const onChange = jest.fn();
    const onSelectedChange = jest.fn();
    const { getByLabelText, getByText } = await draw({
      multiple: true,
      value: "M",
      selected: [MILANO],
      onChange,
      onSelectedChange,
    });
    await fireEvent(getByLabelText("Città"), "focus");
    await fireEvent.press(getByText("Modena"));
    expect(onSelectedChange).toHaveBeenLastCalledWith([MILANO, MODENA]);
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("toggles: picking a chosen option removes it, and the list marks it", async () => {
    const onSelectedChange = jest.fn();
    const { getByLabelText, getAllByRole } = await draw({
      multiple: true,
      value: "M",
      selected: [MILANO],
      onSelectedChange,
    });
    await fireEvent(getByLabelText("Città"), "focus");
    const [milano, modena] = getAllByRole("menuitem");
    expect(milano.props.accessibilityState).toMatchObject({ checked: true });
    expect(modena.props.accessibilityState).toMatchObject({ checked: false });
    await fireEvent.press(milano);
    expect(onSelectedChange).toHaveBeenLastCalledWith([]);
  });

  it("keeps its own chips when selected is not passed", async () => {
    const { getByLabelText, getByText } = await draw({
      multiple: true,
      value: "M",
    });
    await fireEvent(getByLabelText("Città"), "focus");
    await fireEvent.press(getByText("Modena"));
    expect(getByLabelText("Close Modena")).toBeTruthy();
  });

  it("empties the text on blur when allowCustomValue is off", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await draw({
      multiple: true,
      value: "Rom",
      allowCustomValue: false,
      onChange,
    });
    await fireEvent(getByLabelText("Città"), "focus");
    await fireEvent(getByLabelText("Città"), "blur");
    expect(onChange).toHaveBeenCalledWith("");
  });
});

describe("Autocomplete single mode onSelectedChange", () => {
  it("fires on every pick with the option, and keeps the text as the label", async () => {
    const onSelectedChange = jest.fn();
    const onChange = jest.fn();
    const { getByLabelText, getByText } = await draw({
      value: "M",
      onChange,
      onSelectedChange,
    });
    await fireEvent(getByLabelText("Città"), "focus");
    await fireEvent.press(getByText("Milano"));
    expect(onSelectedChange).toHaveBeenCalledTimes(1);
    expect(onSelectedChange).toHaveBeenCalledWith(MILANO);
    expect(onChange).toHaveBeenLastCalledWith("Milano");
  });
});

describe("Autocomplete layout", () => {
  const json = async (props: Props) =>
    JSON.stringify((await draw(props)).toJSON());

  it("stretches by default and shrinks with fullWidth={false}", async () => {
    expect(await json({})).toContain('"width":"100%"');
    const narrow = await json({ fullWidth: false });
    expect(narrow).not.toContain('"width":"100%"');
    expect(narrow).toContain('"alignSelf":"flex-start"');
  });

  it("keeps the label above the field whatever the variant, and moves it inside on request", async () => {
    const labelStyle = async (props: Props) => {
      const { getByText } = await draw(props);
      return JSON.stringify(getByText("Città").props.style);
    };
    // The outside label carries a bottom margin, the inside one none.
    expect(await labelStyle({})).toContain("marginBottom");
    expect(await labelStyle({ variant: "filled" })).toContain("marginBottom");
    expect(await labelStyle({ labelPlacement: "inside" })).not.toContain(
      "marginBottom",
    );
    expect(
      await labelStyle({ variant: "filled", labelPlacement: "inside" }),
    ).not.toContain("marginBottom");
  });

  it("draws a filled box with no border until it is focused or in error, like PinInput's cells", async () => {
    const view = async (props: Props) => {
      const drawn = await draw(props);
      const count = () =>
        (
          JSON.stringify(drawn.toJSON()).match(
            /"borderColor":"transparent"/g,
          ) ?? []
        ).length;
      return { count, field: drawn.getByLabelText("Città") };
    };
    const outlined = (await view({})).count();
    const filled = await view({ variant: "filled" });
    expect(filled.count()).toBe(outlined + 1);
    await fireEvent(filled.field, "focus");
    expect(filled.count()).toBe(outlined);
    expect((await view({ variant: "filled", error: "No" })).count()).toBe(
      outlined,
    );
  });
});
