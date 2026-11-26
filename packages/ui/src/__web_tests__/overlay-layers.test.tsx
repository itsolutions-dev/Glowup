import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  Autocomplete,
  DatePicker,
  Dialog,
  PortalHost,
  ThemeProvider,
} from "..";

// An overlay opened from inside a Dialog or a side sheet must be drawn above
// it. react-native-web puts every Modal in a layer of its own at the end of
// <body>, so "above" means in a layer that comes later than the dialog's.
const layerOf = (el: Element) => {
  let node: Element = el;
  while (node.parentElement && node.parentElement !== document.body)
    node = node.parentElement;
  return node;
};
const after = (a: Element, b: Element) =>
  !!(b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING);

beforeAll(() => {
  // A mouse: the date picker docks a popover instead of opening its dialog.
  window.matchMedia = ((query: string) => ({
    matches: query === "(pointer: fine)",
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  Object.defineProperty(window, "innerWidth", { value: 1280 });
});

describe("overlays inside a Dialog", () => {
  it("an Autocomplete's list is drawn in the dialog's layer, over the fields below it", () => {
    render(
      <ThemeProvider>
        <PortalHost>
          <Dialog visible animationType="none" title="New event">
            <Autocomplete
              label="Customer"
              value="an"
              onChange={() => {}}
              options={[
                { label: "Anna", value: 1 },
                { label: "Andrea", value: 2 },
              ]}
              testID="customer"
            />
          </Dialog>
        </PortalHost>
      </ThemeProvider>,
    );
    fireEvent.focus(screen.getByDisplayValue("an"));
    const list = screen.getByRole("list");
    const dialog = screen.getByTestId("dialog");
    // Portalled (not inside the field, where later siblings paint over it)...
    expect(screen.getByTestId("customer").contains(list)).toBe(false);
    // ...to the dialog's own host, not the root one under the dialog.
    expect(layerOf(list)).toBe(layerOf(dialog));
  });

  it("a DatePicker's popover opens above the dialog and Escape closes only the popover", () => {
    const onClose = jest.fn();
    render(
      <ThemeProvider>
        <Dialog visible animationType="none" title="Campaign" onClose={onClose}>
          <DatePicker
            label="Start"
            presentation="popover"
            value={null}
            onChange={() => {}}
          />
        </Dialog>
      </ThemeProvider>,
    );
    fireEvent.click(screen.getAllByLabelText("Open picker")[0]);
    // Not a role query: the calendar is a large tree, and jsdom computes every
    // accessible name in it.
    const surface = document.querySelector(
      '[role="dialog"][aria-label="Start"]',
    );
    expect(surface).not.toBeNull();
    expect(
      after(layerOf(surface!), layerOf(screen.getByTestId("dialog"))),
    ).toBe(true);
    act(() => {
      fireEvent.keyUp(document.activeElement ?? document.body, {
        key: "Escape",
      });
    });
    expect(
      document.querySelector('[role="dialog"][aria-label="Start"]'),
    ).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});
