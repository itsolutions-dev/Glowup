import React from "react";
import { render, screen } from "@testing-library/react";
import {
  Button,
  Card,
  Input,
  PasswordField,
  PinInput,
  ThemeProvider,
} from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

// The field draws its own focus ring on the box around it. The browser's ring
// on the <input> inside was a second, black one (29/10): `outlineWidth: 0` is
// dropped by react-native-web, so the input sets `outline-style: none`.
describe("one focus ring", () => {
  it.each([
    ["Input", <Input key="i" label="Name" value="" onChange={() => {}} />],
    [
      "PasswordField",
      <PasswordField key="p" label="Password" value="" onChange={() => {}} />,
    ],
  ])("%s turns the browser's outline off on its <input>", (_name, field) => {
    const { container } = draw(field);
    const input = container.querySelector("input") as HTMLElement;
    expect(getComputedStyle(input).outlineStyle).toBe("none");
  });

  it("PinInput turns it off on every cell", () => {
    const { container } = draw(
      <PinInput length={4} value="" onChange={() => {}} />,
    );
    const cells = Array.from(container.querySelectorAll("input"));
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(getComputedStyle(cell).outlineStyle).toBe("none");
    }
  });
});

// A button inside a button is invalid HTML: a browser re-parents it and a
// screen reader reads one control. A pressable Card with actions keeps its
// buttons beside its press area, not inside it (30/10).
describe("no control inside a control", () => {
  it("a pressable Card's action buttons are not inside the card's button", () => {
    draw(
      <Card onClick={() => {}} accessibilityLabel="Open Rossi">
        <Card.Content>Rossi</Card.Content>
        <Card.Actions>
          <Button>Call</Button>
        </Card.Actions>
      </Card>,
    );
    for (const button of screen.getAllByRole("button")) {
      expect(button.parentElement?.closest("[role=button]")).toBeNull();
    }
  });
});
