import { createContext, useContext } from "react";

/** Control height: `"dense"` suits a mouse (desktop forms, tables), `"normal"` a finger. */
export type Density = "normal" | "dense";

/** Internal: `ThemeProvider` provides it, controls read it through `useDensity`. */
export const DensityContext = createContext<Density>("normal");

/**
 * The density a control should draw with: its own `density` prop if it has
 * one, else the one `ThemeProvider` was given, else `"normal"`. Use it in a
 * component of your own that should follow the same setting.
 */
export const useDensity = (prop?: Density): Density => {
  const fromProvider = useContext(DensityContext);
  return prop ?? fromProvider;
};
