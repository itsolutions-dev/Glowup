/**
 * @jest-environment jsdom
 */
import React from "react";
import { Platform } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { Autocomplete, ThemeProvider } from "..";
import { useEscapeKey } from "../components/internal/useEscapeKey";

// react-native-web's Modal closes on the Escape *keyup*, from a document
// listener (ModalContent.js). A picker or popover inside it closes on the
// keydown: without care, one press closed both.
const modalKeyUp = jest.fn();
const onModalKeyUp = (event: KeyboardEvent) => {
  if (event.key === "Escape") modalKeyUp();
};

const press = (key: string) => {
  document.body.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true }),
  );
  document.body.dispatchEvent(
    new KeyboardEvent("keyup", { key, bubbles: true }),
  );
};

const Probe = ({
  active,
  onEscape,
}: {
  active: boolean;
  onEscape: () => void;
}) => {
  useEscapeKey(active, onEscape);
  return null;
};

beforeEach(() => {
  jest.replaceProperty(Platform, "OS", "web");
  modalKeyUp.mockClear();
  document.addEventListener("keyup", onModalKeyUp);
});
afterEach(() => document.removeEventListener("keyup", onModalKeyUp));

describe("Autocomplete inside a Modal", () => {
  it("Escape closes the suggestions, not the dialog under them", async () => {
    const view = await render(
      <ThemeProvider>
        <Autocomplete
          label="City"
          value="Mi"
          options={[{ id: "1", label: "Milano", value: "MI" }]}
          onChange={() => {}}
        />
      </ThemeProvider>,
    );
    await fireEvent(view.getByLabelText("City"), "focus");
    expect(view.getByText("Milano")).toBeTruthy();
    await act(async () => press("Escape"));
    expect(view.queryByText("Milano")).toBeNull();
    expect(modalKeyUp).not.toHaveBeenCalled();
  });
});

describe("useEscapeKey inside a Modal", () => {
  it("one Escape closes the popover, not the dialog under it", async () => {
    const onEscape = jest.fn();
    await render(<Probe active onEscape={onEscape} />);
    press("Escape");
    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(modalKeyUp).not.toHaveBeenCalled();
  });

  it("the next Escape, with the popover gone, reaches the dialog", async () => {
    const onEscape = jest.fn();
    const view = await render(<Probe active onEscape={onEscape} />);
    press("Escape");
    await view.rerender(<Probe active={false} onEscape={onEscape} />);
    press("Escape");
    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(modalKeyUp).toHaveBeenCalledTimes(1);
  });

  it("swallows only Escape's keyup", async () => {
    await render(<Probe active onEscape={() => {}} />);
    press("Escape");
    press("a");
    const other = jest.fn();
    document.addEventListener("keyup", other);
    press("Enter");
    document.removeEventListener("keyup", other);
    expect(other).toHaveBeenCalledTimes(1);
  });
});
