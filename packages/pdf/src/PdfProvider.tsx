import React, { createContext, useContext, useMemo } from "react";
import { expoActions, expoFiles, expoNative } from "./adapters";
import type { PdfAdapters } from "./types";

const AdaptersContext = createContext<Partial<PdfAdapters> | null>(null);

/**
 * Swaps what the viewer talks to: another way to download, another native module, or
 * the in-memory ones of `@its/glowup-pdf/testing`. Without it the Expo ones are used.
 */
export const PdfProvider = ({
  adapters,
  children,
}: {
  adapters?: Partial<PdfAdapters>;
  children: React.ReactNode;
}) => (
  <AdaptersContext.Provider value={adapters ?? null}>
    {children}
  </AdaptersContext.Provider>
);

export const usePdfAdapters = (): PdfAdapters => {
  const override = useContext(AdaptersContext);
  // One dependency per adapter: `adapters` is usually an inline object.
  return useMemo(
    () => ({
      native: override?.native ?? expoNative,
      files: override?.files ?? expoFiles,
      actions: override?.actions ?? expoActions,
    }),
    [override?.native, override?.files, override?.actions],
  );
};
