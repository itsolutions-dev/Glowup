import React, { useState } from "react";
import { DeviceEventEmitter, Platform, StyleSheet, View } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { Autocomplete, PortalHost, ThemeProvider } from "..";

// On a phone the suggestions are drawn under the field, measured against the
// whole window. With the keyboard open the bottom of that window is behind the
// keyboard, so a field in the lower half had its suggestions hidden (1.6 of the
// plan). The room below is now what the keyboard leaves.
const proto = (View as unknown as { prototype: Record<string, any> }).prototype;
const original = proto.measureInWindow;
// The field low on a 1334-high window (the test renderer's): 470 free below it.
beforeEach(() => {
  proto.measureInWindow = (cb: (...rect: number[]) => void) =>
    cb(16, 800, 340, 56);
});
afterEach(() => {
  proto.measureInWindow = original;
});

const City = () => {
  const [text, setText] = useState("");
  return (
    <Autocomplete
      label="City"
      value={text}
      options={["Milano", "Modena", "Monza", "Mantova"].map((label) => ({
        id: label,
        label,
        value: label,
      }))}
      onChange={setText}
    />
  );
};

const draw = () =>
  render(
    <ThemeProvider>
      <PortalHost>
        <City />
      </PortalHost>
    </ThemeProvider>,
  );
type Screen = Awaited<ReturnType<typeof draw>>;

const open = async (screen: Screen) => {
  const field = screen.getByLabelText("City");
  await fireEvent(field, "focus");
  await fireEvent.changeText(field, "M");
};
const listStyle = (screen: Screen) =>
  StyleSheet.flatten(
    screen.container.queryAll((n) => n.props.role === "list")[0].props.style,
  ) as Record<string, unknown>;

const showKeyboard = (height: number) =>
  act(() => {
    DeviceEventEmitter.emit(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      { endCoordinates: { height, screenY: 1334 - height } },
    );
  });

describe("Autocomplete's suggestions with the keyboard open", () => {
  it("open under the field while there is room", async () => {
    const screen = await draw();
    await open(screen);
    expect(listStyle(screen).top).toBe(800 + 56 + 4);
  });

  it("move above the field when the keyboard takes the room below", async () => {
    const screen = await draw();
    await open(screen);
    await showKeyboard(420);
    const style = listStyle(screen);
    expect(style.top).toBeUndefined();
    expect(style.bottom).toBe(1334 - 800 + 4);
  });

  it("stay under it, shorter, when the keyboard leaves some room", async () => {
    const screen = await draw();
    await open(screen);
    await showKeyboard(250);
    // 1334 - 250 = 1084 visible; the list starts at 860: 224 left, minus a gap.
    const style = listStyle(screen);
    expect(style.top).toBe(860);
    expect(style.maxHeight).toBe(1334 - 250 - 860 - 4);
  });
});
