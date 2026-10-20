import type { ViewStyle } from "react-native";

/** Narrowest a field gets with `fullWidth={false}`, so it stays usable when empty. */
export const FIELD_MIN_WIDTH = 200;

/**
 * Wrapper width of a form field: it stretches to its container by default, and
 * with `fullWidth={false}` shrinks to its content (never under `FIELD_MIN_WIDTH`).
 */
export const fieldWidth = (fullWidth: boolean): ViewStyle =>
  fullWidth
    ? { width: "100%" }
    : { alignSelf: "flex-start", minWidth: FIELD_MIN_WIDTH };
