import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, act } from "@testing-library/react-native";
import {
  CheckboxGroup,
  NumberField,
  PinInput,
  SearchBar,
  Select,
  Switch,
  ThemeProvider,
} from "..";
import { FIELD_MIN_WIDTH } from "../components/internal/fieldWidth";

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const json = (view: { toJSON: () => unknown }) => JSON.stringify(view.toJSON());

describe("Select", () => {
  const options = [
    { id: "1", label: "Uno", value: 1 },
    { id: "2", label: "Due", value: 2 },
    { id: "3", label: "Tre", value: 3 },
  ];
  type Props = Partial<React.ComponentProps<typeof Select>>;
  const draw = (props: Props = {}) =>
    wrap(
      <Select
        label="Numero"
        options={options}
        value={null}
        onChange={() => {}}
        {...props}
      />,
    );

  it("reports the picked value through onChange", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await draw({ onChange, defaultOpen: true });
    await fireEvent.press(getByLabelText("Due"));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  describe("nullable", () => {
    it("clears from a button in the field while an option is selected", async () => {
      const onChange = jest.fn();
      const { getByLabelText } = await draw({
        value: 1,
        nullable: true,
        onChange,
      });
      await fireEvent.press(getByLabelText("Clear selection"));
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("clears by pressing the selected option again", async () => {
      const onChange = jest.fn();
      const { getAllByLabelText } = await draw({
        value: 1,
        nullable: true,
        defaultOpen: true,
        onChange,
      });
      // The field is labelled "Uno" too once selected; the option comes last.
      await fireEvent.press(getAllByLabelText("Uno").at(-1)!);
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("still picks the other options", async () => {
      const onChange = jest.fn();
      const { getByLabelText } = await draw({
        value: 1,
        nullable: true,
        defaultOpen: true,
        onChange,
      });
      await fireEvent.press(getByLabelText("Tre"));
      expect(onChange).toHaveBeenCalledWith(3);
    });

    it("has no clear button with nothing selected, or when it is off", async () => {
      const { queryByLabelText, unmount } = await draw({ nullable: true });
      expect(queryByLabelText("Clear selection")).toBeNull();
      await unmount();
      const off = await draw({ value: 1 });
      expect(off.queryByLabelText("Clear selection")).toBeNull();
    });

    it("keeps pressing the selected option a plain pick when it is off", async () => {
      const onChange = jest.fn();
      const { getAllByLabelText } = await draw({
        value: 1,
        defaultOpen: true,
        onChange,
      });
      // The field's own label is "Uno" too once selected; the option is last.
      await fireEvent.press(getAllByLabelText("Uno").at(-1)!);
      expect(onChange).toHaveBeenCalledWith(1);
    });
  });

  describe("emptyMessage", () => {
    it('says "No options" by default when there are none', async () => {
      const { getByText } = await draw({ options: [], defaultOpen: true });
      expect(getByText("No options")).toBeTruthy();
    });

    it("takes a custom message, and is absent when there are options", async () => {
      const empty = await draw({
        options: [],
        emptyMessage: "Niente",
        defaultOpen: true,
      });
      expect(empty.getByText("Niente")).toBeTruthy();
      await empty.unmount();
      const full = await draw({ defaultOpen: true });
      expect(full.queryByText("No options")).toBeNull();
    });
  });

  describe("disabledOptions", () => {
    const state = (node: { props: object }) =>
      (node.props as { accessibilityState: unknown }).accessibilityState;

    it("disables the listed values: visible, announced, not selectable", async () => {
      const onChange = jest.fn();
      const { getByLabelText } = await draw({
        disabledOptions: [2],
        defaultOpen: true,
        onChange,
      });
      expect(state(getByLabelText("Due"))).toMatchObject({ disabled: true });
      expect(state(getByLabelText("Uno"))).toMatchObject({ disabled: false });
      await fireEvent.press(getByLabelText("Due"));
      expect(onChange).not.toHaveBeenCalled();
      await fireEvent.press(getByLabelText("Uno"));
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it("matches a pattern against String(value), whatever its flags", async () => {
      const onChange = jest.fn();
      const { getByLabelText } = await draw({
        disabledOptions: /^[23]$/g,
        defaultOpen: true,
        onChange,
      });
      expect(state(getByLabelText("Uno"))).toMatchObject({ disabled: false });
      expect(state(getByLabelText("Due"))).toMatchObject({ disabled: true });
      expect(state(getByLabelText("Tre"))).toMatchObject({ disabled: true });
      await fireEvent.press(getByLabelText("Tre"));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("multiple", () => {
    // Each row is an option and a checkbox carrying the same label.
    const row = (
      view: { getAllByLabelText: (l: string) => any[] },
      l: string,
    ) => view.getAllByLabelText(l);

    it("toggles values through toggleOptions and keeps the list open", async () => {
      const toggleOptions = jest.fn();
      const view = await draw({
        multiple: true,
        selectedValues: [1],
        toggleOptions,
        defaultOpen: true,
      });
      await fireEvent.press(row(view, "Due")[0]);
      expect(toggleOptions).toHaveBeenLastCalledWith([1, 2]);
      await fireEvent.press(row(view, "Uno")[1]);
      expect(toggleOptions).toHaveBeenLastCalledWith([]);
      expect(row(view, "Tre")).toHaveLength(2);
    });

    it("does not toggle a disabled option, from the row or its checkbox", async () => {
      const toggleOptions = jest.fn();
      const view = await draw({
        multiple: true,
        selectedValues: [],
        toggleOptions,
        disabledOptions: [3],
        defaultOpen: true,
      });
      const [outer, checkbox] = row(view, "Tre");
      expect(outer.props.accessibilityState).toMatchObject({ disabled: true });
      expect(checkbox.props.accessibilityState).toMatchObject({
        disabled: true,
      });
      await fireEvent.press(outer);
      await fireEvent.press(checkbox);
      expect(toggleOptions).not.toHaveBeenCalled();
    });
  });

  describe("layout", () => {
    it("fills its container by default and shrinks with fullWidth={false}", async () => {
      expect(json(await draw())).toContain('"width":"100%"');
      const narrow = json(await draw({ fullWidth: false }));
      expect(narrow).not.toContain('"width":"100%"');
      expect(narrow).toContain(`"minWidth":${FIELD_MIN_WIDTH}`);
    });

    it("keeps the label above the box in either variant, and moves it inside on request", async () => {
      const margin = async (props: Props) =>
        JSON.stringify(
          (await draw(props)).getByText("Numero").props.style,
        ).includes("marginBottom");
      expect(await margin({})).toBe(true);
      expect(await margin({ variant: "filled" })).toBe(true);
      expect(await margin({ labelPlacement: "inside" })).toBe(false);
      expect(
        await margin({ variant: "filled", labelPlacement: "inside" }),
      ).toBe(false);
    });
  });

  it("draws a filled box with no border until it is open or in error, like PinInput's cells", async () => {
    const transparent = async (props: Props) =>
      (json(await draw(props)).match(/"borderColor":"transparent"/g) ?? [])
        .length;
    const outlined = await transparent({});
    expect(await transparent({ variant: "filled" })).toBe(outlined + 1);
    expect(await transparent({ variant: "filled", error: "No" })).toBe(
      outlined,
    );
  });
});

describe("CheckboxGroup", () => {
  const options = [
    { label: "Email", value: "email" },
    { label: "SMS", value: "sms" },
    { label: "Push", value: "push", disabled: true },
  ];
  type Props = Partial<React.ComponentProps<typeof CheckboxGroup>>;
  const draw = (props: Props = {}) =>
    wrap(
      <CheckboxGroup
        label="Notify me by"
        options={options}
        value={["email"]}
        onChange={() => {}}
        {...props}
      />,
    );

  it("checks what is in value", async () => {
    const { getByLabelText } = await draw();
    expect(getByLabelText("Email").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(getByLabelText("SMS").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("adds a value when an unchecked option is pressed and removes it when a checked one is", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await draw({ onChange });
    await fireEvent.press(getByLabelText("SMS"));
    expect(onChange).toHaveBeenLastCalledWith(["email", "sms"]);
    await fireEvent.press(getByLabelText("Email"));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("disables one option, or the whole group", async () => {
    const onChange = jest.fn();
    const { getByLabelText, rerender } = await draw({ onChange });
    await fireEvent.press(getByLabelText("Push"));
    expect(onChange).not.toHaveBeenCalled();

    await rerender(
      <ThemeProvider>
        <CheckboxGroup
          options={options}
          value={[]}
          onChange={onChange}
          disabled
        />
      </ThemeProvider>,
    );
    await fireEvent.press(getByLabelText("Email"));
    expect(onChange).not.toHaveBeenCalled();
    expect(getByLabelText("Email").props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("stacks the options by default and lays them in a row on request", async () => {
    const group = (view: { getByLabelText: (l: string) => { props: any } }) =>
      view.getByLabelText("Notify me by").props.style;
    expect(group(await draw())).toMatchObject({ flexDirection: "column" });
    expect(group(await draw({ direction: "row" }))).toMatchObject({
      flexDirection: "row",
      flexWrap: "wrap",
    });
  });

  it("is a labelled group, with the helper text, the asterisk and the error", async () => {
    const { getByLabelText, getByText, queryByText, rerender } = await draw({
      helperText: "Pick any",
      required: true,
    });
    expect(getByLabelText("Notify me by").props.role).toBe("group");
    expect(getByText("Notify me by *")).toBeTruthy();
    expect(getByText("Pick any")).toBeTruthy();

    await rerender(
      <ThemeProvider>
        <CheckboxGroup
          label="Notify me by"
          options={options}
          value={[]}
          onChange={() => {}}
          helperText="Pick any"
          error="Choose one"
        />
      </ThemeProvider>,
    );
    expect(getByText("Choose one")).toBeTruthy();
    expect(queryByText("Pick any")).toBeNull();
  });
});

describe("Switch", () => {
  // Frozen timers: the thumb's animation would otherwise land after the test.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("toggles from the switch itself", async () => {
    const onChange = jest.fn();
    const { getByRole } = await wrap(
      <Switch value={false} onChange={onChange} />,
    );
    await fireEvent.press(getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles from its label too, and reports the state to assistive tech", async () => {
    const onChange = jest.fn();
    const { getByText, getByRole } = await wrap(
      <Switch value label="Wi-Fi" onChange={onChange} />,
    );
    expect(getByRole("switch").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(getByRole("switch").props.accessibilityLabel).toBe("Wi-Fi");
    await fireEvent.press(getByText("Wi-Fi"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("does not toggle while disabled, from the label either", async () => {
    const onChange = jest.fn();
    const { getByText } = await wrap(
      <Switch value={false} label="Wi-Fi" disabled onChange={onChange} />,
    );
    await fireEvent.press(getByText("Wi-Fi"));
    expect(onChange).not.toHaveBeenCalled();
  });

  describe("labelPlacement", () => {
    const layout = async (
      labelPlacement?: "start" | "end" | "top" | "bottom",
    ) => {
      const view = await wrap(
        <Switch
          value={false}
          label="Wi-Fi"
          labelPlacement={labelPlacement}
          onChange={() => {}}
        />,
      );
      const root = view.toJSON() as any;
      return {
        direction: StyleSheet.flatten(root.props.style).flexDirection as string,
        labelFirst: root.children[0].type === "Text",
      };
    };

    it("puts the label after the switch by default", async () => {
      expect(await layout()).toEqual({ direction: "row", labelFirst: false });
      expect(await layout("end")).toEqual({
        direction: "row",
        labelFirst: false,
      });
    });

    it("moves it before the switch, or stacks it above or below", async () => {
      expect(await layout("start")).toEqual({
        direction: "row",
        labelFirst: true,
      });
      expect(await layout("top")).toEqual({
        direction: "column",
        labelFirst: true,
      });
      expect(await layout("bottom")).toEqual({
        direction: "column",
        labelFirst: false,
      });
    });
  });

  describe("size", () => {
    const track = async (props: Partial<React.ComponentProps<typeof Switch>>) =>
      json(await wrap(<Switch value={false} onChange={() => {}} {...props} />));

    it("is 32 x 18 by default, like the old Toggle", async () => {
      const medium = await track({});
      expect(medium).toContain('"width":32');
      expect(medium).toContain('"height":18');
      expect(await track({ size: "medium" })).toBe(medium);
    });

    it("scales down to small and up to large", async () => {
      const small = await track({ size: "small" });
      expect(small).toContain('"width":24');
      expect(small).toContain('"height":14');
      const large = await track({ size: "large" });
      expect(large).toContain('"width":40');
      expect(large).toContain('"height":22');
    });

    it("lets width and height override the size", async () => {
      const custom = await track({ size: "small", width: 50, height: 28 });
      expect(custom).toContain('"width":50');
      expect(custom).toContain('"height":28');
      expect(custom).not.toContain('"width":24');
    });
  });
});

describe("NumberField", () => {
  it("steps the value with the buttons", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await wrap(
      <NumberField label="Qty" value={5} step={2} onChange={onChange} />,
    );
    await fireEvent.press(getByLabelText("Increment Qty"));
    expect(onChange).toHaveBeenLastCalledWith(7);
    await fireEvent.press(getByLabelText("Decrement Qty"));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });
});

describe("SearchBar", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const advance = (ms: number) =>
    act(async () => {
      jest.advanceTimersByTime(ms);
    });

  type Props = Partial<React.ComponentProps<typeof SearchBar>>;
  const ui = (props: Props = {}) => (
    <ThemeProvider>
      <SearchBar value="" onChange={() => {}} {...props} />
    </ThemeProvider>
  );

  it("lets the input shrink, so a narrow bar keeps its clear button inside", async () => {
    // A text input will not go below its own width in a flex row unless it is
    // told it may: in a 230px sidebar the clear button was pushed out of the bar.
    const { getByLabelText } = await render(ui({ value: "abc" }));
    expect(
      StyleSheet.flatten(getByLabelText("Search").props.style),
    ).toMatchObject({
      flex: 1,
      minWidth: 0,
    });
  });

  it("reports every keystroke at once by default", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(ui({ onChange }));
    await fireEvent.changeText(getByLabelText("Search"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  describe("debounceTime", () => {
    it("updates the field at once and reports once typing pauses", async () => {
      const onChange = jest.fn();
      const { getByLabelText } = await render(
        ui({ onChange, debounceTime: 300 }),
      );
      const input = getByLabelText("Search");
      await fireEvent.changeText(input, "a");
      await fireEvent.changeText(input, "ab");
      expect(getByLabelText("Search").props.value).toBe("ab");
      expect(onChange).not.toHaveBeenCalled();
      await advance(299);
      expect(onChange).not.toHaveBeenCalled();
      await advance(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("ab");
    });

    it("lets a value set from outside win over the text and the pending report", async () => {
      const onChange = jest.fn();
      const { getByLabelText, rerender } = await render(
        ui({ onChange, debounceTime: 300 }),
      );
      await fireEvent.changeText(getByLabelText("Search"), "ab");
      await rerender(ui({ onChange, debounceTime: 300, value: "reset" }));
      expect(getByLabelText("Search").props.value).toBe("reset");
      await advance(1000);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("flushes on submit: the text is reported, then submitted, once", async () => {
      const calls: string[] = [];
      const { getByLabelText } = await render(
        ui({
          debounceTime: 300,
          onChange: (text) => calls.push(`change:${text}`),
          onSubmit: (text) => calls.push(`submit:${text}`),
        }),
      );
      const input = getByLabelText("Search");
      await fireEvent.changeText(input, "ab");
      await fireEvent(input, "submitEditing");
      expect(calls).toEqual(["change:ab", "submit:ab"]);
      await advance(1000);
      expect(calls).toHaveLength(2);
    });

    it("clears at once and drops what was pending", async () => {
      const onChange = jest.fn();
      const onClear = jest.fn();
      const { getByLabelText } = await render(
        ui({ onChange, onClear, debounceTime: 300 }),
      );
      await fireEvent.changeText(getByLabelText("Search"), "ab");
      await fireEvent.press(getByLabelText("Clear search"));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("");
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(getByLabelText("Search").props.value).toBe("");
      await advance(1000);
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("showLoading", () => {
    it("shows a progress indicator in place of the clear button", async () => {
      const { queryByLabelText, queryByRole } = await render(
        ui({ value: "milan", showLoading: true }),
      );
      expect(queryByRole("progressbar")).toBeTruthy();
      expect(queryByLabelText("Clear search")).toBeNull();
    });

    it("keeps the clear button when nothing is loading", async () => {
      const { queryByLabelText, queryByRole } = await render(
        ui({ value: "milan" }),
      );
      expect(queryByRole("progressbar")).toBeNull();
      expect(queryByLabelText("Clear search")).toBeTruthy();
    });
  });

  it("draws the glyph named by icon, magnify by default", async () => {
    const glyph = async (props: Props) => {
      const view = await render(ui(props));
      return json(view);
    };
    const byDefault = await glyph({});
    expect(await glyph({ icon: "magnify" })).toBe(byDefault);
    expect(await glyph({ icon: "account" })).not.toBe(byDefault);
  });
});

describe("PinInput", () => {
  const cells = (view: { toJSON: () => unknown }) =>
    (json(view).match(/"borderColor":"transparent"/g) ?? []).length;

  it("reports the whole code through onChange", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await wrap(
      <PinInput length={4} label="Code" value="12" onChange={onChange} />,
    );
    await fireEvent.changeText(getByLabelText("Code 3/4"), "3");
    expect(onChange).toHaveBeenLastCalledWith("123");
  });

  it("is outlined by default: bordered cells on the surface", async () => {
    const outlined = await wrap(
      <PinInput length={4} value="" onChange={() => {}} />,
    );
    expect(cells(outlined)).toBe(0);
    const explicit = await wrap(
      <PinInput length={4} value="" onChange={() => {}} variant="outlined" />,
    );
    expect(json(explicit)).toBe(json(outlined));
  });

  it("draws filled cells without a border until one is focused or in error", async () => {
    const view = await wrap(
      <PinInput length={4} value="" onChange={() => {}} variant="filled" />,
    );
    expect(cells(view)).toBe(4);
    await fireEvent(view.getByLabelText("Code 1/4"), "focus");
    expect(cells(view)).toBe(3);

    const failed = await wrap(
      <PinInput
        length={4}
        value=""
        onChange={() => {}}
        variant="filled"
        error="Wrong code"
      />,
    );
    expect(cells(failed)).toBe(0);
  });
});
