import React, { createContext, useContext } from "react";

/** The width a `ViewportProvider` pretends the window has, if one is mounted. */
const ViewportWidthContext = createContext<number | null>(null);

/** The width set by the nearest `ViewportProvider`, or `null` outside one. */
export const useViewportWidthOverride = () => useContext(ViewportWidthContext);

export interface ViewportProviderProps {
  /**
   * The width, in dp, to report instead of the window's. Leave it out (or
   * `undefined`) and the real window width is reported, so the provider can sit
   * in place permanently and be switched on by a value.
   */
  width?: number;
  children: React.ReactNode;
}

/**
 * Makes everything under it that asks for the window width — `useBreakpoint`,
 * `Grid`'s columns, a date picker deciding between a popover and a dialog —
 * see `width` instead. For previewing a phone layout inside a desktop page: a
 * frame cannot change the window, so the components are told the frame's width.
 * It resizes nothing and changes no real dimension.
 *
 * ```tsx
 * <ViewportProvider width={360}>
 *   <DatePicker label="Date" value={date} onChange={setDate} />
 * </ViewportProvider>
 * ```
 */
const ViewportProvider = ({ width, children }: ViewportProviderProps) => (
  <ViewportWidthContext.Provider value={width ?? null}>
    {children}
  </ViewportWidthContext.Provider>
);

export default ViewportProvider;
