import React from "react";
import { Platform } from "react-native";
import { render } from "@testing-library/react-native";
import {
  Input,
  InputArea,
  NumberField,
  PasswordField,
  ThemeProvider,
} from "..";

// TalkBack reads a filled edit box as its text and drops its description, so
// "Email" was never heard once the field had a value (seen on the emulator,
// 30/10); `accessibilityValue` made an empty one "Username, ". On Android a
// field is named by its label through `accessibilityLabelledBy` (labelFor).
const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const fields = [
  ["Input", <Input key="i" label="Email" value="a@b.it" onChange={() => {}} />],
  [
    "InputArea",
    <InputArea key="a" label="Email" value="a@b.it" onChange={() => {}} />,
  ],
  [
    "NumberField",
    <NumberField key="n" label="Email" value={3} onChange={() => {}} />,
  ],
  [
    "PasswordField",
    <PasswordField key="p" label="Email" value="secret" onChange={() => {}} />,
  ],
] as const;

describe.each(fields)("%s label", (_name, field) => {
  it("names the edit box by its label on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const view = await draw(field);
    const id = view.getByText("Email").props.nativeID;
    expect(id).toEqual(expect.any(String));
    const input = view.getByLabelText("Email");
    expect(input.props.accessibilityLabelledBy).toBe(id);
    // The label alone: with a description too, an empty field was
    // "Username. Edit box for Username".
    expect(input.props.accessibilityLabel).toBeUndefined();
  });

  it("leaves the value to the edit box itself", async () => {
    const view = await draw(field);
    expect(view.getByLabelText("Email").props.accessibilityValue).toBe(
      undefined,
    );
  });

  it("puts no generated id in the iOS output", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const view = await draw(field);
    expect(view.getByText("Email").props.nativeID).toBeUndefined();
    expect(
      view.getByLabelText("Email").props.accessibilityLabelledBy,
    ).toBeUndefined();
  });
});
