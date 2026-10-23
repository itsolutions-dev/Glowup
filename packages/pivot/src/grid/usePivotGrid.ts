import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import type PivotEngine from "../core/PivotEngine";
import usePivotMatrix from "../hooks/usePivotMatrix";
import type { LocalizationDictionary } from "../localization/types";
import { buildGridModel, type GridModel } from "./model";

/**
 * The grid of an engine, kept up to date: the model of its latest matrix, whether a
 * recompute is under way (a large dataset defers it; the last model stays meanwhile),
 * and `toggle` to open or close a row or column group by its node key.
 */
export const usePivotGrid = (
  engine: PivotEngine | null,
  localization?: LocalizationDictionary,
): {
  model: GridModel | null;
  loading: boolean;
  toggle: (nodeKey: string) => void;
} => {
  const { matrix, loading } = usePivotMatrix(engine);

  // A format change (decimals, separators, currency…) does not make a new matrix: the engine hands
  // back the one it has. So the format has its own version, bumped on the engine's event.
  const formatChanges = useRef(0);
  const formatVersion = useSyncExternalStore(
    useCallback(
      (notify: () => void) => {
        if (!engine) return () => {};
        const onChange = () => {
          formatChanges.current += 1;
          notify();
        };
        engine.on("formatChange", onChange);
        return () => engine.off("formatChange", onChange);
      },
      [engine],
    ),
    () => formatChanges.current,
    () => 0,
  );

  // The slice, the captions and the locale are read when a matrix arrives, so a stale matrix is never
  // paired with a newer slice while a large dataset recomputes. Every change of the engine except
  // the format (data, report, locale…) produces a new matrix.
  const context = useMemo(
    () =>
      engine
        ? {
            slice: engine.getSlice(),
            metadata: engine.getMetadata(),
            locale: engine.getLocale(),
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, matrix],
  );
  const format = useMemo(
    () => engine?.getFormat() ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, matrix, formatVersion],
  );

  const model = useMemo(
    () =>
      matrix && context && format
        ? buildGridModel({ matrix, format, localization, ...context })
        : null,
    [matrix, context, format, localization],
  );

  const toggle = useCallback(
    (nodeKey: string) => engine?.toggleExpanded(nodeKey),
    [engine],
  );

  return { model, loading, toggle };
};

export default usePivotGrid;
