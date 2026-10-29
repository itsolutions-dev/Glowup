import React, { createRef } from "react";
import { Text, TextInput } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import {
  Form,
  FormField,
  Input,
  PasswordField,
  ThemeProvider,
  passwordStrength,
} from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("PasswordField", () => {
  it("hides the text, and a labelled eye button reveals and hides it", async () => {
    const onVisibleChange = jest.fn();
    const view = await draw(
      <PasswordField
        label="Password"
        value="hunter2"
        onChange={() => {}}
        onVisibleChange={onVisibleChange}
      />,
    );
    expect(view.getByLabelText("Password").props.secureTextEntry).toBe(true);

    await fireEvent.press(view.getByRole("button", { name: "Show password" }));
    expect(onVisibleChange).toHaveBeenLastCalledWith(true);
    expect(view.getByLabelText("Password").props.secureTextEntry).toBe(false);

    await fireEvent.press(view.getByRole("button", { name: "Hide password" }));
    expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    expect(view.getByLabelText("Password").props.secureTextEntry).toBe(true);
  });

  it("starts revealed with defaultVisible, and is driven by visible when controlled", async () => {
    const start = await draw(
      <PasswordField
        label="Password"
        value="x"
        onChange={() => {}}
        defaultVisible
      />,
    );
    expect(start.getByLabelText("Password").props.secureTextEntry).toBe(false);
    expect(start.getByRole("button", { name: "Hide password" })).toBeTruthy();

    const onVisibleChange = jest.fn();
    const held = await draw(
      <PasswordField
        label="Held"
        value="x"
        onChange={() => {}}
        visible={false}
        onVisibleChange={onVisibleChange}
      />,
    );
    await fireEvent.press(held.getByRole("button", { name: "Show password" }));
    // The app did not reveal it, so it stays hidden.
    expect(onVisibleChange).toHaveBeenCalledWith(true);
    expect(held.getByLabelText("Held").props.secureTextEntry).toBe(true);
  });

  it("can name the button in another language, hide it and disable it", async () => {
    const view = await draw(
      <PasswordField
        label="Password"
        value=""
        onChange={() => {}}
        toggleLabels={{ show: "Mostra", hide: "Nascondi" }}
        disabled
      />,
    );
    const button = view.getByRole("button", { name: "Mostra" });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(button);
    expect(view.getByLabelText("Password").props.secureTextEntry).toBe(true);

    const none = await draw(
      <PasswordField
        label="Pin"
        value=""
        onChange={() => {}}
        showToggle={false}
      />,
    );
    expect(none.queryByRole("button")).toBeNull();
  });

  it("asks the platform for password autofill and no correction", async () => {
    const current = await draw(
      <PasswordField label="Password" value="" onChange={() => {}} />,
    );
    expect(current.getByLabelText("Password").props).toMatchObject({
      autoComplete: "current-password",
      textContentType: "password",
      autoCorrect: false,
      autoCapitalize: "none",
      spellCheck: false,
    });

    const created = await draw(
      <PasswordField
        label="New"
        value=""
        onChange={() => {}}
        autoComplete="new-password"
      />,
    );
    expect(created.getByLabelText("New").props).toMatchObject({
      autoComplete: "new-password",
      textContentType: "newPassword",
    });
  });

  it("never puts the value in an accessibility prop, hidden or revealed", async () => {
    const view = await draw(
      <PasswordField
        label="Password"
        value="s3cret!"
        onChange={() => {}}
        helperText="At least 8"
      />,
    );
    const secret = (props: Record<string, unknown>) =>
      JSON.stringify(
        Object.entries(props).filter(([k]) => /^(accessibility|aria)/.test(k)),
      );
    expect(secret(view.getByLabelText("Password").props)).not.toContain(
      "s3cret",
    );
    await fireEvent.press(view.getByRole("button", { name: "Show password" }));
    const field = view.getByLabelText("Password");
    expect(field.props.accessibilityValue).toBeUndefined();
    expect(secret(field.props)).not.toContain("s3cret");
  });

  it("passes the Input props on: onChange, error, helper text, the field's own testID", async () => {
    const onChange = jest.fn();
    const view = await draw(
      <PasswordField
        label="Password"
        value=""
        onChange={onChange}
        error="Too short"
        inputProps={{ testID: "pw" }}
      />,
    );
    await fireEvent.changeText(view.getByLabelText("Password"), "abc");
    expect(onChange).toHaveBeenCalledWith("abc");
    expect(view.getByText("Too short")).toBeTruthy();
    expect(view.getByTestId("pw")).toBeTruthy();
    expect(view.getByTestId("pw-toggle")).toBeTruthy();
  });
});

describe("passwordStrength", () => {
  it.each([
    ["", 0],
    ["abc", 0],
    ["aaaaaaaaaaaaaaaa", 1],
    ["12345678901234", 1],
    ["password", 1],
    ["Password123!", 1],
    ["abcdefgh", 1],
    ["abcdefghijkl", 2],
    ["Abcdefg1", 3],
    ["Tr0ub4dor&3", 3],
    ["correct Horse 7 battery", 4],
    ["Zx9!kQ2#mWp4", 4],
  ])("scores %j as %i", (value, score) => {
    expect(passwordStrength(value)).toBe(score);
  });
});

describe("PasswordField strength meter", () => {
  const meter = (value: string, extra = {}) => (
    <PasswordField
      label="Password"
      value={value}
      onChange={() => {}}
      showStrength
      {...extra}
    />
  );

  // A FormField hands `undefined` to a field the form's initialValues leave out; the meter threw.
  it("takes no value in a form, as an empty one", async () => {
    const view = await draw(
      <Form>
        <FormField name="newPassword" label="New password">
          {(field) => <PasswordField {...field} showStrength />}
        </FormField>
      </Form>,
    );
    await fireEvent.changeText(
      view.getByLabelText("New password"),
      "Sunrise-2026!",
    );
    expect(view.getByLabelText(/^Password strength/)).toBeTruthy();
  });

  it("is not drawn without showStrength", async () => {
    const view = await draw(
      <PasswordField
        label="Password"
        value="abcdefghijkl"
        onChange={() => {}}
      />,
    );
    expect(view.queryByText("Fair")).toBeNull();
    expect(view.queryByRole("progressbar")).toBeNull();
  });

  it("says nothing for an empty field, then names the strength", async () => {
    const view = await draw(meter(""));
    expect(view.queryByText("Very weak")).toBeNull();
    await view.rerender(<ThemeProvider>{meter("abcdefghijkl")}</ThemeProvider>);
    expect(view.getByText("Fair")).toBeTruthy();
    await view.rerender(<ThemeProvider>{meter("Zx9!kQ2#mWp4")}</ThemeProvider>);
    expect(view.getByText("Strong")).toBeTruthy();
  });

  it("is one live status for assistive tech, and the bar itself is not a second element", async () => {
    const view = await draw(meter("Abcdefg1"));
    const status = view.getByRole("status");
    expect(status.props.accessibilityLabel).toBe("Password strength: Good");
    expect(view.queryByRole("progressbar")).toBeNull();
  });

  it("takes your own words, from weakest to strongest", async () => {
    const view = await draw(
      meter("abcdefghijkl", {
        strengthLabels: ["Debole", "Scarsa", "Discreta", "Buona", "Forte"],
      }),
    );
    expect(view.getByText("Discreta")).toBeTruthy();
  });
});

describe("Input endAdornment and inputProps", () => {
  it("draws an adornment at the end of the field, beside a trailing icon", async () => {
    const onTrailingIconPress = jest.fn();
    const view = await draw(
      <Input
        label="Amount"
        value=""
        onChange={() => {}}
        trailingIcon="close"
        onTrailingIconPress={onTrailingIconPress}
        endAdornment={<Text>unit</Text>}
      />,
    );
    expect(view.getByText("unit")).toBeTruthy();
    const plain = await draw(
      <Input label="Plain" value="" onChange={() => {}} />,
    );
    expect(plain.queryByText("unit")).toBeNull();
  });

  it("leaves the value out of accessibilityValue for a secure field only", async () => {
    const open = await draw(
      <Input label="Open" value="visible" onChange={() => {}} />,
    );
    expect(open.getByLabelText("Open").props.accessibilityValue).toEqual({
      text: "visible",
    });
    const secure = await draw(
      <Input
        label="Secure"
        value="hidden"
        onChange={() => {}}
        secureTextEntry
      />,
    );
    expect(secure.getByLabelText("Secure").props.accessibilityValue).toBe(
      undefined,
    );
  });

  it("hands inputProps and a ref to the TextInput", async () => {
    const ref = createRef<TextInput>();
    const view = await draw(
      <Input
        label="Field"
        value=""
        onChange={() => {}}
        inputRef={ref}
        inputProps={{ autoFocus: true, accessibilityLabel: "Custom name" }}
      />,
    );
    const field = view.getByLabelText("Custom name");
    expect(field.props.autoFocus).toBe(true);
    expect(ref.current).toBeTruthy();
  });
});
