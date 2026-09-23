import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { Button, ProgressButton, ThemeProvider } from "../index";

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("Button busy", () => {
  it("blocks presses and reports busy while keeping its label", async () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = await wrap(
      <Button busy onPress={onPress}>
        Send
      </Button>,
    );

    // `loading` swaps the label for a spinner; `busy` must not.
    expect(getByText("Send")).toBeTruthy();
    const button = getByRole("button");
    expect(button.props.accessibilityState).toMatchObject({ busy: true });
    // Busy is not disabled: it must stay in the tab order and read as working.
    expect(button.props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("ProgressButton", () => {
  it("shows the idle label and fires onPress", async () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = await wrap(
      <ProgressButton iconName="navigation-variant" onPress={onPress}>
        Start navigation
      </ProgressButton>,
    );

    expect(getByText("Start navigation")).toBeTruthy();
    await fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is busy while loading, and names its progress", async () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = await wrap(
      <ProgressButton
        status="loading"
        progress={0.42}
        loadingLabel="Calculating route…"
        onPress={onPress}
      >
        Start navigation
      </ProgressButton>,
    );

    expect(getByText("Calculating route…")).toBeTruthy();
    const button = getByRole("button");
    expect(button.props.accessibilityState).toMatchObject({ busy: true });
    expect(button.props.accessibilityLabel).toBe("Calculating route…, 42%");

    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("keeps the idle label and drops the percentage when indeterminate", async () => {
    const { getByRole } = await wrap(
      <ProgressButton status="loading">Upload</ProgressButton>,
    );
    expect(getByRole("button").props.accessibilityLabel).toBe("Upload");
  });

  it("keeps its inner bar out of the accessibility tree", async () => {
    const { queryByRole } = await wrap(
      <ProgressButton status="loading" progress={0.5} indicator="bar">
        Upload
      </ProgressButton>,
    );
    // The button carries the value in its name; a nested progressbar would
    // be a second stop for a screen reader inside one control.
    expect(queryByRole("progressbar")).toBeNull();
  });

  it("turns to success and hands back after successDuration", async () => {
    jest.useFakeTimers();
    try {
      const onSuccessEnd = jest.fn();
      const { getByText } = await wrap(
        <ProgressButton
          status="success"
          successLabel="Route ready"
          successDuration={1500}
          onSuccessEnd={onSuccessEnd}
        >
          Start navigation
        </ProgressButton>,
      );

      expect(getByText("Route ready")).toBeTruthy();
      await act(async () => {
        jest.advanceTimersByTime(1499);
      });
      expect(onSuccessEnd).not.toHaveBeenCalled();
      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(onSuccessEnd).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("stays pressable on error, so the task can be retried", async () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = await wrap(
      <ProgressButton status="error" onPress={onPress}>
        Start navigation
      </ProgressButton>,
    );

    expect(getByText("Try again")).toBeTruthy();
    const button = getByRole("button");
    expect(button.props.accessibilityState).toMatchObject({ busy: false });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("animates through a status change without losing the label", async () => {
    const { getByText, rerender } = await wrap(
      <ProgressButton status="loading" progress={0.9}>
        Save
      </ProgressButton>,
    );
    await rerender(
      <ThemeProvider>
        <ProgressButton status="success">Save</ProgressButton>
      </ThemeProvider>,
    );
    expect(getByText("Done")).toBeTruthy();
  });
});
