import React, { useEffect } from "react";
import { act, render } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import fixture from "./__fixtures__/editor-document.json";
import type { LayoutDocument } from "../editor/document";
import { addLayout, emptyLibrary, type Library } from "../editor/library";
import { setText } from "../editor/operations";
import {
  LIBRARY_KEY,
  useAutosave,
  useLibrary,
} from "../editor/canvas/useLibrary";
import { useEditor, type Editor } from "../editor/canvas/useEditor";

// Storage as an in-memory map, the way AsyncStorage behaves on every platform.
const mockStore = new Map<string, string>();
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
}));
const setItem = AsyncStorage.setItem as jest.Mock;

const doc = fixture as LayoutDocument;
const stored = (): Library =>
  JSON.parse(mockStore.get(LIBRARY_KEY) as string) as Library;

let editor: Editor;
let library: ReturnType<typeof useLibrary>;
const Editing = ({ lib }: { lib: ReturnType<typeof useLibrary> }) => {
  const current = useEditor(
    lib.library.layouts.find((l) => l.id === lib.library.open)?.doc ?? doc,
  );
  useAutosave(current, lib);
  useEffect(() => {
    editor = current;
  });
  return null;
};
const Harness = () => {
  const lib = useLibrary();
  useEffect(() => {
    library = lib;
  });
  return lib.ready ? <Editing lib={lib} /> : null;
};

/** Storage holding one layout, `l1`, open. */
const seed = () =>
  mockStore.set(
    LIBRARY_KEY,
    JSON.stringify(addLayout(emptyLibrary(), doc, 1).library),
  );

beforeEach(() => {
  mockStore.clear();
  setItem.mockClear();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

const settle = () => act(async () => {});

describe("the saved layouts", () => {
  it("loads the stored library", async () => {
    seed();
    await render(<Harness />);
    await settle();
    expect(library.ready).toBe(true);
    expect(library.library.open).toBe("l1");
  });

  it("saves 500 ms after the last edit, once", async () => {
    seed();
    await render(<Harness />);
    await settle();
    for (const text of ["A", "AB", "ABC"]) {
      await act(async () => editor.apply(setText(editor.doc, "n2", text), "t"));
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }
    expect(setItem).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(setItem).toHaveBeenCalledTimes(1);
    const saved = stored().layouts[0].doc.items[0].children?.[0];
    expect(saved?.text).toBe("ABC");
  });

  it("keeps editing when storage fails", async () => {
    seed();
    setItem.mockImplementationOnce(async () => {
      throw new Error("quota");
    });
    await render(<Harness />);
    await settle();
    await act(async () => editor.apply(setText(editor.doc, "n2", "Ok")));
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(editor.doc.items[0].children?.[0].text).toBe("Ok");
  });

  it("load starts a fresh history", async () => {
    seed();
    await render(<Harness />);
    await settle();
    await act(async () => editor.apply(setText(editor.doc, "n2", "A")));
    await act(async () => editor.select("n2"));
    const other = { ...doc, name: "Other" };
    await act(async () => editor.load(other));
    expect(editor.doc).toBe(other);
    expect(editor.canUndo).toBe(false);
    expect(editor.selected).toBeNull();
  });
});

describe("the saved layouts, after the review", () => {
  const getItem = AsyncStorage.getItem as jest.Mock;

  it("writes nothing when the stored library could not be read", async () => {
    seed();
    getItem.mockImplementationOnce(async () => {
      throw new Error("Row too big to fit into CursorWindow");
    });
    await render(<Harness />);
    await settle();
    await act(async () => library.add({ ...doc, name: "New" }));
    await act(async () => editor.apply(setText(editor.doc, "n2", "X")));
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(setItem).not.toHaveBeenCalled();
    expect(stored().layouts).toHaveLength(1);
  });

  describe("on the web", () => {
    const win = new EventTarget();
    beforeEach(() => {
      (globalThis as { window?: unknown }).window = win;
    });
    afterEach(() => {
      delete (globalThis as { window?: unknown }).window;
    });

    it("takes another tab's changes before writing its own", async () => {
      seed();
      await render(<Harness />);
      await settle();
      // Another tab adds a layout and writes the library.
      const other = addLayout(
        JSON.parse(mockStore.get(LIBRARY_KEY) as string),
        { ...doc, name: "Made in another tab" },
        5,
      ).library;
      mockStore.set(LIBRARY_KEY, JSON.stringify({ ...other, open: "l1" }));
      const event = Object.assign(new Event("storage"), { key: LIBRARY_KEY });
      await act(async () => {
        win.dispatchEvent(event);
      });
      await settle();
      await act(async () => editor.apply(setText(editor.doc, "n2", "Y")));
      await act(async () => {
        jest.advanceTimersByTime(500);
      });
      expect(stored().layouts.map((l) => l.doc.name)).toContain(
        "Made in another tab",
      );
    });

    it("saves a pending edit when the page is hidden", async () => {
      seed();
      await render(<Harness />);
      await settle();
      await act(async () => editor.apply(setText(editor.doc, "n2", "Z")));
      await act(async () => {
        win.dispatchEvent(new Event("pagehide"));
      });
      expect(stored().layouts[0].doc.items[0].children?.[0].text).toBe("Z");
    });
  });

  it("saves a pending edit when the editor unmounts", async () => {
    seed();
    const view = await render(<Harness />);
    await settle();
    await act(async () => editor.apply(setText(editor.doc, "n2", "W")));
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    await act(async () => view.unmount());
    expect(stored().layouts[0].doc.items[0].children?.[0].text).toBe("W");
  });
});
