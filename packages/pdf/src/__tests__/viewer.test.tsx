import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { PdfProvider, PdfViewer, createPdfError } from "..";
import type { PdfViewerProps } from "..";
import { createMemoryPdf, type MemoryPdfOptions } from "../testing";

const open = async (
  props: Partial<PdfViewerProps> = {},
  options: MemoryPdfOptions = {},
) => {
  const memory = createMemoryPdf(options);
  const tree = (extra: Partial<PdfViewerProps> = {}) => (
    <ThemeProvider>
      <PdfProvider adapters={memory.adapters}>
        <PdfViewer source={{ uri: "https://x/a.pdf" }} {...props} {...extra} />
      </PdfProvider>
    </ThemeProvider>
  );
  const view = await render(tree());
  return { ...memory, view, tree };
};

const ready = () => screen.findByLabelText("Go to page");

describe("PdfViewer", () => {
  it("downloads with the headers, opens the file, shows the page count and cleans up", async () => {
    const { calls, view } = await open({
      source: {
        uri: "https://x/a.pdf",
        headers: { Authorization: "Bearer t" },
      },
    });
    await ready();
    expect(calls.downloaded).toEqual([
      { uri: "https://x/a.pdf", headers: { Authorization: "Bearer t" } },
    ]);
    expect(calls.opened).toEqual(["file:///memory/1.pdf"]);
    expect(screen.getByText("/ 3")).toBeTruthy();

    await view.unmount();
    expect(calls.closed).toEqual(["file:///memory/1.pdf"]);
    expect(calls.removed).toEqual(["file:///memory/1.pdf"]);
  });

  it("shows that it is opening until the document is ready", async () => {
    const memory = createMemoryPdf();
    let finish: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const realOpen = memory.adapters.native.open;
    memory.adapters.native.open = async (uri) => {
      await gate;
      return realOpen(uri);
    };
    await render(
      <ThemeProvider>
        <PdfProvider adapters={memory.adapters}>
          <PdfViewer source={{ uri: "file:///a.pdf" }} />
        </PdfProvider>
      </ThemeProvider>,
    );
    expect(screen.getByLabelText("Opening the document")).toBeTruthy();
    expect(screen.queryByLabelText("Go to page")).toBeNull();
    finish();
    await ready();
    expect(screen.queryByLabelText("Opening the document")).toBeNull();
  });

  it("stops the transfer when it is unmounted before the download ends", async () => {
    const memory = createMemoryPdf();
    let signal: AbortSignal | undefined;
    memory.adapters.files.download = (_uri, _headers, options) =>
      new Promise((_resolve, reject) => {
        signal = options?.signal;
        signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    const view = await render(
      <ThemeProvider>
        <PdfProvider adapters={memory.adapters}>
          <PdfViewer source={{ uri: "https://x/a.pdf" }} />
        </PdfProvider>
      </ThemeProvider>,
    );
    expect(signal?.aborted).toBe(false);
    await view.unmount();
    expect(signal?.aborted).toBe(true);
    expect(memory.calls.opened).toEqual([]);
  });

  it("opens a local file as it is and leaves it where it is", async () => {
    const { calls, view } = await open({
      source: { uri: "file:///docs/a.pdf" },
    });
    await ready();
    expect(calls.downloaded).toEqual([]);
    expect(calls.opened).toEqual(["file:///docs/a.pdf"]);
    await view.unmount();
    expect(calls.closed).toEqual(["file:///docs/a.pdf"]);
    expect(calls.removed).toEqual([]);
  });

  it("opens base64 and bytes through a temporary file", async () => {
    const text = await open({ source: { base64: "aGVsbG8=" } });
    await ready();
    expect(text.calls.written).toHaveLength(1);
    const bytes = await open({ source: { bytes: new Uint8Array([1, 2, 3]) } });
    await screen.findAllByLabelText("Go to page");
    expect(bytes.calls.written).toHaveLength(1);
  });

  it("does not open again when the parent passes the same content as a new object", async () => {
    const { calls, view, tree } = await open({
      source: { uri: "https://x/a.pdf" },
    });
    await ready();
    await view.rerender(tree({ source: { uri: "https://x/a.pdf" } }));
    await ready();
    expect(calls.opened).toHaveLength(1);
  });

  it("opens the new document when the source changes", async () => {
    const { calls, view, tree } = await open({
      source: { uri: "https://x/a.pdf" },
    });
    await ready();
    await view.rerender(tree({ source: { uri: "https://x/b.pdf" } }));
    await waitFor(() => expect(calls.opened).toHaveLength(2));
    expect(calls.removed).toEqual(["file:///memory/1.pdf"]);
  });

  it("shows the error for the code, reports it, and opens again on retry", async () => {
    const onError = jest.fn();
    const { calls } = await open(
      { onError },
      { openError: createPdfError("password", "locked") },
    );
    expect(
      await screen.findByText("This PDF is protected by a password."),
    ).toBeTruthy();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "password" }),
    );
    expect(calls.removed).toEqual(["file:///memory/1.pdf"]);

    await fireEvent.press(screen.getByText("Try again"));
    await waitFor(() => expect(calls.opened).toHaveLength(2));
  });

  it("shows a network error when the download fails", async () => {
    await open({}, { downloadError: new Error("401") });
    expect(
      await screen.findByText("The file could not be downloaded."),
    ).toBeTruthy();
  });

  it("uses the labels it is given", async () => {
    await open({
      labels: {
        goToPage: "Vai a pagina",
        errors: { network: "Errore di rete." } as never,
      },
    });
    expect(await screen.findByLabelText("Vai a pagina")).toBeTruthy();
  });

  it("goes to a page, and reports the change", async () => {
    const onPageChange = jest.fn();
    await open({ onPageChange });
    const field = await ready();
    await fireEvent.changeText(field, "2");
    await fireEvent(field, "submitEditing");
    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(2, 3));
    expect(screen.getByLabelText("Go to page").props.value).toBe("2");
    await fireEvent.press(screen.getByLabelText("Next page"));
    await waitFor(() => expect(onPageChange).toHaveBeenLastCalledWith(3, 3));
    expect(screen.getByLabelText("Next page")).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Go to page"), "99");
    await fireEvent(screen.getByLabelText("Go to page"), "submitEditing");
    expect(screen.getByLabelText("Go to page").props.value).toBe("3");
  });

  it("asks for a wider drawing when zoomed in, and back to fit", async () => {
    const { calls } = await open();
    await ready();
    await waitFor(() => expect(calls.rendered.length).toBeGreaterThan(0));
    const before = Math.max(...calls.rendered.map((r) => r.width));
    await fireEvent.press(screen.getByLabelText("Zoom in"));
    expect(screen.getByText("125%")).toBeTruthy();
    await waitFor(() =>
      expect(Math.max(...calls.rendered.map((r) => r.width))).toBeGreaterThan(
        before,
      ),
    );
    await fireEvent.press(screen.getByLabelText("Fit to width"));
    expect(screen.getByText("100%")).toBeTruthy();
  });

  describe("pages that are not what they should be", () => {
    it("opens a document whose page reports no size, instead of laying out NaN", async () => {
      await open(
        {},
        {
          pages: [
            { width: 0, height: 0 },
            { width: 595, height: 842 },
          ],
        },
      );
      await ready();
      expect(screen.getByText("/ 2")).toBeTruthy();
    });

    it("never asks for more pixels than a page of that shape can take", async () => {
      const { calls } = await open(
        {},
        { pages: [{ width: 595, height: 8420 }] },
      );
      await ready();
      await waitFor(() => expect(calls.rendered.length).toBeGreaterThan(0));
      calls.rendered.forEach(({ width }) => {
        expect(width * ((width * 8420) / 595)).toBeLessThanOrEqual(10_000_000);
      });
    });

    it("says a page could not be drawn, and draws it again on a tap", async () => {
      const memory = createMemoryPdf({ pages: [{ width: 595, height: 842 }] });
      const draw = memory.adapters.native.renderPage;
      let failures = 1;
      memory.adapters.native.renderPage = async (uri, index, width) => {
        if (failures-- > 0) throw new Error("out of memory");
        return draw(uri, index, width);
      };
      await render(
        <ThemeProvider>
          <PdfProvider adapters={memory.adapters}>
            <PdfViewer source={{ uri: "file:///a.pdf" }} />
          </PdfProvider>
        </ThemeProvider>,
      );
      const failed = await screen.findByLabelText(
        "This page could not be drawn. Tap to try again.",
      );
      await fireEvent.press(failed);
      await waitFor(() =>
        expect(
          screen.queryByLabelText(
            "This page could not be drawn. Tap to try again.",
          ),
        ).toBeNull(),
      );
    });
  });

  describe("search", () => {
    const hit = {
      page: 1,
      rects: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.02 }],
    };

    it("finds a word, counts the results and steps through them", async () => {
      const onPageChange = jest.fn();
      const { calls } = await open(
        { onPageChange },
        { search: { hello: [hit, { ...hit, page: 2 }] } },
      );
      await ready();
      await fireEvent.press(screen.getByLabelText("Search in the document"));
      const box = await screen.findByPlaceholderText("Search");
      await fireEvent.changeText(box, "hello");
      await fireEvent(box, "submitEditing", { nativeEvent: { text: "hello" } });
      expect(await screen.findByText("1 / 2")).toBeTruthy();
      // One call per page, from the page being read.
      expect(calls.searched).toEqual([
        { uri: "file:///memory/1.pdf", page: 0, query: "hello" },
        { uri: "file:///memory/1.pdf", page: 1, query: "hello" },
        { uri: "file:///memory/1.pdf", page: 2, query: "hello" },
      ]);
      await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(2, 3));

      await fireEvent.press(screen.getByLabelText("Next result"));
      expect(await screen.findByText("2 / 2")).toBeTruthy();
      await waitFor(() => expect(onPageChange).toHaveBeenLastCalledWith(3, 3));
      await fireEvent.press(screen.getByLabelText("Next result"));
      expect(await screen.findByText("1 / 2")).toBeTruthy();
      await fireEvent.press(screen.getByLabelText("Previous result"));
      expect(await screen.findByText("2 / 2")).toBeTruthy();
    });

    it("starts at the page being read and goes round to the ones before it", async () => {
      const { calls } = await open();
      const field = await ready();
      await fireEvent.changeText(field, "3");
      await fireEvent(field, "submitEditing");
      await waitFor(() =>
        expect(screen.getByLabelText("Go to page").props.value).toBe("3"),
      );
      await fireEvent.press(screen.getByLabelText("Search in the document"));
      const box = await screen.findByPlaceholderText("Search");
      await fireEvent.changeText(box, "zzz");
      await fireEvent(box, "submitEditing", { nativeEvent: { text: "zzz" } });
      expect(await screen.findByText("No results")).toBeTruthy();
      expect(calls.searched.map((c) => c.page)).toEqual([2, 0, 1]);
    });

    it("shows how far it got while it searches, and stops when the panel is closed", async () => {
      const memory = createMemoryPdf();
      const gates: (() => void)[] = [];
      const asked: number[] = [];
      memory.adapters.native.searchPage = (_uri, page) =>
        new Promise((resolve) => {
          asked.push(page);
          gates.push(() => resolve([]));
        });
      await render(
        <ThemeProvider>
          <PdfProvider adapters={memory.adapters}>
            <PdfViewer source={{ uri: "file:///a.pdf" }} />
          </PdfProvider>
        </ThemeProvider>,
      );
      await ready();
      await fireEvent.press(screen.getByLabelText("Search in the document"));
      const box = await screen.findByPlaceholderText("Search");
      await fireEvent.changeText(box, "hello");
      await fireEvent(box, "submitEditing", { nativeEvent: { text: "hello" } });
      expect(await screen.findByText("Searching… 0 / 3")).toBeTruthy();
      await act(async () => gates[0]());
      expect(await screen.findByText("Searching… 1 / 3")).toBeTruthy();
      // The panel is closed with page 2 being searched: page 3 is never asked.
      await fireEvent.press(screen.getByLabelText("Search in the document"));
      await act(async () => gates[1]());
      expect(asked).toEqual([0, 1]);
    });

    it("says when nothing is found", async () => {
      await open();
      await ready();
      await fireEvent.press(screen.getByLabelText("Search in the document"));
      const box = await screen.findByPlaceholderText("Search");
      await fireEvent.changeText(box, "zzz");
      await fireEvent(box, "submitEditing", { nativeEvent: { text: "zzz" } });
      expect(await screen.findByText("No results")).toBeTruthy();
      expect(screen.getByLabelText("Next result")).toBeDisabled();
    });

    it("has no search button on a device that cannot search", async () => {
      await open({}, { search: false });
      await ready();
      expect(screen.queryByLabelText("Search in the document")).toBeNull();
    });
  });

  it("prints and saves the opened file under the given name", async () => {
    const { calls } = await open({ fileName: "contract.pdf" });
    await ready();
    await fireEvent.press(screen.getByLabelText("Print"));
    await fireEvent.press(screen.getByLabelText("Save"));
    await waitFor(() => {
      expect(calls.printed).toEqual([
        { uri: "file:///memory/1.pdf", name: "contract.pdf" },
      ]);
      expect(calls.saved).toEqual([
        { uri: "file:///memory/1.pdf", name: "contract.pdf" },
      ]);
    });
  });

  it("hides the toolbar when asked", async () => {
    await open({ toolbar: false });
    await waitFor(() =>
      expect(screen.queryByLabelText("Opening the document")).toBeNull(),
    );
    expect(screen.queryByLabelText("Go to page")).toBeNull();
  });
});
