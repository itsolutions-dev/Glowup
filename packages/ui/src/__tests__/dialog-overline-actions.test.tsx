import React from "react";
import { StyleSheet } from "react-native";
import { render } from "@testing-library/react-native";
import { Button, Dialog, ThemeProvider } from "..";
import type { DialogProps } from "..";

const draw = (props: Partial<DialogProps> = {}) =>
  render(
    <ThemeProvider>
      <Dialog visible title="Edit route" onClose={() => {}} {...props}>
        Body
      </Dialog>
    </ThemeProvider>,
  );

describe("Dialog overline, leadingActions, dividers", () => {
  it("shows the overline above the title", async () => {
    const view = await draw({ overline: "Branch 12" });
    const texts = view
      .getAllByText(/^(Branch 12|Edit route)$/)
      .map((t) => t.props.children);
    expect(texts).toEqual(["Branch 12", "Edit route"]);
  });

  it("draws leading actions on the start of the row", async () => {
    const view = await draw({
      leadingActions: <Button>Delete</Button>,
      actions: <Button>Save</Button>,
      slotStyles: {},
    });
    const order = view
      .getAllByRole("button")
      .map((b) => b.props.accessibilityLabel ?? "")
      .filter((l) => l === "Delete" || l === "Save");
    expect(order).toEqual(["Delete", "Save"]);
    const row = view.getByTestId("dialog-actions");
    expect(StyleSheet.flatten(row.props.style).justifyContent).toBe(
      "space-between",
    );
  });

  it("draws leading actions without trailing ones", async () => {
    const view = await draw({
      leadingActions: <Button>Delete</Button>,
      onClose: () => {},
      closeIcon: false,
    });
    expect(view.getByText("Delete")).toBeTruthy();
    // The fallback close button belongs to a dialog with no actions at all.
    expect(view.queryByText("Close")).toBeNull();
  });

  it("draws dividers around the body", async () => {
    const lined = await draw({ dividers: true });
    expect(lined.getByTestId("dialog-divider-top")).toBeTruthy();
    expect(lined.getByTestId("dialog-divider-bottom")).toBeTruthy();
    const plain = await draw();
    expect(plain.queryByTestId("dialog-divider-top")).toBeNull();
  });
});
