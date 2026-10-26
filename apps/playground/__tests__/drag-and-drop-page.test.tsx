import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import DragAndDropPage from "../app/drag-and-drop";
import { SITE_ROUTES } from "../site/siteNav";

describe("the drag and drop page", () => {
  it("shows the demos, the usage and the three API tables", async () => {
    await render(
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
    expect(await screen.findByText("Drag and drop")).toBeTruthy();
    for (const section of [
      "Between lists",
      "Reorder a list",
      "Rules for a zone",
      "Nested zones",
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

  it("is a section of the site", () => {
    expect(SITE_ROUTES.map((route) => route.href)).toContain("/drag-and-drop");
  });
});
