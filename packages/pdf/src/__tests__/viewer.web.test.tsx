import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { createPdfError } from "..";
import PdfViewer from "../PdfViewer.web";
import type { PdfViewerProps } from "../types";
import { loadPdfBlob } from "../webSource";

jest.mock("../webSource", () => ({ loadPdfBlob: jest.fn() }));

const loadMock = loadPdfBlob as jest.Mock;
const createObjectURL = jest.fn(() => "blob:mock/1");
const revokeObjectURL = jest.fn();

type Json = {
  type: string;
  props: Record<string, unknown>;
  children?: Json[] | null;
};
/** The first host element of a type in the rendered tree. */
const findHost = (node: Json | Json[] | null, type: string): Json | null => {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findHost(child, type);
      if (hit) return hit;
    }
    return null;
  }
  return node.type === type ? node : findHost(node.children ?? null, type);
};
const iframe = () =>
  findHost(screen.toJSON() as Json | Json[] | null, "iframe");

const open = (props: Partial<PdfViewerProps> = {}) =>
  render(
    <ThemeProvider>
      <PdfViewer source={{ uri: "https://x/a.pdf" }} {...props} />
    </ThemeProvider>,
  );

beforeEach(() => {
  loadMock.mockReset().mockResolvedValue(new Uint8Array([1]));
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
});

describe("PdfViewer on the web", () => {
  it("shows the blob in the browser's viewer, reports the load and frees the URL", async () => {
    const onLoad = jest.fn();
    const view = await open({ onLoad, fileName: "contract.pdf" });
    await waitFor(() => expect(iframe()).not.toBeNull());
    expect(iframe()?.props.src).toBe("blob:mock/1");
    expect(iframe()?.props.title).toBe("contract.pdf");
    expect(onLoad).toHaveBeenCalledWith({ pages: null });
    await view.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock/1");
  });

  it("opens on the page asked for", async () => {
    await open({ initialPage: 3 });
    await waitFor(() => expect(iframe()).not.toBeNull());
    expect(iframe()?.props.src).toBe("blob:mock/1#page=3");
  });

  it("shows the error for its code, reports it, and loads again on retry", async () => {
    loadMock.mockRejectedValue(createPdfError("network", "401 Unauthorized"));
    const onError = jest.fn();
    await open({ onError });
    expect(
      await screen.findByText("The file could not be downloaded."),
    ).toBeTruthy();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "network" }),
    );
    expect(iframe()).toBeNull();

    loadMock.mockResolvedValue(new Uint8Array([1]));
    await fireEvent.press(screen.getByText("Try again"));
    await waitFor(() => expect(iframe()).not.toBeNull());
    expect(loadMock).toHaveBeenCalledTimes(2);
  });

  it("opens the PDF in a tab, and saves it under the given name", async () => {
    const link = {
      href: "",
      download: "",
      click: jest.fn(),
      remove: jest.fn(),
    };
    const open_ = jest.fn();
    Object.assign(globalThis, {
      window: Object.assign(globalThis.window ?? {}, { open: open_ }),
      document: {
        createElement: jest.fn(() => link),
        body: { appendChild: jest.fn() },
      },
    });
    await open({ fileName: "contract.pdf" });
    await fireEvent.press(await screen.findByLabelText("Open in a new tab"));
    expect(open_).toHaveBeenCalledWith("blob:mock/1", "_blank", "noopener");
    await fireEvent.press(screen.getByLabelText("Save"));
    expect(link).toMatchObject({
      href: "blob:mock/1",
      download: "contract.pdf",
    });
    expect(link.click).toHaveBeenCalled();
  });

  it("prints through a hidden frame of its own, and takes it away when it goes", async () => {
    const frame: Record<string, unknown> & {
      style: Record<string, unknown>;
      setAttribute: jest.Mock;
      contentWindow: { focus: jest.Mock; print: jest.Mock };
    } = {
      style: {},
      setAttribute: jest.fn(),
      contentWindow: { focus: jest.fn(), print: jest.fn() },
    };
    const appended = jest.fn();
    const remove = jest.fn();
    Object.assign(globalThis, {
      document: {
        createElement: jest.fn(() => frame),
        body: { appendChild: appended },
        getElementById: jest.fn(() => ({ remove })),
      },
    });
    const view = await open();
    await fireEvent.press(await screen.findByLabelText("Print"));
    expect(frame.src).toBe("blob:mock/1");
    expect(appended).toHaveBeenCalledWith(frame);
    // Nothing prints until the frame has loaded the PDF.
    expect(frame.contentWindow.print).not.toHaveBeenCalled();
    (frame.onload as () => void)();
    expect(frame.contentWindow.print).toHaveBeenCalled();

    remove.mockClear();
    await view.unmount();
    expect(remove).toHaveBeenCalled();
  });

  it("falls back to a tab when the browser will not print the frame", async () => {
    const open_ = jest.fn();
    const frame = {
      style: {},
      setAttribute: jest.fn(),
      contentWindow: {
        focus: jest.fn(),
        print: jest.fn(() => {
          throw new Error("blocked");
        }),
      },
    } as Record<string, unknown>;
    Object.assign(globalThis, {
      window: Object.assign(globalThis.window ?? {}, { open: open_ }),
      document: {
        createElement: jest.fn(() => frame),
        body: { appendChild: jest.fn() },
        getElementById: jest.fn(() => null),
      },
    });
    await open();
    await fireEvent.press(await screen.findByLabelText("Print"));
    (frame.onload as () => void)();
    expect(open_).toHaveBeenCalledWith("blob:mock/1", "_blank", "noopener");
  });

  it("has no buttons when the toolbar is off", async () => {
    await open({ toolbar: false });
    await waitFor(() => expect(iframe()).not.toBeNull());
    expect(screen.queryByLabelText("Open in a new tab")).toBeNull();
  });
});
