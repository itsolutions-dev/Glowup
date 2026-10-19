import React from "react";
import { render } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { PdfProvider } from "@its/glowup-pdf";
import { createMemoryPdf } from "@its/glowup-pdf/testing";
import NativeCheck from "../app/native-check";

const HIT = { x: 0.1, y: 0.1, width: 0.2, height: 0.02 };

// The screen only runs in the native smoke job, so this just keeps it from
// breaking unnoticed: it mounts, and shows what the Android script looks for.
describe("native check screen", () => {
  it("mounts with its title, its interaction controls and pending measurements", async () => {
    // The PDF rows run on the package's in-memory adapters: no native module is needed.
    const memory = createMemoryPdf({
      search: {
        hello: [
          { page: 0, rects: [HIT] },
          { page: 1, rects: [HIT] },
        ],
      },
    });
    const { getByText, getByLabelText, findByText } = await render(
      <ThemeProvider>
        <PdfProvider adapters={memory.adapters}>
          <NativeCheck />
        </PdfProvider>
      </ThemeProvider>,
    );
    expect(getByText("Native check")).toBeTruthy();
    expect(getByLabelText("Amount")).toBeTruthy();
    expect(getByText("reported=")).toBeTruthy();
    expect(getByText("badge=0")).toBeTruthy();
    expect(getByText("tab=overview")).toBeTruthy();
    expect(getByText("sheet=closed")).toBeTruthy();
    // jest lays nothing out, so no measurement has arrived yet.
    expect(getByText(/^PENDING input dense is 24 shorter/)).toBeTruthy();

    expect(
      await findByText(/^PASS pdf opens and reports its pages \(3 pages/),
    ).toBeTruthy();
    expect(
      await findByText(/^PASS pdf search finds a known word/),
    ).toBeTruthy();
    // The page is drawn at the width the check asks for; the image's own load event is not fired here.
    expect(memory.calls.rendered[0]?.width).toBe(600);
    expect(getByLabelText("Sample PDF page")).toBeTruthy();
    expect(
      getByText(/^PENDING pdf page is drawn at the width asked/),
    ).toBeTruthy();
  });
});
