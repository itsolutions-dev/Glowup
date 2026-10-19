import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";
import { PdfProvider } from "@its/glowup-pdf";
import { createMemoryPdf } from "@its/glowup-pdf/testing";

import PdfPage from "../app/pdf";

// The page runs on the package's in-memory adapters: no native module is needed.
describe("the PDF page", () => {
  it("opens the sample, then another address with its header, then the sample again", async () => {
    const memory = createMemoryPdf();
    const view = await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 1280, height: 900 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ThemeProvider>
          <PdfProvider adapters={memory.adapters}>
            <PdfPage />
          </PdfProvider>
        </ThemeProvider>
      </SafeAreaProvider>,
    );

    // The sample is the bytes of a real PDF, written to the cache and opened.
    await screen.findByLabelText("Go to page");
    expect(memory.calls.written).toHaveLength(1);
    expect(String.fromCharCode(...memory.calls.written[0].slice(0, 5))).toBe(
      "%PDF-",
    );
    expect(screen.getByText("/ 3")).toBeTruthy();
    expect(screen.getByText("Open the address")).toBeDisabled();

    await fireEvent.changeText(
      screen.getByLabelText("Address of a PDF"),
      " https://x/a.pdf ",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Authorization header (optional)"),
      "Bearer t",
    );
    await fireEvent.press(screen.getByText("Open the address"));
    await waitFor(() =>
      expect(memory.calls.downloaded).toEqual([
        { uri: "https://x/a.pdf", headers: { Authorization: "Bearer t" } },
      ]),
    );

    await fireEvent.press(screen.getByText("Back to the sample"));
    await waitFor(() => expect(memory.calls.written).toHaveLength(2));
    await view.unmount();
  });
});
