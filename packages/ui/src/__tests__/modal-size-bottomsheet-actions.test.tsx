import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { BottomSheet, Modal, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("Modal size", () => {
  const maxWidth = async (size?: "xs" | "sm" | "md" | "lg") => {
    const { toJSON } = await draw(
      <Modal visible title="T" size={size}>
        Body
      </Modal>,
    );
    return JSON.stringify(toJSON());
  };

  it("caps the dialog at the width of its size, 560 by default", async () => {
    expect(await maxWidth("xs")).toContain('"maxWidth":360');
    expect(await maxWidth("sm")).toContain('"maxWidth":480');
    expect(await maxWidth("lg")).toContain('"maxWidth":800');
    expect(await maxWidth()).toContain('"maxWidth":560');
    expect(await maxWidth("md")).toContain('"maxWidth":560');
  });
});

describe("BottomSheet", () => {
  it("draws the title, the content and the fixed actions", async () => {
    const { getByText } = await draw(
      <BottomSheet
        visible
        onDismiss={() => {}}
        title="Filters"
        actions={<Text>Apply</Text>}
      >
        <Text>Content</Text>
      </BottomSheet>,
    );
    expect(getByText("Filters")).toBeTruthy();
    expect(getByText("Content")).toBeTruthy();
    expect(getByText("Apply")).toBeTruthy();
  });

  it("has no close button unless asked, and the button dismisses", async () => {
    const onDismiss = jest.fn();
    const plain = await draw(
      <BottomSheet visible onDismiss={onDismiss} title="Filters">
        <Text>Content</Text>
      </BottomSheet>,
    );
    expect(plain.queryByLabelText("Close")).toBeNull();

    const withClose = await draw(
      <BottomSheet
        visible
        onDismiss={onDismiss}
        title="Filters"
        showCloseButton
      >
        <Text>Content</Text>
      </BottomSheet>,
    );
    await fireEvent.press(withClose.getByLabelText("Close"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("adds a divider and a row only when there are actions", async () => {
    const json = async (actions?: React.ReactNode) =>
      JSON.stringify(
        (
          await draw(
            <BottomSheet visible onDismiss={() => {}} actions={actions}>
              <Text>Content</Text>
            </BottomSheet>,
          )
        ).toJSON(),
      );
    const without = await json();
    const withActions = await json(<Text>Apply</Text>);
    expect(without).not.toContain("Apply");
    expect(withActions).toContain("Apply");
    // The divider and the row are extra nodes under the sheet.
    expect(withActions.length).toBeGreaterThan(without.length + 100);
  });
});
