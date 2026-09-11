import { StyleSheet } from "react-native";

/**
 * The two wrappers every hand-written gallery needs. The generated galleries
 * carry their own inline styles, converted from the authored previews; these
 * exist so the manual ones look the same without repeating the numbers.
 */
export const demo = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
  },
  stack: { gap: 12 },
  /** The width the authored previews use for a field or a card. */
  panel: { width: 380, maxWidth: "100%", gap: 12 },
  cell: { alignItems: "center", gap: 6, width: 76 },
});

/**
 * A 16:9 band as a data URI, so a demo has a real image without a network
 * fetch — the same trick the authored previews use for CardCover.
 */
export const gradientCover = (from: string, to: string) => ({
  uri:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
        `</linearGradient></defs>` +
        `<rect width="320" height="180" fill="url(#g)"/></svg>`,
    ),
});
