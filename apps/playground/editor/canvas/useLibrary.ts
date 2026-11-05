// The saved layouts in storage (spec §14), and the autosave of the open one.
// AsyncStorage is localStorage on the web and the device's storage on native;
// a write that fails (quota, private browsing) never breaks the editing.

import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { LayoutDocument } from "../document";
import {
  addLayout,
  emptyLibrary,
  openLayout,
  readLibrary,
  removeLayout,
  saveLayout,
  type Library,
} from "../library";
import { setName } from "../operations";
import type { Editor } from "./useEditor";

export const LIBRARY_KEY = "glowup.editor.library";

/** After the last change, this long before the open layout is saved. */
const AUTOSAVE_DELAY = 500;

export const useLibrary = () => {
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const [ready, setReady] = useState(false);
  // The library the next change starts from: changes can come faster than renders.
  const current = useRef(library);
  // Writing is allowed only once storage has been read: a library that could
  // not be read (an I/O error, Android's row-too-big) must not be replaced by
  // the empty one this session started from. The editing goes on in memory.
  const writable = useRef(false);

  useEffect(() => {
    let cancelled = false;
    // What storage holds now, the layout on the canvas kept open if it is still there.
    const take = (raw: string | null) => {
      const read = readLibrary(raw);
      const open = current.current.open;
      current.current =
        open && read.layouts.some((l) => l.id === open)
          ? { ...read, open }
          : read;
      writable.current = true;
      setLibrary(current.current);
    };
    AsyncStorage.getItem(LIBRARY_KEY)
      .then((raw) => !cancelled && take(raw))
      .catch(() => {})
      .finally(() => !cancelled && setReady(true));
    // On the web another tab may write the library: take it in before this tab
    // writes its own, or the last writer would delete the other's work.
    const win = typeof window !== "undefined" ? window : undefined;
    const onStorage = (event: Event) => {
      if ((event as StorageEvent).key !== LIBRARY_KEY) return;
      AsyncStorage.getItem(LIBRARY_KEY)
        .then((raw) => !cancelled && take(raw))
        .catch(() => {});
    };
    win?.addEventListener?.("storage", onStorage);
    return () => {
      cancelled = true;
      win?.removeEventListener?.("storage", onStorage);
    };
  }, []);

  const update = useCallback((change: (library: Library) => Library) => {
    const next = change(current.current);
    if (next === current.current) return;
    current.current = next;
    setLibrary(next);
    if (!writable.current) return;
    // Fire and forget, as the site's usePersistentState does.
    AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const add = useCallback(
    (doc: LayoutDocument) => {
      let id = "";
      update((lib) => {
        const added = addLayout(lib, doc, Date.now());
        id = added.id;
        return added.library;
      });
      return id;
    },
    [update],
  );
  const open = useCallback(
    (id: string) => update((lib) => openLayout(lib, id)),
    [update],
  );
  const save = useCallback(
    (id: string, doc: LayoutDocument) =>
      update((lib) => saveLayout(lib, id, doc, Date.now())),
    [update],
  );
  const rename = useCallback(
    (id: string, name: string) =>
      update((lib) => {
        const layout = lib.layouts.find((l) => l.id === id);
        return layout
          ? saveLayout(lib, id, setName(layout.doc, name), Date.now())
          : lib;
      }),
    [update],
  );
  const remove = useCallback(
    (id: string) => update((lib) => removeLayout(lib, id)),
    [update],
  );

  return { ready, library, add, open, save, rename, remove };
};

/** Saves the open layout `AUTOSAVE_DELAY` after the editor's document last changed. */
export const useAutosave = (
  editor: Editor,
  { ready, library, save }: ReturnType<typeof useLibrary>,
) => {
  const id = library.open;
  const { doc } = editor;
  // What is waiting to be saved: saved when its time comes, or at once when
  // the editor goes away or the page is hidden (a tab closed, a reload).
  const pending = useRef<{ id: string; doc: LayoutDocument } | null>(null);
  const flush = useCallback(() => {
    const waiting = pending.current;
    pending.current = null;
    if (waiting) save(waiting.id, waiting.doc);
  }, [save]);
  useEffect(() => {
    if (!ready || !id) return;
    pending.current = { id, doc };
    const timer = setTimeout(flush, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [doc, id, ready, flush]);
  useEffect(() => {
    const win = typeof window !== "undefined" ? window : undefined;
    win?.addEventListener?.("pagehide", flush);
    return () => {
      win?.removeEventListener?.("pagehide", flush);
      flush();
    };
  }, [flush]);
};
