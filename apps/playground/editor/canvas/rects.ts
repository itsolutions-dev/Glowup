// What the render tree measured and the edit layer needs: where a container's
// inner grid sits inside it (`inner:<id>`), where a flow child sits inside its
// container (`child:<id>`). One store for the whole canvas (spec §18), so a
// measurement re-renders only the box that reads it.

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Rects {
  set(key: string, rect: Rect): void;
  get(key: string): Rect | undefined;
  subscribe(listener: () => void): () => void;
}

const same = (a: Rect | undefined, b: Rect) =>
  !!a &&
  a.x === b.x &&
  a.y === b.y &&
  a.width === b.width &&
  a.height === b.height;

export const createRects = (): Rects => {
  const rects = new Map<string, Rect>();
  const listeners = new Set<() => void>();
  return {
    set(key, rect) {
      if (same(rects.get(key), rect)) return;
      rects.set(key, rect);
      listeners.forEach((listener) => listener());
    },
    get: (key) => rects.get(key),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

const RectsContext = createContext<Rects | null>(null);

export const RectsProvider = RectsContext.Provider;

export const useRects = (): Rects => {
  const rects = useContext(RectsContext);
  if (!rects) throw new Error("useRects must be inside a RectsProvider");
  return rects;
};

export const useRect = (key: string): Rect | undefined => {
  const rects = useRects();
  const get = useCallback(() => rects.get(key), [rects, key]);
  return useSyncExternalStore(rects.subscribe, get, get);
};
