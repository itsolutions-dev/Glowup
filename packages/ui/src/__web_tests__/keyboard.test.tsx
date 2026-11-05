import React, { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Button, Dialog, Form, Input, ThemeProvider } from "..";

// The keys a desktop user expects, in the DOM react-native-web draws: Escape
// closes the dialog on top, Enter in a field submits its form. Both were fixed
// after a pilot screen (28/10) and checked by hand in Chrome until now.
const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);
// react-native-web makes a Modal active (and listening for Escape) when its
// open animation ends; jsdom never ends one, so the dialogs here do not animate.
const escape = () =>
  act(() => {
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyUp(document, { key: "Escape" });
  });

describe("Escape", () => {
  it("closes an open Dialog", () => {
    const onClose = jest.fn();
    draw(
      <Dialog animationType="none" visible title="Delete" onClose={onClose}>
        Sure?
      </Dialog>,
    );
    escape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("leaves a Dialog with disableEscapeKeyDown open", () => {
    const onClose = jest.fn();
    draw(
      <Dialog
        animationType="none"
        visible
        title="Saving"
        onClose={onClose}
        disableEscapeKeyDown
      >
        Wait
      </Dialog>,
    );
    escape();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes only the dialog on top of a stack, one per press", () => {
    const Stack = () => {
      const [outer, setOuter] = useState(true);
      const [inner, setInner] = useState(true);
      return (
        <>
          <Dialog
            animationType="none"
            visible={outer}
            title="Outer"
            onClose={() => setOuter(false)}
          >
            Outer body
          </Dialog>
          <Dialog
            animationType="none"
            visible={inner}
            title="Inner"
            onClose={() => setInner(false)}
          >
            Inner body
          </Dialog>
        </>
      );
    };
    draw(<Stack />);
    escape();
    expect(screen.queryByText("Inner body")).toBeNull();
    expect(screen.queryByText("Outer body")).not.toBeNull();
    escape();
    expect(screen.queryByText("Outer body")).toBeNull();
  });
});

describe("Enter in a Form", () => {
  const Login = ({
    onSubmit,
    disabled,
  }: {
    onSubmit: () => void;
    disabled?: boolean;
  }) => {
    const [name, setName] = useState("ada");
    return (
      <Form onSubmit={onSubmit} disabled={disabled}>
        <Input label="Name" value={name} onChange={setName} />
        <Button type="submit">Sign in</Button>
      </Form>
    );
  };

  it("draws a real <form>, so the browser submits it on Enter", () => {
    const { container } = draw(<Login onSubmit={() => {}} />);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    expect(form?.contains(screen.getByRole("textbox"))).toBe(true);
  });

  it("submits once on the form's submit event, which Enter in a field raises", () => {
    const onSubmit = jest.fn();
    const { container } = draw(<Login onSubmit={onSubmit} />);
    const submit = new Event("submit", { bubbles: true, cancelable: true });
    act(() => {
      container.querySelector("form")?.dispatchEvent(submit);
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    // The page must not navigate away.
    expect(submit.defaultPrevented).toBe(true);
  });

  it("does not submit a disabled form", () => {
    const onSubmit = jest.fn();
    const { container } = draw(<Login onSubmit={onSubmit} disabled />);
    act(() => {
      container
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
