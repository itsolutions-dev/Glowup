import React from "react";
import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { BottomSheet, Breadcrumbs, Drawer, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("close labels", () => {
  it("BottomSheet names its close button and scrim with closeText", async () => {
    const onClose = jest.fn();
    const view = await draw(
      <BottomSheet
        visible
        onClose={onClose}
        title="Filtri"
        showCloseButton
        closeText="Chiudi"
      >
        <Text>Contenuto</Text>
      </BottomSheet>,
    );
    const named = view.getAllByLabelText("Chiudi", {
      includeHiddenElements: true,
    });
    expect(named).toHaveLength(2);
    expect(view.queryByLabelText("Close")).toBeNull();
    await fireEvent.press(view.getByRole("button", { name: "Chiudi" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Drawer names its close and back buttons and its scrim", async () => {
    const view = await draw(
      <Drawer
        variant="swipeable"
        visible
        onClose={() => {}}
        onBack={() => {}}
        title="Filtri"
        showCloseButton
        closeText="Chiudi"
        backText="Indietro"
      >
        <Text>Contenuto</Text>
      </Drawer>,
    );
    expect(view.getByRole("button", { name: "Indietro" })).toBeTruthy();
    expect(
      view.getAllByLabelText("Chiudi", { includeHiddenElements: true }),
    ).toHaveLength(2);
    expect(view.queryByLabelText("Close drawer")).toBeNull();
  });
});

describe("Breadcrumbs separatorText", () => {
  it("draws the text between items instead of the glyph", async () => {
    const view = await draw(
      <Breadcrumbs
        separatorText="›"
        items={[
          { id: "1", label: "Widget", onPress: () => {} },
          { id: "2", label: "Gruppo", onPress: () => {} },
          { id: "3", label: "Campo" },
        ]}
      />,
    );
    expect(
      view.getAllByText("›", { includeHiddenElements: true }),
    ).toHaveLength(2);
  });
});
