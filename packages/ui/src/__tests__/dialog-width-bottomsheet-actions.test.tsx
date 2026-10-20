import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { BottomSheet, Dialog, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("Dialog width", () => {
  const maxWidth = async (width?: "xs" | "sm" | "md" | "lg") => {
    const { toJSON } = await draw(
      <Dialog visible title="T" width={width}>
        Body
      </Dialog>,
    );
    return JSON.stringify(toJSON());
  };

  it("caps the dialog at the width asked for, 560 by default", async () => {
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
        onClose={() => {}}
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
    const onClose = jest.fn();
    const plain = await draw(
      <BottomSheet visible onClose={onClose} title="Filters">
        <Text>Content</Text>
      </BottomSheet>,
    );
    expect(plain.queryByLabelText("Close")).toBeNull();

    const withClose = await draw(
      <BottomSheet visible onClose={onClose} title="Filters" showCloseButton>
        <Text>Content</Text>
      </BottomSheet>,
    );
    await fireEvent.press(withClose.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on a scrim tap and on Android back, and the scrim can be locked", async () => {
    const onClose = jest.fn();
    const open = await draw(
      <BottomSheet visible onClose={onClose}>
        <Text>Content</Text>
      </BottomSheet>,
    );
    await fireEvent.press(
      open.getByLabelText("Close bottom sheet", {
        includeHiddenElements: true,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    const modal = open.container.queryAll((n) => n.type === "Modal")[0];
    modal.props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(2);

    const locked = await draw(
      <BottomSheet visible onClose={onClose} dismissOnScrimTap={false}>
        <Text>Content</Text>
      </BottomSheet>,
    );
    await fireEvent.press(
      locked.getByLabelText("Close bottom sheet", {
        includeHiddenElements: true,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("adds a divider and a row only when there are actions", async () => {
    const json = async (actions?: React.ReactNode) =>
      JSON.stringify(
        (
          await draw(
            <BottomSheet visible onClose={() => {}} actions={actions}>
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
