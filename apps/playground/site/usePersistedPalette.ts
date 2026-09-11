import { useEffect, useRef } from "react";
import { palettes, useTheme, type PaletteId } from "@its/glowup-ui";

import { usePersistentState } from "./usePersistentState";

const isPaletteId = (id: string): id is PaletteId => id in palettes;

/**
 * Remembers the colour set the reader picked on /theming.
 *
 * The library holds the palette in React state, so a reload puts the site back
 * on the baseline scheme — which reads as the picker having quietly failed.
 * Restoring it has to wait for `usePersistentState` to hydrate (AsyncStorage is
 * async everywhere), hence the one-shot ref: the write-back effect must not
 * store the default over the reader's choice in the frames before the read
 * lands. An id written by a build that shipped a palette this one does not have
 * is ignored and overwritten on the next pick.
 */
export const usePersistedPalette = () => {
  const { palette, setPalette } = useTheme();
  const [stored, store, hydrated] = usePersistentState<string>(
    "palette",
    "baseline",
  );
  const restored = useRef(false);

  useEffect(() => {
    if (!hydrated || restored.current) return;
    restored.current = true;
    if (stored !== palette.id && isPaletteId(stored)) {
      setPalette(palettes[stored]);
    }
  }, [hydrated, stored, palette.id, setPalette]);

  useEffect(() => {
    if (restored.current && stored !== palette.id) store(palette.id);
  }, [palette.id, stored, store]);
};

export default usePersistedPalette;
