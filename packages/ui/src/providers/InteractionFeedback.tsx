import { createContext, useContext } from "react";

/**
 * What the user just did, for an app to answer with a haptic (or a sound):
 * - `press`: a button, an icon button, a FAB, an action chip.
 * - `toggle`: something switched on or off (switch, checkbox, filter chip).
 * - `selection`: one choice out of several (radio, segmented button), or a
 *   slider crossing a step.
 * - `longPress`: a long press (for the app's own components; none of the
 *   library's has one yet).
 */
export type InteractionFeedbackKind =
  "press" | "toggle" | "selection" | "longPress";

export type InteractionFeedbackHandler = (
  kind: InteractionFeedbackKind,
) => void;

const noop: InteractionFeedbackHandler = () => {};

/** Internal: `ThemeProvider` provides it, components read it. */
export const InteractionFeedbackContext =
  createContext<InteractionFeedbackHandler>(noop);

/**
 * The function to call when the user interacts, for a component of your own
 * that should answer like the library's: it reaches `ThemeProvider`'s
 * `onInteractionFeedback`, and does nothing without one or when `enabled` is
 * false. Stable across renders.
 */
export function useInteractionFeedback(
  enabled = true,
): InteractionFeedbackHandler {
  const emit = useContext(InteractionFeedbackContext);
  return enabled ? emit : noop;
}
