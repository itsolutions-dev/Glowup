import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Autocomplete, ThemeProvider } from "..";
import type { AutocompleteOption } from "..";

const MILANO: AutocompleteOption = { id: "1", label: "Milano", value: "MI" };
const MODENA: AutocompleteOption = { id: "2", label: "Modena", value: "MO" };

const draw = (props: Partial<React.ComponentProps<typeof Autocomplete>>) =>
  render(
    <ThemeProvider>
      <Autocomplete
        label="Città"
        value=""
        options={[MILANO, MODENA]}
        onChangeText={() => {}}
        onSelect={() => {}}
        {...props}
      />
    </ThemeProvider>,
  );

describe("Autocomplete onSearch", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("searches once, after the typing pauses, with the last text", async () => {
    const onSearch = jest.fn();
    const { getByLabelText } = await draw({ onSearch, debounceMs: 300 });
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
          onChangeText={() => {}}
          onSelect={() => {}}
          onSelectedChange={onSelectedChange}
        />
      </ThemeProvider>,
    );
    await fireEvent.changeText(getByLabelText("Città"), "Modena nord");
    expect(onSelectedChange).toHaveBeenLastCalledWith(null);
  });
});

describe("Autocomplete allowCustomValue", () => {
  const blurWith = async (
    props: Partial<React.ComponentProps<typeof Autocomplete>>,
  ) => {
    const onChangeText = jest.fn();
    const { getByLabelText } = await draw({ onChangeText, ...props });
    await fireEvent(getByLabelText("Città"), "focus");
    await fireEvent(getByLabelText("Città"), "blur");
    return onChangeText;
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
