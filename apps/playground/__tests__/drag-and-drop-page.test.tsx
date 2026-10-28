import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import DragAndDropPage from "../app/drag-and-drop";
import { SITE_ROUTES } from "../site/siteNav";

const draw = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1280, height: 900 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <DragAndDropPage />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

describe("the drag and drop page", () => {
  it("shows the demos, the usage and the three API tables", async () => {
    await draw();
    expect(await screen.findByText("Drag and drop")).toBeTruthy();
    for (const section of [
      "Between lists",
      "Reorder a list",
      "Rules for a zone",
      "Nested zones",
      "Drop anywhere on a grid",
      "Scroll while dragging",
      "Inside a form",
      "Use it",
      "API reference",
    ]) {
      expect(screen.getByText(section)).toBeTruthy();
    }
    // The tables come from the generated docs: a missing one means docgen lost it.
    for (const name of ["DragDropProvider", "Draggable", "Droppable"]) {
      expect(screen.getByText(new RegExp(` on ${name}Props$`))).toBeTruthy();
    }
    expect(screen.getByText("To do · 3")).toBeTruthy();
  });

  it("submits the list's order as a form value", async () => {
    await draw();
    await screen.findByText("Inside a form");
    // The name is required: an empty form is not sent.
    await fireEvent.press(screen.getByText("Send ranking"));
    expect(screen.queryByText(/^Sent: /)).toBeNull();

    await fireEvent.changeText(screen.getByLabelText("Your name"), "Ada");
    await fireEvent.press(screen.getByText("Send ranking"));
    expect(
      await screen.findByText(
        "Sent: Ada ranked Price, Delivery speed, Build quality, Support.",
      ),
    ).toBeTruthy();
  });

  it("is a section of the site", () => {
    expect(SITE_ROUTES.map((route) => route.href)).toContain("/drag-and-drop");
  });
});
