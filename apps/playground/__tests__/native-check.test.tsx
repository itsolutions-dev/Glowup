import React from "react";
import { Image } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { PdfProvider } from "@its/glowup-pdf";
import { createMemoryPdf } from "@its/glowup-pdf/testing";
import NativeCheck from "../app/native-check";

const HIT = { x: 0.1, y: 0.1, width: 0.2, height: 0.02 };

// The PDF rows run on the package's in-memory adapters: no native module is needed.
const mount = async () => {
  const memory = createMemoryPdf({
    search: {
      hello: [
        { page: 0, rects: [HIT] },
        { page: 1, rects: [HIT] },
      ],
    },
  });
  // jest-expo's image loader mock has no promise to give back: answer with the size asked for.
  jest
    .spyOn(Image, "getSize")
    .mockImplementation(((_uri: string, ok?: (w: number, h: number) => void) =>
      ok?.(600, 849)) as typeof Image.getSize);
  const view = await render(
    <ThemeProvider>
      <PdfProvider adapters={memory.adapters}>
        <NativeCheck />
      </PdfProvider>
    </ThemeProvider>,
  );
  return { memory, ...view };
};

// The screen only runs in the native smoke job, so this just keeps it from
// breaking unnoticed: it mounts, and shows what the Android script looks for.
describe("native check screen", () => {
  it("reads a layout event before the state update runs, not inside it", async () => {
    // On the phone React runs a state updater later, during the render, when the native event is already
    // gone: reading `e.nativeEvent` inside it threw "Cannot read property 'layout' of null" and killed the app
    // when the screen opened (CI of 2026-10-26, Android 14 and 15).
    const { getByTestId, getByLabelText, findByText } = await mount();
    const event = {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 240 } },
    } as { nativeEvent: unknown };
    await act(async () => {
      // An update already waiting, so React cannot compute the next one on the spot.
      fireEvent.changeText(getByLabelText("Amount"), "5");
      fireEvent(getByTestId("pivot-box"), "layout", event);
      event.nativeEvent = null;
    });
    expect(
      await findByText(/^PASS pivot grid is laid out at its height \(240/),
    ).toBeTruthy();
  });

  it("mounts with its title, its interaction controls and pending measurements", async () => {
    const { memory, getByText, getByLabelText, findByLabelText, findByText } =
      await mount();
    expect(getByText("Native check")).toBeTruthy();
    expect(getByLabelText("Amount")).toBeTruthy();
    expect(getByText("reported=")).toBeTruthy();
    expect(getByText("badge=0")).toBeTruthy();
    expect(getByText("tab=overview")).toBeTruthy();
    expect(getByText("sheet=closed")).toBeTruthy();
    expect(getByText("chart=none")).toBeTruthy();
    expect(getByText("part=none")).toBeTruthy();
    // The pivot grid: one row for the grand total, six sites and four categories under each.
    expect(getByText("pivot=31")).toBeTruthy();
    // jest lays nothing out, so no measurement has arrived yet.
    expect(
      getByText(/^PENDING pivot grid is laid out at its height/),
    ).toBeTruthy();
    expect(getByText(/^PENDING input dense is 24 shorter/)).toBeTruthy();
    expect(
      getByText(/^PENDING bar chart is laid out at its height/),
    ).toBeTruthy();
    expect(
      getByText(/^PENDING chart box shrinks with its container/),
    ).toBeTruthy();

    expect(
      await findByText(/^PASS pdf opens and reports its pages \(3 pages/),
    ).toBeTruthy();
    expect(
      await findByText(/^PASS pdf search finds a known word/),
    ).toBeTruthy();
    expect(memory.calls.rendered[0]?.width).toBe(600);
    expect(
      await findByText(
        /^PASS pdf page is drawn at the width asked \(600 x 849/,
      ),
    ).toBeTruthy();
    // The in-memory module reports its own page count, so the row fails here; what matters is that it runs.
    expect(
      await findByText(/^(PASS|FAIL) pdf opens a 300-page file/),
    ).toBeTruthy();
    expect(await findByLabelText("Sample PDF page")).toBeTruthy();
    // The second drawing is at the width the viewer would ask on this screen, not the fixed 600.
    expect(memory.calls.rendered[1]?.width).toBeGreaterThan(600);
  });
});
