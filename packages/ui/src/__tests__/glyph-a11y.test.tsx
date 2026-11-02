import React from "react";
import { render } from "@testing-library/react-native";
import { Card, CardContent, ListItem, StatusBadge, ThemeProvider } from "..";
import Glyph from "../components/Glyph";

// An icon is a character of the icon font. TalkBack builds a pressable row's
// name from the text inside it, so a row read "󰈦, Roadmap 2027.pdf, Edited
// yesterday" with a box for the icon (heard on the emulator, 2/11). Icons are
// decoration: screen readers skip them, and the row's name is its words.
const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);
type View = Awaited<ReturnType<typeof draw>>;

/** The icon font's characters: Material Community Icons sit in the private-use planes. */
const glyphs = (view: View) =>
  view.container.queryAll(
    (n) =>
      n.type === "Text" &&
      /[\u{F0000}-\u{FFFFD}\u{E000}-\u{F8FF}]/u.test(
        ([] as unknown[]).concat(n.props.children).join(""),
      ),
  );

describe("an icon is hidden from screen readers", () => {
  it("in a pressable ListItem", async () => {
    const view = await draw(
      <ListItem
        icon="file-pdf-box"
        primaryText="Roadmap 2027.pdf"
        secondaryText="Edited yesterday"
        onClick={() => {}}
      />,
    );
    const [icon] = glyphs(view);
    expect(icon).toBeTruthy();
    expect(icon.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(icon.props.accessibilityElementsHidden).toBe(true);
    expect(icon.props["aria-hidden"]).toBe(true);
    // What the row is then called is the platform's to build: the testing
    // library joins hidden text into names too, so that was heard on the
    // emulator instead.
  });

  it("stays readable when the caller names it", async () => {
    const view = await draw(
      <Glyph name="alert" accessibilityLabel="Warning" />,
    );
    expect(
      view.getByLabelText("Warning").props.accessibilityElementsHidden,
    ).toBeUndefined();
  });

  it("in a StatusBadge: the badge says its label once", async () => {
    const view = await draw(<StatusBadge label="Paid" type="success" />);
    const icons = glyphs(view);
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(icon.props.importantForAccessibility).toBe("no-hide-descendants");
    }
  });

  it("in a pressable Card", async () => {
    const view = await draw(
      <Card onClick={() => {}}>
        <CardContent>
          <ListItem icon="airplane" primaryText="Team offsite" />
        </CardContent>
      </Card>,
    );
    const icons = glyphs(view);
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(icon.props.accessibilityElementsHidden).toBe(true);
    }
  });
});
