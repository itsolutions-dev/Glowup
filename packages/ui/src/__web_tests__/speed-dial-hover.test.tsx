import React from "react";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { SpeedDial, ThemeProvider } from "..";

const actions = [
  {
    id: "new",
    label: "New practice",
    icon: "plus" as const,
    onPress: () => {},
  },
  {
    id: "csv",
    label: "Import CSV",
    icon: "upload" as const,
    onPress: () => {},
  },
];
const draw = (props: Partial<React.ComponentProps<typeof SpeedDial>> = {}) =>
  render(
    <ThemeProvider>
      <SpeedDial actions={actions} mainIcon="plus" {...props} />
    </ThemeProvider>,
  );
// React builds pointerenter / pointerleave out of pointerover / pointerout.
// jsdom has no PointerEvent, so the pointer type is set on a plain event.
const pointer = (
  type: "pointerOver" | "pointerOut",
  el: Element,
  pointerType: string,
) => {
  const event = createEvent[type](el);
  Object.defineProperty(event, "pointerType", { value: pointerType });
  fireEvent(el, event);
};

describe("SpeedDial", () => {
  it("opens on a mouse over the trigger with openOnHover, and closes when the mouse leaves", () => {
    draw({
      openOnHover: true,
      openLabel: "Apri azioni",
      closeLabel: "Chiudi azioni",
    });
    const trigger = screen.getByLabelText("Apri azioni");
    pointer("pointerOver", trigger, "mouse");
    expect(screen.getByLabelText("Chiudi azioni")).toBeTruthy();
    pointer("pointerOut", screen.getByLabelText("Chiudi azioni"), "mouse");
    expect(screen.getByLabelText("Apri azioni")).toBeTruthy();
  });

  it("ignores a touch.s pointer events, which keep toggling on press", () => {
    draw({ openOnHover: true });
    pointer("pointerOver", screen.getByLabelText("Open actions"), "touch");
    expect(screen.getByLabelText("Open actions")).toBeTruthy();
  });

  it("does not open on hover by default", () => {
    draw();
    pointer("pointerOver", screen.getByLabelText("Open actions"), "mouse");
    expect(screen.getByLabelText("Open actions")).toBeTruthy();
  });
});
