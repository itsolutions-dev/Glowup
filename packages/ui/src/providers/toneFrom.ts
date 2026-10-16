import { hexToLch, tone } from "./tonal";

/** A tinted surface and the text that sits on it. */
export interface ToneColors {
  background: string;
  foreground: string;
}

type Mode = "light" | "dark";

// The same tone steps Material 3 gives a container pair, so the text keeps
// roughly 10 tones of lightness (about 7:1) on its surface in both schemes.
const TONES = {
  light: { background: 90, foreground: 10 },
  dark: { background: 30, foreground: 90 },
} as const;

// Chip tints stay soft: a vivid source colour is pulled down to this chroma.
const MAX_CHROMA = 40;
// A string has no colour of its own, so it gets a fixed, moderate one.
const STRING_CHROMA = 32;

const fromHue = (hue: number, chroma: number, mode: Mode): ToneColors => ({
  background: tone(hue, chroma, TONES[mode].background),
  foreground: tone(hue, chroma, TONES[mode].foreground),
});

/**
 * A container-style pair tinted with the hue of `hex`, readable in both
 * schemes. A grey source gives a grey pair. Pure: same input, same output.
 *
 * ```ts
 * const { background, foreground } = toneFromColor("#1D5B9D", theme.isDark ? "dark" : "light");
 * ```
 */
export const toneFromColor = (hex: string, mode: Mode): ToneColors => {
  const { h, c } = hexToLch(hex);
  return fromHue(h, Math.min(c, MAX_CHROMA), mode);
};

/**
 * Like `toneFromColor`, but the hue is derived from the text, so the same
 * label (a tag, a status, a person) always gets the same colour.
 */
export const toneFromString = (text: string, mode: Mode): ToneColors => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (text.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  }
  return fromHue(Math.abs(hash) % 360, STRING_CHROMA, mode);
};

const HEX = /^#[0-9a-f]{6}$/i;

/** `toneFromColor` for a `#RRGGBB` source, `toneFromString` for anything else. */
export const toneFrom = (source: string, mode: Mode): ToneColors =>
  HEX.test(source) ? toneFromColor(source, mode) : toneFromString(source, mode);
