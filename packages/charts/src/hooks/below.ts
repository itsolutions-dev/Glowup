import { createElement, Fragment, type ReactElement } from "react";

/** What goes under a chart (its legend, its table): nothing, the one there is, or both in order. */
export const below = (
  ...nodes: (ReactElement | null)[]
): ReactElement | null => {
  const present = nodes.filter((n): n is ReactElement => n !== null);
  if (present.length < 2) return present[0] ?? null;
  return createElement(Fragment, null, ...present);
};
