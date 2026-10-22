import React, { useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import {
  ThemeProvider,
  Upload,
  acceptMatches,
  formatBytes,
  useTheme,
  validateFiles,
  type PickedFile,
  type UploadFile,
  type UploadHandlers,
  type UploadProps,
  type UploadRejection,
} from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

afterEach(() => {
  jest.restoreAllMocks();
});

describe("formatBytes", () => {
  it.each([
    [0, "0 B"],
    [1, "1 B"],
    [999, "999 B"],
    [1023, "1023 B"],
    [1024, "1 KB"],
    [1536, "1.5 KB"],
    [5 * 1024 * 1024, "5 MB"],
    [1.25 * 1024 * 1024, "1.3 MB"],
    [3 * 1024 ** 3, "3 GB"],
    [2 * 1024 ** 4, "2 TB"],
    [5000 * 1024 ** 4, "5000 TB"],
  ])("%d is %s", (bytes, text) => {
    expect(formatBytes(bytes)).toBe(text);
  });

  it("rounds up into the next unit instead of reading 1024", () => {
    expect(formatBytes(1024 * 1024 - 1)).toBe("1 MB");
    expect(formatBytes(1024 ** 3 - 10)).toBe("1 GB");
  });

  it("takes the decimals", () => {
    expect(formatBytes(1536, 0)).toBe("2 KB");
    expect(formatBytes(1234567, 2)).toBe("1.18 MB");
  });

  it("reads a negative or non-numeric size as zero", () => {
    expect(formatBytes(-5)).toBe("0 B");
    expect(formatBytes(NaN)).toBe("0 B");
    expect(formatBytes(Infinity)).toBe("0 B");
  });
});

describe("acceptMatches", () => {
  const png = { name: "Photo.PNG", type: "image/png" };
  const pdf = { name: "doc.pdf", type: "application/pdf" };

  it("accepts anything with no filter", () => {
    expect(acceptMatches(png)).toBe(true);
    expect(acceptMatches(png, "")).toBe(true);
    expect(acceptMatches(png, " , ")).toBe(true);
    expect(acceptMatches(png, [])).toBe(true);
  });

  it("matches a wildcard media type", () => {
    expect(acceptMatches(png, "image/*")).toBe(true);
    expect(acceptMatches(pdf, "image/*")).toBe(false);
  });

  it("matches an exact media type", () => {
    expect(acceptMatches(pdf, "application/pdf")).toBe(true);
    expect(acceptMatches(png, "application/pdf")).toBe(false);
    // `image/*` is not a prefix match on the subtype.
    expect(acceptMatches({ name: "a", type: "image" }, "image/*")).toBe(false);
  });

  it("matches an extension, whatever its case", () => {
    expect(acceptMatches(png, ".png")).toBe(true);
    expect(acceptMatches(png, ".PNG")).toBe(true);
    expect(acceptMatches(png, ".jpg")).toBe(false);
    expect(acceptMatches({ name: "a.tar.gz", type: "" }, ".gz")).toBe(true);
    // An extension must be at the end of the name.
    expect(acceptMatches({ name: "a.png.exe", type: "" }, ".png")).toBe(false);
  });

  it("takes a list, with spaces, or an array; any entry is enough", () => {
    expect(acceptMatches(pdf, "image/*, .pdf")).toBe(true);
    expect(acceptMatches(pdf, ["image/*", ".pdf"])).toBe(true);
    expect(acceptMatches(pdf, ["image/*", ".png"])).toBe(false);
  });

  it("a file with no media type matches by extension only", () => {
    const bare = { name: "notes.txt", type: "" };
    expect(acceptMatches(bare, ".txt")).toBe(true);
    expect(acceptMatches(bare, "text/plain")).toBe(false);
    expect(acceptMatches(bare, "text/*")).toBe(false);
  });

  it("takes the all-files wildcards", () => {
    expect(acceptMatches(pdf, "*/*")).toBe(true);
    expect(acceptMatches(pdf, "*")).toBe(true);
  });
});

describe("validateFiles", () => {
  const f = (name: string, size = 100, type = "text/plain") => ({
    name,
    size,
    type,
  });

  it("accepts everything with no rules", () => {
    const files = [f("a"), f("b")];
    expect(validateFiles(files)).toEqual({ accepted: files, rejected: [] });
  });

  it("rejects the wrong type, with its message", () => {
    const { accepted, rejected } = validateFiles(
      [f("a.txt"), f("b.png", 1, "image/png")],
      { accept: "text/*" },
    );
    expect(accepted.map((x) => x.name)).toEqual(["a.txt"]);
    expect(rejected).toEqual([
      {
        file: expect.objectContaining({ name: "b.png" }),
        reason: "wrong-type",
        message: "b.png is not an accepted file type",
      },
    ]);
  });

  it("rejects the too large, the limit itself being fine", () => {
    const { accepted, rejected } = validateFiles(
      [f("ok", 2048), f("big", 2049)],
      { maxSize: 2048 },
    );
    expect(accepted.map((x) => x.name)).toEqual(["ok"]);
    expect(rejected[0]).toMatchObject({
      reason: "too-large",
      message: "big is larger than 2 KB",
    });
  });

  it("rejects what does not fit in the list, counting what is already there", () => {
    const files = [f("a"), f("b"), f("c")];
    const { accepted, rejected } = validateFiles(files, {
      maxFiles: 3,
      count: 1,
    });
    expect(accepted.map((x) => x.name)).toEqual(["a", "b"]);
    expect(rejected).toEqual([
      expect.objectContaining({
        reason: "too-many",
        message: "You can add up to 3 files",
      }),
    ]);
    expect(validateFiles(files, { maxFiles: 1 }).rejected[0].message).toBe(
      "Only one file is allowed",
    );
    expect(validateFiles(files, { maxFiles: 3, count: 3 }).accepted).toEqual(
      [],
    );
  });

  it("checks the type, then the size, then the room, and rejected files take no room", () => {
    const { accepted, rejected } = validateFiles(
      [
        f("a.png", 5000, "image/png"), // wrong type (and too large): the type is said
        f("b.txt", 5000), // too large
        f("c.txt", 10),
        f("d.txt", 10), // no room: one file
      ],
      { accept: "text/*", maxSize: 1000, maxFiles: 1 },
    );
    expect(accepted.map((x) => x.name)).toEqual(["c.txt"]);
    expect(rejected.map((r) => r.reason)).toEqual([
      "wrong-type",
      "too-large",
      "too-many",
    ]);
  });

  it("keeps the file it was given, and its extra fields", () => {
    const file = { ...f("a"), uri: "file:///a" };
    expect(validateFiles([file]).accepted[0]).toBe(file);
  });
});

// --- the component ---------------------------------------------------------

const deferred = () => {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const picked = (name: string, size = 1000, type = "image/png"): PickedFile => ({
  name,
  size,
  type,
  uri: `file:///${name}`,
});

/** Draws an Upload with an `onPick` returning these files. */
const pickFrom = (files: PickedFile[], props: Partial<UploadProps> = {}) =>
  draw(<Upload multiple onPick={async () => files} {...props} />);

describe("Upload on native", () => {
  it("draws nothing with no way to pick and no files", async () => {
    const { toJSON } = await draw(<Upload label="Files" />);
    expect(toJSON()).toBeNull();
  });

  it("still lists the files it holds, with no way to add more", async () => {
    const { getByText, queryByRole } = await draw(
      <Upload
        defaultValue={[
          {
            id: "1",
            name: "kept.pdf",
            size: 2048,
            type: "application/pdf",
            status: "done",
          },
        ]}
      />,
    );
    expect(getByText("kept.pdf")).toBeTruthy();
    expect(getByText("2 KB · Uploaded")).toBeTruthy();
    expect(queryByRole("button", { name: /Choose/ })).toBeNull();
  });

  it("is a dropzone button that opens the picker and lists what came back", async () => {
    const onPick = jest.fn(async () => [picked("a.png", 1536)]);
    const onChange = jest.fn();
    const { getByRole, getByText } = await draw(
      <Upload multiple onPick={onPick} onChange={onChange} />,
    );
    await fireEvent.press(getByRole("button", { name: "Choose files" }));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(getByText("a.png")).toBeTruthy();
    expect(getByText("1.5 KB")).toBeTruthy();

    const list = onChange.mock.calls.at(-1)![0] as UploadFile[];
    expect(list).toEqual([
      expect.objectContaining({
        name: "a.png",
        size: 1536,
        type: "image/png",
        uri: "file:///a.png",
        status: "pending",
        id: expect.any(String),
      }),
    ]);
  });

  it("says 'Choose a file' for a single file", async () => {
    const { getByRole } = await draw(<Upload onPick={async () => []} />);
    expect(getByRole("button", { name: "Choose a file" })).toBeTruthy();
  });

  it("takes a prompt of its own, and a button variant", async () => {
    const onPick = jest.fn(async () => [picked("a.png")]);
    const { getByRole, getByText } = await draw(
      <Upload variant="button" prompt="Add photo" onPick={onPick} />,
    );
    await fireEvent.press(getByRole("button", { name: "Add photo" }));
    expect(onPick).toHaveBeenCalled();
    expect(getByText("a.png")).toBeTruthy();
  });

  it("keeps the ids an adapter gave, and appends to the list with multiple", async () => {
    const batches = [[{ ...picked("a.png"), id: "mine-1" }], [picked("b.png")]];
    const onChange = jest.fn();
    const { getByRole } = await draw(
      <Upload
        multiple
        onPick={async () => batches.shift()!}
        onChange={onChange}
      />,
    );
    await fireEvent.press(getByRole("button", { name: "Choose files" }));
    await fireEvent.press(getByRole("button", { name: "Choose files" }));
    const list = onChange.mock.calls.at(-1)![0] as UploadFile[];
    expect(list.map((f) => f.name)).toEqual(["a.png", "b.png"]);
    expect(list[0].id).toBe("mine-1");
    expect(list[1].id).not.toBe("mine-1");
  });

  it("a new file replaces the old one without multiple", async () => {
    const batches = [[picked("a.png")], [picked("b.png")]];
    const { getByRole, getByText, queryByText } = await draw(
      <Upload onPick={async () => batches.shift()!} />,
    );
    await fireEvent.press(getByRole("button", { name: "Choose a file" }));
    await fireEvent.press(getByRole("button", { name: "Choose a file" }));
    expect(queryByText("a.png")).toBeNull();
    expect(getByText("b.png")).toBeTruthy();
  });

  it("without multiple only the first of several picked files is kept", async () => {
    const onReject = jest.fn();
    const { getByRole, getByText, queryByText } = await draw(
      <Upload
        onPick={async () => [picked("a.png"), picked("b.png")]}
        onReject={onReject}
      />,
    );
    await fireEvent.press(getByRole("button", { name: "Choose a file" }));
    expect(getByText("a.png")).toBeTruthy();
    expect(queryByText("b.png")).toBeNull();
    expect(onReject).toHaveBeenCalledWith([
      expect.objectContaining({ reason: "too-many" }),
    ]);
  });

  it("a cancelled pick, or a picker that throws, adds nothing", async () => {
    const empty = await draw(<Upload onPick={async () => []} />);
    await fireEvent.press(empty.getByRole("button", { name: "Choose a file" }));
    const failing = await draw(
      <Upload
        onPick={async () => {
          throw new Error("cancelled");
        }}
      />,
    );
    await fireEvent.press(
      failing.getByRole("button", { name: "Choose a file" }),
    );
    expect(failing.queryByText(/cancelled/)).toBeNull();
  });

  describe("validation", () => {
    it("reports the rejected, with reasons, and lists the rest", async () => {
      const onReject = jest.fn();
      const { getByRole, getByText, queryByText } = await pickFrom(
        [
          picked("small.png", 100),
          picked("huge.png", 10_000),
          picked("doc.pdf", 100, "application/pdf"),
        ],
        { accept: "image/*", maxSize: 1000, onReject },
      );
      await fireEvent.press(getByRole("button", { name: "Choose files" }));
      expect(getByText("small.png")).toBeTruthy();
      expect(queryByText("huge.png")).toBeNull();
      const rejections = onReject.mock.calls[0][0] as UploadRejection[];
      expect(rejections.map((r) => [r.file.name, r.reason])).toEqual([
        ["huge.png", "too-large"],
        ["doc.pdf", "wrong-type"],
      ]);
    });

    it("with no onReject the reasons show under the field", async () => {
      const { getByRole, getByText } = await pickFrom(
        [picked("huge.png", 10_000), picked("doc.pdf", 1, "application/pdf")],
        { accept: "image/*", maxSize: 1000 },
      );
      await fireEvent.press(getByRole("button", { name: "Choose files" }));
      expect(
        getByText(
          "huge.png is larger than 1000 B. doc.pdf is not an accepted file type",
        ),
      ).toBeTruthy();
    });

    it("the message goes at the next pick that has nothing to reject", async () => {
      const batches = [[picked("huge.png", 10_000)], [picked("ok.png", 1)]];
      const { getByRole, queryByText } = await draw(
        <Upload
          multiple
          maxSize={1000}
          onPick={async () => batches.shift()!}
        />,
      );
      await fireEvent.press(getByRole("button", { name: "Choose files" }));
      expect(queryByText(/larger than/)).toBeTruthy();
      await fireEvent.press(getByRole("button", { name: "Choose files" }));
      expect(queryByText(/larger than/)).toBeNull();
    });

    it("maxFiles counts the files already in the list", async () => {
      const onReject = jest.fn();
      const batches = [
        [picked("a.png"), picked("b.png")],
        [picked("c.png"), picked("d.png")],
      ];
      const { getByRole, getByText, queryByText } = await draw(
        <Upload
          multiple
          maxFiles={3}
          onReject={onReject}
          onPick={async () => batches.shift()!}
        />,
      );
      await fireEvent.press(getByRole("button", { name: "Choose files" }));
      await fireEvent.press(getByRole("button", { name: "Choose files" }));
      expect(getByText("c.png")).toBeTruthy();
      expect(queryByText("d.png")).toBeNull();
      expect(onReject).toHaveBeenCalledWith([
        expect.objectContaining({ reason: "too-many" }),
      ]);
    });
  });

  describe("field texts", () => {
    it("draws a label, the limits and a helper text", async () => {
      const { getByText } = await draw(
        <Upload
          multiple
          label="Attachments"
          helperText="PDF or images"
          maxSize={5 * 1024 * 1024}
          maxFiles={4}
          onPick={async () => []}
        />,
      );
      expect(getByText("Attachments")).toBeTruthy();
      expect(getByText("PDF or images")).toBeTruthy();
      expect(getByText("Up to 5 MB per file · 4 files at most")).toBeTruthy();
    });

    it("an error replaces the helper text and colours the zone", async () => {
      let errorColor = "";
      const Probe = () => {
        errorColor = useTheme().theme.colors.error;
        return null;
      };
      const { getByText, queryByText, getByRole } = await draw(
        <>
          <Probe />
          <Upload
            helperText="Hint"
            error="Pick something"
            onPick={async () => []}
          />
        </>,
      );
      expect(getByText("Pick something")).toBeTruthy();
      expect(queryByText("Hint")).toBeNull();
      expect(
        StyleSheet.flatten(
          getByRole("button", { name: "Choose a file" }).props.style,
        ).borderColor,
      ).toBe(errorColor);
    });

    it("hints the limits to assistive technology on the zone", async () => {
      const { getByRole } = await draw(
        <Upload maxSize={2048} onPick={async () => []} />,
      );
      expect(
        getByRole("button", { name: "Choose a file" }).props.accessibilityHint,
      ).toBe("Up to 2 KB");
    });
  });

  describe("disabled", () => {
    it("does not open the picker", async () => {
      const onPick = jest.fn(async () => []);
      const { getByRole } = await draw(<Upload disabled onPick={onPick} />);
      const zone = getByRole("button", { name: "Choose a file" });
      expect(zone.props.accessibilityState).toMatchObject({ disabled: true });
      await fireEvent.press(zone);
      expect(onPick).not.toHaveBeenCalled();
    });

    it("keeps the files but not the way to remove them", async () => {
      const onChange = jest.fn();
      const { getByRole } = await draw(
        <Upload
          disabled
          onChange={onChange}
          defaultValue={[
            {
              id: "1",
              name: "a.png",
              size: 1,
              type: "image/png",
              status: "done",
            },
          ]}
        />,
      );
      const remove = getByRole("button", { name: "Remove a.png" });
      expect(remove.props.accessibilityState).toMatchObject({ disabled: true });
      await fireEvent.press(remove);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("the list", () => {
    const seed: UploadFile[] = [
      { id: "1", name: "a.png", size: 10, type: "image/png", status: "done" },
      {
        id: "2",
        name: "b.pdf",
        size: 10,
        type: "application/pdf",
        status: "pending",
      },
    ];

    it("removes a file from an uncontrolled list, and reports it", async () => {
      const onChange = jest.fn();
      const { getByRole, queryByText, getByText } = await draw(
        <Upload defaultValue={seed} onChange={onChange} />,
      );
      await fireEvent.press(getByRole("button", { name: "Remove a.png" }));
      expect(queryByText("a.png")).toBeNull();
      expect(getByText("b.pdf")).toBeTruthy();
      expect(onChange).toHaveBeenCalledWith([seed[1]]);
    });

    it("a controlled list changes only when the parent says so", async () => {
      const onChange = jest.fn();
      const { getByRole, getByText } = await draw(
        <Upload value={seed} onChange={onChange} />,
      );
      await fireEvent.press(getByRole("button", { name: "Remove a.png" }));
      expect(onChange).toHaveBeenCalledWith([seed[1]]);
      expect(getByText("a.png")).toBeTruthy();
    });

    it("works controlled by a parent that keeps the state", async () => {
      const Parent = () => {
        const [files, setFiles] = useState(seed);
        return <Upload value={files} onChange={setFiles} />;
      };
      const { getByRole, queryByText } = await draw(<Parent />);
      await fireEvent.press(getByRole("button", { name: "Remove b.pdf" }));
      expect(queryByText("b.pdf")).toBeNull();
    });
  });
});

describe("Upload with onUpload", () => {
  type Call = {
    file: UploadFile;
    handlers: UploadHandlers;
    done: ReturnType<typeof deferred>;
  };

  /** An uploader that parks every upload until the test settles it. */
  const parked = () => {
    const calls: Call[] = [];
    const onUpload = jest.fn((file: UploadFile, handlers: UploadHandlers) => {
      const done = deferred();
      calls.push({ file, handlers, done });
      return done.promise;
    });
    return { calls, onUpload };
  };

  const setup = async (
    files: PickedFile[],
    props: Partial<UploadProps> = {},
  ) => {
    const up = parked();
    const onChange = jest.fn();
    const view = await draw(
      <Upload
        multiple
        onPick={async () => files}
        onUpload={up.onUpload}
        onChange={onChange}
        {...props}
      />,
    );
    await fireEvent.press(view.getByRole("button", { name: "Choose files" }));
    const last = () => onChange.mock.calls.at(-1)![0] as UploadFile[];
    return { ...up, ...view, onChange, last };
  };

  it("uploads each new file at once, listed as uploading with its progress", async () => {
    const { calls, getByText, getByRole, last } = await setup([
      picked("a.png", 1536),
      picked("b.png", 10),
    ]);
    expect(calls.map((c) => c.file.name)).toEqual(["a.png", "b.png"]);
    expect(calls[0].file).toMatchObject({ status: "uploading", progress: 0 });
    expect(last().map((f) => f.status)).toEqual(["uploading", "uploading"]);
    expect(getByText("1.5 KB · Uploading 0%")).toBeTruthy();
    // Cancel replaces remove while it uploads.
    expect(
      getByRole("button", { name: "Cancel upload of a.png" }),
    ).toBeTruthy();
  });

  it("follows the progress it is told, clamped, one patch per percent", async () => {
    const { calls, getByText, onChange, last } = await setup([
      picked("a.png", 1536),
    ]);
    await act(async () => calls[0].handlers.onProgress(0.4));
    expect(getByText("1.5 KB · Uploading 40%")).toBeTruthy();
    expect(last()[0].progress).toBe(0.4);

    const before = onChange.mock.calls.length;
    await act(async () => calls[0].handlers.onProgress(0.4001));
    expect(onChange.mock.calls.length).toBe(before);

    await act(async () => calls[0].handlers.onProgress(7));
    expect(last()[0].progress).toBe(1);
    await act(async () => calls[0].handlers.onProgress(-3));
    expect(last()[0].progress).toBe(0);
  });

  it("marks a file done when the promise resolves", async () => {
    const { calls, getByText, last, getByRole } = await setup([
      picked("a.png", 1536),
    ]);
    await act(async () => calls[0].done.resolve());
    expect(last()[0]).toMatchObject({ status: "done", progress: 1 });
    expect(getByText("1.5 KB · Uploaded")).toBeTruthy();
    expect(getByRole("button", { name: "Remove a.png" })).toBeTruthy();
    // A late progress report does not undo it.
    await act(async () => calls[0].handlers.onProgress(0.2));
    expect(last()[0]).toMatchObject({ status: "done", progress: 1 });
  });

  it("shows why it failed, with a retry that tries again", async () => {
    const { calls, getByText, getByRole, queryByText, last } = await setup([
      picked("a.png"),
    ]);
    await act(async () => calls[0].done.reject(new Error("Server said no")));
    expect(last()[0]).toMatchObject({
      status: "error",
      error: "Server said no",
    });
    expect(getByText("Server said no")).toBeTruthy();

    await fireEvent.press(
      getByRole("button", { name: "Retry upload of a.png" }),
    );
    expect(calls).toHaveLength(2);
    expect(queryByText("Server said no")).toBeNull();
    expect(last()[0]).toMatchObject({ status: "uploading", progress: 0 });
    expect(last()[0].error).toBeUndefined();

    await act(async () => calls[1].done.resolve());
    expect(last()[0].status).toBe("done");
  });

  it("a failure without a message reads 'Upload failed'", async () => {
    const { calls, getByText } = await setup([picked("a.png")]);
    await act(async () => calls[0].done.reject("nope"));
    expect(getByText("Upload failed")).toBeTruthy();
  });

  it("without onUpload there is no retry", async () => {
    const { getByRole, queryByRole } = await draw(
      <Upload
        defaultValue={[
          {
            id: "1",
            name: "a.png",
            size: 1,
            type: "image/png",
            status: "error",
            error: "x",
          },
        ]}
      />,
    );
    expect(getByRole("button", { name: "Remove a.png" })).toBeTruthy();
    expect(queryByRole("button", { name: /Retry/ })).toBeNull();
  });

  it("cancelling aborts the upload and takes the file out of the list", async () => {
    const { calls, getByRole, queryByText, last } = await setup([
      picked("a.png"),
    ]);
    expect(calls[0].handlers.signal.aborted).toBe(false);
    await fireEvent.press(
      getByRole("button", { name: "Cancel upload of a.png" }),
    );
    expect(calls[0].handlers.signal.aborted).toBe(true);
    expect(queryByText("a.png")).toBeNull();
    expect(last()).toEqual([]);
    // The uploader reacting to the abort is not an error to show.
    await act(async () => calls[0].done.reject(new Error("aborted")));
    expect(last()).toEqual([]);
  });

  it("removing a file that is uploading is a cancel; the others carry on", async () => {
    const { calls, getByRole, last } = await setup([
      picked("a.png"),
      picked("b.png"),
    ]);
    await fireEvent.press(
      getByRole("button", { name: "Cancel upload of a.png" }),
    );
    expect(calls[0].handlers.signal.aborted).toBe(true);
    expect(calls[1].handlers.signal.aborted).toBe(false);
    await act(async () => calls[1].handlers.onProgress(0.5));
    expect(last().map((f) => [f.name, f.progress])).toEqual([["b.png", 0.5]]);
  });

  it("two uploads at once do not overwrite each other", async () => {
    const { calls, last } = await setup([picked("a.png"), picked("b.png")]);
    await act(async () => {
      calls[0].handlers.onProgress(0.3);
      calls[1].handlers.onProgress(0.6);
    });
    expect(last().map((f) => f.progress)).toEqual([0.3, 0.6]);
    await act(async () => calls[1].done.resolve());
    expect(last().map((f) => f.status)).toEqual(["uploading", "done"]);
    expect(last().map((f) => f.progress)).toEqual([0.3, 1]);
  });

  it("aborts what is still uploading when it unmounts", async () => {
    const { calls, unmount } = await setup([picked("a.png")]);
    await unmount();
    expect(calls[0].handlers.signal.aborted).toBe(true);
  });

  it("replacing the file aborts the one uploading, without multiple", async () => {
    const up = parked();
    const batches = [[picked("a.png")], [picked("b.png")]];
    const { getByRole } = await draw(
      <Upload onPick={async () => batches.shift()!} onUpload={up.onUpload} />,
    );
    await fireEvent.press(getByRole("button", { name: "Choose a file" }));
    await fireEvent.press(getByRole("button", { name: "Choose a file" }));
    expect(up.calls[0].handlers.signal.aborted).toBe(true);
    expect(up.calls).toHaveLength(2);
    expect(up.calls[1].file.name).toBe("b.png");
  });

  it("does not upload files it did not pick: ones that arrive done, or the ones it was given", async () => {
    const up = parked();
    const { getByRole } = await draw(
      <Upload
        multiple
        defaultValue={[
          {
            id: "1",
            name: "old.png",
            size: 1,
            type: "image/png",
            status: "pending",
          },
        ]}
        onPick={async () => [
          { ...picked("sent.png"), status: "done" as const },
        ]}
        onUpload={up.onUpload}
      />,
    );
    await fireEvent.press(getByRole("button", { name: "Choose files" }));
    expect(up.onUpload).not.toHaveBeenCalled();
  });

  it("takes the latest onChange, not the one of the render that started the upload", async () => {
    const up = parked();
    const first = jest.fn();
    const second = jest.fn();
    const tree = (onChange: () => void) => (
      <ThemeProvider>
        <Upload
          multiple
          onPick={async () => [picked("a.png")]}
          onUpload={up.onUpload}
          onChange={onChange}
        />
      </ThemeProvider>
    );
    const { getByRole, rerender } = await render(tree(first));
    await fireEvent.press(getByRole("button", { name: "Choose files" }));
    await rerender(tree(second));
    second.mockClear();
    await act(async () => up.calls[0].done.resolve());
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("controlled: the uploads write their progress through onChange", async () => {
    const up = parked();
    const Parent = () => {
      const [files, setFiles] = useState<UploadFile[]>([]);
      return (
        <Upload
          multiple
          value={files}
          onChange={setFiles}
          onPick={async () => [picked("a.png", 1536)]}
          onUpload={up.onUpload}
        />
      );
    };
    const { getByRole, getByText } = await draw(<Parent />);
    await fireEvent.press(getByRole("button", { name: "Choose files" }));
    await act(async () => up.calls[0].handlers.onProgress(0.5));
    expect(getByText("1.5 KB · Uploading 50%")).toBeTruthy();
    await act(async () => up.calls[0].done.resolve());
    expect(getByText("1.5 KB · Uploaded")).toBeTruthy();
  });
});

// --- web -------------------------------------------------------------------

describe("Upload on web", () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, "OS", "web");
  });

  interface Host {
    type: string;
    props: Record<string, any>;
  }
  const hostsOf = (view: Awaited<ReturnType<typeof draw>>, type: string) =>
    view.container.queryAll((node) => node.type === type) as unknown as Host[];
  const inputOf = (view: Awaited<ReturnType<typeof draw>>) =>
    hostsOf(view, "input")[0];
  const wrapperOf = (view: Awaited<ReturnType<typeof draw>>) =>
    hostsOf(view, "div")[0];

  const browserFile = (name: string, size = 3, type = "image/png") => {
    const file = new File(["x".repeat(size)], name, { type });
    return file;
  };

  it("draws a hidden file input with the accept and multiple attributes", async () => {
    const view = await draw(
      <Upload accept="image/*,.pdf" multiple testID="up" />,
    );
    const input = inputOf(view);
    expect(input.props).toMatchObject({
      type: "file",
      accept: "image/*,.pdf",
      multiple: true,
      tabIndex: -1,
      "aria-hidden": true,
      style: { display: "none" },
      "data-testid": "up-input",
    });
    expect(inputOf(await draw(<Upload />)).props.multiple).toBe(false);
    expect(inputOf(await draw(<Upload disabled />)).props.disabled).toBe(true);
  });

  it("renders without a document, as a server does", async () => {
    expect(typeof document).toBe("undefined");
    const view = await draw(<Upload multiple label="Files" />);
    expect(view.getByText("Files")).toBeTruthy();
  });

  it("says to drag or browse, with the web wording", async () => {
    const multi = await draw(<Upload multiple />);
    expect(
      multi.getByRole("button", { name: "Drag files here or click to browse" }),
    ).toBeTruthy();
    const single = await draw(<Upload />);
    expect(
      single.getByRole("button", {
        name: "Drag a file here or click to browse",
      }),
    ).toBeTruthy();
    const button = await draw(<Upload variant="button" />);
    expect(button.getByRole("button", { name: "Choose a file" })).toBeTruthy();
  });

  it("adds the files picked in the dialog, and lets the same file be picked again", async () => {
    const onChange = jest.fn();
    const view = await draw(<Upload multiple onChange={onChange} />);
    const target = {
      files: [
        browserFile("a.png", 1536),
        browserFile("b.txt", 5, "text/plain"),
      ],
      value: "C:\\fakepath\\a.png",
    };
    await act(async () => inputOf(view).props.onChange({ target }));
    expect(target.value).toBe("");
    expect(view.getByText("a.png")).toBeTruthy();
    expect(view.getByText("b.txt")).toBeTruthy();
    const list = onChange.mock.calls.at(-1)![0] as UploadFile[];
    expect(list[0]).toMatchObject({
      name: "a.png",
      size: 1536,
      type: "image/png",
      status: "pending",
    });
    // The browser's File is kept, for a FormData.
    expect(list[0].file).toBeInstanceOf(File);
  });

  it("pressing the zone clicks the hidden input, which opens the dialog", async () => {
    const click = jest.fn();
    // The test renderer hands refs a plain wrapper, not an element: give it a click.
    (Object.prototype as unknown as Record<string, unknown>).click = click;
    try {
      const view = await draw(<Upload />);
      await fireEvent.press(
        view.getByRole("button", { name: /Drag a file here/ }),
      );
      expect(click).toHaveBeenCalledTimes(1);
    } finally {
      delete (Object.prototype as unknown as Record<string, unknown>).click;
    }
  });

  it("with an onPick, uses it instead of the dialog", async () => {
    const onPick = jest.fn(async () => [picked("from-picker.png")]);
    const view = await draw(<Upload onPick={onPick} />);
    await fireEvent.press(
      view.getByRole("button", { name: /Drag a file here/ }),
    );
    expect(onPick).toHaveBeenCalled();
    expect(view.getByText("from-picker.png")).toBeTruthy();
  });

  it("validates what the dialog returns", async () => {
    const onReject = jest.fn();
    const view = await draw(
      <Upload accept="image/*" maxSize={10} multiple onReject={onReject} />,
    );
    await act(async () =>
      inputOf(view).props.onChange({
        target: {
          files: [
            browserFile("ok.png", 5),
            browserFile("big.png", 50),
            browserFile("a.txt", 1, "text/plain"),
          ],
          value: "",
        },
      }),
    );
    expect(view.getByText("ok.png")).toBeTruthy();
    expect(view.queryByText("big.png")).toBeNull();
    expect(
      onReject.mock.calls[0][0].map((r: UploadRejection) => r.reason),
    ).toEqual(["too-large", "wrong-type"]);
  });

  describe("drag and drop", () => {
    const dragEvent = (
      files: File[] = [],
      types: string[] = ["Files"],
      inside = false,
    ) => ({
      preventDefault: jest.fn(),
      dataTransfer: { types, files },
      currentTarget: { contains: () => inside },
      relatedTarget: null,
    });

    it("the whole field sits in a div that takes no room, to catch the events", async () => {
      const view = await draw(<Upload />);
      expect(wrapperOf(view).props.style).toEqual({ display: "contents" });
    });

    it("lights up while files are dragged over, and clears when they leave", async () => {
      let primary = "";
      const Probe = () => {
        primary = useTheme().theme.colors.primary;
        return null;
      };
      const view = await draw(
        <>
          <Probe />
          <Upload />
        </>,
      );
      const zone = () =>
        StyleSheet.flatten(
          view.getByRole("button", { name: /Drag a file here/ }).props.style,
        );
      const over = dragEvent();
      await act(async () => wrapperOf(view).props.onDragOver(over));
      // Without this the browser would open the file.
      expect(over.preventDefault).toHaveBeenCalled();
      expect(zone().borderColor).toBe(primary);

      // Moving onto a child of the zone is not leaving it.
      await act(async () =>
        wrapperOf(view).props.onDragLeave(dragEvent([], ["Files"], true)),
      );
      expect(zone().borderColor).toBe(primary);
      await act(async () => wrapperOf(view).props.onDragLeave(dragEvent()));
      expect(zone().borderColor).not.toBe(primary);
    });

    it("ignores a drag that carries no files (text, a link)", async () => {
      const view = await draw(<Upload />);
      const text = dragEvent([], ["text/plain"]);
      await act(async () => wrapperOf(view).props.onDragOver(text));
      expect(text.preventDefault).not.toHaveBeenCalled();
      const drop = dragEvent([browserFile("a.png")], ["text/plain"]);
      await act(async () => wrapperOf(view).props.onDrop(drop));
      expect(drop.preventDefault).not.toHaveBeenCalled();
      expect(view.queryByText("a.png")).toBeNull();
    });

    it("adds dropped files and stops lighting up", async () => {
      const onChange = jest.fn();
      const view = await draw(<Upload multiple onChange={onChange} />);
      await act(async () => wrapperOf(view).props.onDragOver(dragEvent()));
      const drop = dragEvent([browserFile("a.png"), browserFile("b.png")]);
      await act(async () => wrapperOf(view).props.onDrop(drop));
      expect(drop.preventDefault).toHaveBeenCalled();
      expect(view.getByText("a.png")).toBeTruthy();
      expect(view.getByText("b.png")).toBeTruthy();
      expect(onChange).toHaveBeenCalled();
    });

    it("validates a drop like a pick, and a single field takes the first file", async () => {
      const onReject = jest.fn();
      const view = await draw(<Upload onReject={onReject} />);
      await act(async () =>
        wrapperOf(view).props.onDrop(
          dragEvent([browserFile("a.png"), browserFile("b.png")]),
        ),
      );
      expect(view.getByText("a.png")).toBeTruthy();
      expect(view.queryByText("b.png")).toBeNull();
      expect(onReject).toHaveBeenCalledWith([
        expect.objectContaining({ reason: "too-many" }),
      ]);
    });

    it("disabled still stops the browser opening the file, but adds nothing", async () => {
      const view = await draw(<Upload disabled />);
      const drop = dragEvent([browserFile("a.png")]);
      await act(async () => wrapperOf(view).props.onDrop(drop));
      expect(drop.preventDefault).toHaveBeenCalled();
      expect(view.queryByText("a.png")).toBeNull();
      await act(async () => wrapperOf(view).props.onDragOver(dragEvent()));
      expect(
        StyleSheet.flatten(
          view.getByRole("button", { name: /Drag a file here/ }).props.style,
        ).borderStyle,
      ).toBe("dashed");
    });

    it("a drop starts the uploads", async () => {
      const onUpload = jest.fn(async () => {});
      const view = await draw(<Upload multiple onUpload={onUpload} />);
      await act(async () =>
        wrapperOf(view).props.onDrop(dragEvent([browserFile("a.png")])),
      );
      expect(onUpload).toHaveBeenCalledTimes(1);
      expect(onUpload.mock.calls[0]).toEqual([
        expect.objectContaining({ name: "a.png", file: expect.any(File) }),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      ]);
    });
  });
});

describe("Upload on native has no DOM", () => {
  it("renders no input and no wrapper", async () => {
    const view = await draw(<Upload onPick={async () => []} />);
    expect(view.container.queryAll((n) => n.type === "input")).toHaveLength(0);
    expect(view.container.queryAll((n) => n.type === "div")).toHaveLength(0);
  });
});
