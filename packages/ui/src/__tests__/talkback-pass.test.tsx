import React from "react";
import { render } from "@testing-library/react-native";
import { Avatar, ListItem, StatusBadge, Switch, ThemeProvider } from "..";

// Found with TalkBack on the emulator (2/11), each heard before the fix.
const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("a Switch without a visible label", () => {
  // A settings row puts the words in the ListItem and the Switch in its action
  // slot; TalkBack said "on, Switch" with nothing to tell the rows apart.
  it("takes a name for screen readers through accessibilityLabel", async () => {
    const view = await draw(
      <ListItem
        primaryText="Mentions"
        secondaryText="When someone tags you"
        action={
          <Switch value onChange={() => {}} accessibilityLabel="Mentions" />
        }
      />,
    );
    expect(view.getByRole("switch", { name: "Mentions" })).toBeTruthy();
  });

  it("a visible label still names it, and wins over nothing", async () => {
    const view = await draw(
      <Switch value onChange={() => {}} label="Allow notifications" />,
    );
    expect(
      view.getByRole("switch", { name: "Allow notifications" }),
    ).toBeTruthy();
  });
});

describe("an Avatar that does nothing when pressed", () => {
  // It was a disabled Pressable, so TalkBack said "Marta Rossi Avatar. Image.
  // disabled": a picture is not a control that is switched off.
  it("is an image, not a disabled one", async () => {
    const view = await draw(<Avatar name="Marta Rossi" />);
    const image = view.getByRole("image");
    expect(image.props.accessibilityState?.disabled).not.toBe(true);
    expect(image.props["aria-disabled"]).not.toBe(true);
  });

  it("is still a button when it has onClick", async () => {
    const view = await draw(<Avatar name="Marta Rossi" onClick={() => {}} />);
    expect(view.getByRole("button")).toBeTruthy();
  });
});

describe("a StatusBadge in a pressable row", () => {
  // The badge is named by its label, and its text said it again: a DataGrid
  // row was "INV-2051, Brightside Studio, Due, Due, €1240.50".
  it("says its label once: the text inside is for the eye", async () => {
    const view = await draw(
      <ListItem
        primaryText="INV-2051"
        action={<StatusBadge label="Due" type="warning" />}
        onClick={() => {}}
      />,
    );
    const text = view.getByText("Due", { includeHiddenElements: true });
    expect(text.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(text.props.accessibilityElementsHidden).toBe(true);
    expect(view.getAllByLabelText("Due")).toHaveLength(1);
  });
});
