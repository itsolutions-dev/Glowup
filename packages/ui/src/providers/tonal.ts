// Colour math shared by the palette generator and the fixed feedback roles.
// Internal: nothing here is re-exported from the package barrel.

/* ------------------------------------------------------------------ *
 * sRGB <-> CIELAB, and tone -> hex.
 *
 * Material's own tones are HCT, which needs CAM16; L* is what HCT's tone
 * actually measures, so a tone here is a CIELAB lightness and the hue and
 * chroma ride along in LCh. Close enough that the derived baseline matches
 * the hand-authored one to a couple of units per channel, with no dependency.
 * ------------------------------------------------------------------ */

const linearize = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const delinearize = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

const WHITE_X = 95.047;
const WHITE_Y = 100;
const WHITE_Z = 108.883;
const EPSILON = 216 / 24389;
const KAPPA = 24389 / 27;

const labF = (t: number) =>
  t > EPSILON ? Math.cbrt(t) : (t * KAPPA + 16) / 116;
const labFInv = (t: number) =>
  t ** 3 > EPSILON ? t ** 3 : (116 * t - 16) / KAPPA;

interface Lch {
  l: number;
  c: number;
  h: number;
}

export const hexToLch = (hex: string): Lch => {
  const value = parseInt(hex.replace("#", ""), 16);
  const r = linearize(((value >> 16) & 255) / 255);
  const g = linearize(((value >> 8) & 255) / 255);
  const b = linearize((value & 255) / 255);
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) * 100;
  const y = (0.2126729 * r + 0.7151522 * g + 0.072175 * b) * 100;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) * 100;
  const fx = labF(x / WHITE_X);
  const fy = labF(y / WHITE_Y);
  const fz = labF(z / WHITE_Z);
  const a = 500 * (fx - fy);
  const bb = 200 * (fy - fz);
  return {
    l: 116 * fy - 16,
    c: Math.hypot(a, bb),
    h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
};

/** Linear-light RGB, deliberately unclamped so the caller can test the gamut. */
const lchToRgb = (
  l: number,
  c: number,
  h: number,
): [number, number, number] => {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const fy = (l + 16) / 116;
  const x = (labFInv(fy + a / 500) * WHITE_X) / 100;
  const y = (labFInv(fy) * WHITE_Y) / 100;
  const z = (labFInv(fy - b / 200) * WHITE_Z) / 100;
  return [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ];
};

const inGamut = (l: number, c: number, h: number) =>
  lchToRgb(l, c, h).every((v) => v >= -0.0001 && v <= 1.0001);

/**
 * One step of a tonal palette: the given tone at the most chroma the sRGB
 * gamut will hold. Tones near 0 and 100 have almost no room, which is exactly
 * why Material's own near-white and near-black tones look grey.
 */
export const tone = (hue: number, chroma: number, t: number): string => {
  let usable = chroma;
  if (!inGamut(t, chroma, hue)) {
    let low = 0;
    let high = chroma;
    for (let i = 0; i < 24; i += 1) {
      const mid = (low + high) / 2;
      if (inGamut(t, mid, hue)) low = mid;
      else high = mid;
    }
    usable = low;
  }
  return `#${lchToRgb(t, usable, hue)
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, delinearize(v))) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
};
