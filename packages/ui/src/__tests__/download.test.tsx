import React from "react";
import { Platform, Share, Text } from "react-native";
import {
  act,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react-native";
import { Download, ThemeProvider, useDownload } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const global_ = globalThis as Record<string, unknown>;

// A page with just enough document to click a temporary link, recording what
// the link was and what Blob it pointed at.
const stubPage = () => {
  const link = {
    href: "",
    download: "",
    rel: "",
    style: {} as Record<string, string>,
    click: jest.fn(),
    remove: jest.fn(),
  };
  const body = { appendChild: jest.fn() };
  global_.document = { createElement: jest.fn(() => link), body };
  const blobs: Blob[] = [];
  const createObjectURL = jest.fn((blob: Blob) => {
    blobs.push(blob);
    return "blob:fake";
  });
  const revokeObjectURL = jest.fn();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  return { link, body, blobs, revokeObjectURL };
};

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  delete global_.document;
  delete global_.fetch;
});

describe("Download button", () => {
  it("is a button with the download icon and a default label", async () => {
    const { getByRole, getByText } = await draw(<Download data="x" />);
    expect(getByRole("button", { name: "Download" })).toBeTruthy();
    expect(getByText("Download")).toBeTruthy();
  });

  it("takes its label as children, and disables", async () => {
    const { getByRole } = await draw(
      <Download data="x" disabled>
        Export rows
      </Download>,
    );
    const button = getByRole("button", { name: "Export rows" });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("a function as children draws your own trigger", async () => {
    const save = jest.fn();
    const { getByText } = await draw(
      <Download data="payload" filename="p.txt" save={save}>
        {({ download, downloading }) => (
          <Text onPress={() => void download()}>
            {downloading ? "Saving" : "Save it"}
          </Text>
        )}
      </Download>,
    );
    await fireEvent.press(getByText("Save it"));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ name: "p.txt", data: "payload" }),
    );
  });

  it("is busy while it saves", async () => {
    let finish: () => void = () => {};
    const save = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const onDownload = jest.fn();
    const { getByRole } = await draw(
      <Download data="x" save={save} onDownload={onDownload} />,
    );
    await fireEvent.press(getByRole("button", { name: "Download" }));
    expect(
      getByRole("button", { name: "Download" }).props.accessibilityState,
    ).toMatchObject({ busy: true });
    // A second press while it works does nothing.
    await fireEvent.press(getByRole("button", { name: "Download" }));
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(
      getByRole("button", { name: "Download" }).props.accessibilityState,
    ).toMatchObject({ busy: false });
  });
});

describe("the files it builds", () => {
  const saved = async (props: React.ComponentProps<typeof Download>) => {
    const save = jest.fn();
    const { getByRole } = await draw(<Download {...props} save={save} />);
    await fireEvent.press(getByRole("button"));
    return save.mock.calls[0]?.[0];
  };

  it("a string is saved as text", async () => {
    expect(await saved({ data: "hello" })).toEqual({
      name: "download.txt",
      mimeType: "text/plain",
      data: "hello",
    });
  });

  it("an object is saved as JSON", async () => {
    const file = await saved({ data: { a: 1, b: [2] } });
    expect(file).toMatchObject({
      name: "download.json",
      mimeType: "application/json",
    });
    expect(JSON.parse(file.data)).toEqual({ a: 1, b: [2] });
  });

  it("a Blob is passed on, with its own type", async () => {
    const blob = new Blob(["abc"], { type: "image/png" });
    const file = await saved({ data: blob, filename: "pic.png" });
    expect(file).toMatchObject({ name: "pic.png", mimeType: "image/png" });
    expect(file.data).toBe(blob);
    const untyped = await saved({ data: new Blob(["x"]) });
    expect(untyped.mimeType).toBe("application/octet-stream");
  });

  it("the filename's extension tells the type, and an explicit type wins", async () => {
    expect((await saved({ data: "a,b", filename: "t.csv" })).mimeType).toBe(
      "text/csv",
    );
    expect(
      (
        await saved({
          data: "a,b",
          filename: "t.csv",
          mimeType: "text/x-custom",
        })
      ).mimeType,
    ).toBe("text/x-custom");
  });

  it("data wins over url", async () => {
    const file = await saved({ data: "mine", url: "https://x.test/a.txt" });
    expect(file.data).toBe("mine");
  });

  it("needs data or a url", async () => {
    const onError = jest.fn();
    const { getByRole } = await draw(<Download onError={onError} />);
    await fireEvent.press(getByRole("button"));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Download needs `data` or a `url`" }),
    );
  });
});

describe("on web", () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, "OS", "web");
  });

  it("clicks a temporary link to a Blob of the content, and cleans up", async () => {
    jest.useFakeTimers();
    const page = stubPage();
    const onDownload = jest.fn();
    const { getByRole } = await draw(
      <Download data="a,b" filename="rows.csv" onDownload={onDownload} />,
    );
    await fireEvent.press(getByRole("button"));

    expect(page.link).toMatchObject({
      href: "blob:fake",
      download: "rows.csv",
    });
    expect(page.link.click).toHaveBeenCalledTimes(1);
    expect(page.body.appendChild).toHaveBeenCalledWith(page.link);
    expect(page.link.remove).toHaveBeenCalled();
    expect(page.blobs[0].type).toBe("text/csv");
    expect(await page.blobs[0].text()).toBe("a,b");
    expect(onDownload).toHaveBeenCalledWith(
      expect.objectContaining({ name: "rows.csv" }),
    );
    // The object URL is released a moment after the download started.
    expect(page.revokeObjectURL).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    expect(page.revokeObjectURL).toHaveBeenCalledWith("blob:fake");
  });

  it("serialises an object to JSON in the Blob", async () => {
    const page = stubPage();
    const { getByRole } = await draw(<Download data={{ ok: true }} />);
    await fireEvent.press(getByRole("button"));
    expect(page.link.download).toBe("download.json");
    expect(JSON.parse(await page.blobs[0].text())).toEqual({ ok: true });
  });

  it("fetches a url into a Blob first, and names the file after it", async () => {
    const page = stubPage();
    const fetched = new Blob(["%PDF"], { type: "application/pdf" });
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => fetched,
    });
    global_.fetch = fetchMock;
    const { getByRole } = await draw(
      <Download url="https://x.test/files/report.pdf?token=1" />,
    );
    await fireEvent.press(getByRole("button"));
    expect(fetchMock).toHaveBeenCalledWith(
      "https://x.test/files/report.pdf?token=1",
    );
    expect(page.link.download).toBe("report.pdf");
    expect(page.blobs[0].type).toBe("application/pdf");
  });

  it("reports a failed fetch instead of saving", async () => {
    const page = stubPage();
    global_.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    const onError = jest.fn();
    const onDownload = jest.fn();
    const { getByRole } = await draw(
      <Download
        url="https://x.test/gone.pdf"
        onError={onError}
        onDownload={onDownload}
      />,
    );
    await fireEvent.press(getByRole("button"));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Could not fetch gone.pdf (404)" }),
    );
    expect(onDownload).not.toHaveBeenCalled();
    expect(page.link.click).not.toHaveBeenCalled();
  });

  it("a save writer replaces the link", async () => {
    const page = stubPage();
    const save = jest.fn();
    const { getByRole } = await draw(<Download data="x" save={save} />);
    await fireEvent.press(getByRole("button"));
    expect(save).toHaveBeenCalledTimes(1);
    expect(page.link.click).not.toHaveBeenCalled();
  });

  it("has no page to save from when rendered on a server, and says so instead of crashing", async () => {
    const onError = jest.fn();
    const { getByRole } = await draw(<Download data="x" onError={onError} />);
    await fireEvent.press(getByRole("button"));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "There is no page to save the file from",
      }),
    );
  });
});

describe("on native", () => {
  it("shares the text of a string or an object", async () => {
    const share = jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: Share.sharedAction });
    const { getByRole } = await draw(
      <Download data="hello" filename="note.txt" />,
    );
    await fireEvent.press(getByRole("button"));
    expect(share).toHaveBeenCalledWith({ message: "hello", title: "note.txt" });

    share.mockClear();
    const json = await draw(<Download data={{ a: 1 }} />);
    await fireEvent.press(json.getByRole("button"));
    expect(share).toHaveBeenCalledWith({
      message: JSON.stringify({ a: 1 }, null, 2),
      title: "download.json",
    });
  });

  it("shares a url as a link, without fetching it", async () => {
    const share = jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: Share.sharedAction });
    const fetchMock = jest.fn();
    global_.fetch = fetchMock;
    const ios = await draw(<Download url="https://x.test/r.pdf" />);
    await fireEvent.press(ios.getByRole("button"));
    expect(share).toHaveBeenCalledWith({
      url: "https://x.test/r.pdf",
      title: "r.pdf",
    });

    share.mockClear();
    jest.replaceProperty(Platform, "OS", "android");
    const android = await draw(<Download url="https://x.test/r.pdf" />);
    await fireEvent.press(android.getByRole("button"));
    expect(share).toHaveBeenCalledWith({
      message: "https://x.test/r.pdf",
      title: "r.pdf",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("a Blob needs a writer: without one it reports an error", async () => {
    jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: Share.sharedAction });
    const onError = jest.fn();
    const { getByRole } = await draw(
      <Download data={new Blob(["x"])} onError={onError} />,
    );
    await fireEvent.press(getByRole("button"));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("needs a `save` writer"),
      }),
    );
  });

  it("hands a url to the writer as it is, for the app to download its own way", async () => {
    const save = jest.fn();
    const { getByRole } = await draw(
      <Download url="https://x.test/files/data.zip" save={save} />,
    );
    await fireEvent.press(getByRole("button"));
    expect(save).toHaveBeenCalledWith({
      name: "data.zip",
      mimeType: "application/zip",
      url: "https://x.test/files/data.zip",
    });
  });
});

describe("useDownload", () => {
  it("reports downloading, the error, and clears the error on the next try", async () => {
    const save = jest
      .fn()
      .mockRejectedValueOnce(new Error("disk full"))
      .mockResolvedValueOnce(undefined);
    const onError = jest.fn();
    const { result } = await renderHook(() => useDownload({ save, onError }));
    expect(result.current).toMatchObject({
      downloading: false,
      error: undefined,
    });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.download({ data: "x" });
    });
    expect(ok).toBe(false);
    expect(result.current.error?.message).toBe("disk full");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.downloading).toBe(false);

    await act(async () => {
      ok = await result.current.download({ data: "x" });
    });
    expect(ok).toBe(true);
    expect(result.current.error).toBeUndefined();
  });

  it("wraps a thrown non-error", async () => {
    const { result } = await renderHook(() =>
      useDownload({
        save: () => {
          throw "boom";
        },
      }),
    );
    await act(async () => {
      await result.current.download({ data: "x" });
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("boom");
  });
});
