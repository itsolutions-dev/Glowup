import React, { createContext, useContext, useEffect, useId } from "react";

export interface ToastLayers {
  /** The toasts, ready to draw. */
  viewport: React.ReactNode;
  /** The id of the topmost open overlay, which draws them; null for the root. */
  top: string | null;
  /** Registers an open overlay; the returned function unregisters it. */
  open: (id: string) => () => void;
}

export const ToastLayersContext = createContext<ToastLayers | null>(null);

/**
 * Put as the last child of an overlay's `Modal` (a `Dialog`, a `BottomSheet`,
 * a side sheet). On iOS and Android a `Modal` is a separate native window, so
 * toasts drawn at the app's root sit under it; while the overlay is `active`
 * and the topmost one, it draws them in its own window. Outside a
 * `ToastProvider` it draws nothing.
 */
export const ToastLayer = ({ active }: { active: boolean }) => {
  const layers = useContext(ToastLayersContext);
  const id = useId();
  const open = layers?.open;
  useEffect(() => (active && open ? open(id) : undefined), [active, open, id]);
  return layers && active && layers.top === id ? <>{layers.viewport}</> : null;
};
