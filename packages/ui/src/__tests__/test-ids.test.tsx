import React from "react";
import { Text } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import {
  Card,
  Chip,
  Paper,
  Select,
  SpeedDial,
  Switch,
  ThemeProvider,
} from "..";

// End-to-end checks find controls by testID (P12 in docs/crm-proposals.md): each
// lands on the element a test presses, not on a wrapper around it.
const wrap = (node: React.ReactElement) => (
  <ThemeProvider>{node}</ThemeProvider>
);

describe("testID", () => {
  it("is on Paper's surface", async () => {
    await render(
      wrap(
        <Paper testID="panel">
          <Text>Body</Text>
        </Paper>,
      ),
    );
    expect(screen.getByTestId("panel")).toBeTruthy();
  });

  it("is on a Card's pressable area", async () => {
    const onClick = jest.fn();
    await render(
      wrap(
        <Card testID="card" onClick={onClick}>
          <Text>Body</Text>
        </Card>,
      ),
    );
    await fireEvent.press(screen.getByTestId("card"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is on a Chip's body, and on its close button with -close", async () => {
    const onClick = jest.fn();
    const onClose = jest.fn();
    await render(
      wrap(
        <Chip
          testID="tag"
          label="Urgent"
          onClick={onClick}
          onClose={onClose}
        />,
      ),
    );
    await fireEvent.press(screen.getByTestId("tag"));
    await fireEvent.press(screen.getByTestId("tag-close"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is on a Switch's toggle", async () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    await render(
      wrap(<Switch testID="notify" value={false} onChange={onChange} />),
    );
    await fireEvent.press(screen.getByTestId("notify"));
    expect(onChange).toHaveBeenCalledWith(true);
    // The press animation settles before the test ends.
    await act(async () => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });

  it("is on a Select's field, and on each option with -option-<value>", async () => {
    const onChange = jest.fn();
    await render(
      wrap(
        <Select
          testID="kind"
          label="Kind"
          options={[
            { label: "Email", value: "email" },
            { label: "Phone", value: "phone" },
          ]}
          value={null}
          onChange={onChange}
        />,
      ),
    );
    await fireEvent.press(screen.getByTestId("kind"));
    await fireEvent.press(screen.getByTestId("kind-option-phone"));
    expect(onChange).toHaveBeenCalledWith("phone");
  });

  it("is on a SpeedDial's trigger and on each action", async () => {
    jest.useFakeTimers();
    const onPress = jest.fn();
    await render(
      wrap(
        <SpeedDial
          testID="dial"
          mainIcon="plus"
          actions={[
            {
              id: 1,
              label: "Call",
              icon: "phone",
              onPress,
              testID: "dial-call",
            },
          ]}
        />,
      ),
    );
    await fireEvent.press(screen.getByTestId("dial"));
    await fireEvent.press(screen.getByTestId("dial-call"));
    expect(onPress).toHaveBeenCalledTimes(1);
    // The actions' spring settles before the test ends.
    await act(async () => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });
});
