// Draws the app icon set, the site favicon and the share card: a neon bolt in
// a broken ring, coloured from the theme's own dark-scheme tokens so the marks
// cannot end up a different purple from the UI they sit next to. The shape
// itself lives in site/brandMark.json, which the header's SVG reads too.
//
// No image dependency: a PNG is a signature, three chunks and a zlib stream,
// and zlib ships with Node. Adding sharp or canvas to a documentation site to
// draw a bolt, a ring and a blur is not a trade worth making.
//
// Run with `npm run icons -w @its/glowup-playground`. The output is committed —
// regenerate it when theme.json's colours or brandMark.json change, which is
// the only thing that alters it. It takes a while: the glow is a full-size
// blur of every icon.
// Imported explicitly rather than taken from the global: these scripts are
// linted with the app's own globals, which do not include Buffer.
import { Buffer } from "node:buffer";
import { deflateSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../..");
const ASSETS = resolve(HERE, "../assets");
// Expo copies `public/` into the export root verbatim, which is what an OG
// image needs: a stable URL, not a content-hashed path under _expo/static.
const PUBLIC = resolve(HERE, "../public");

const theme = JSON.parse(
  readFileSync(
    resolve(REPO_ROOT, "packages/ui/src/providers/theme.json"),
    "utf8",
  ),
);

const MARK = JSON.parse(
  readFileSync(resolve(HERE, "../site/brandMark.json"), "utf8"),
);

const { light, dark } = theme.colors;

/** "#RRGGBB" → [r, g, b] in 0..1. */
const rgb = (hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

// --- PNG encoding -----------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

/** RGBA pixel buffer → PNG file. */
const encodePng = (width, height, pixels) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: truecolour with alpha
  // 10..12 stay zero: deflate, adaptive filtering, no interlace.

  // One filter byte per scanline. Filter 4 (Paeth) on every row: the glow and
  // the vignette are smooth gradients, which unfiltered deflate stores almost
  // byte for byte (the 1024 icon is ~350 KB without it).
  const stride = width * 4;
  const raw = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + stride);
    raw[rowStart] = 4;
    for (let i = 0; i < stride; i++) {
      const at = y * stride + i;
      const left = i >= 4 ? pixels[at - 4] : 0;
      const up = y > 0 ? pixels[at - stride] : 0;
      const upLeft = i >= 4 && y > 0 ? pixels[at - stride - 4] : 0;
      const p = left + up - upLeft;
      const dLeft = Math.abs(p - left);
      const dUp = Math.abs(p - up);
      const dUpLeft = Math.abs(p - upLeft);
      const predictor =
        dLeft <= dUp && dLeft <= dUpLeft ? left : dUp <= dUpLeft ? up : upLeft;
      raw[rowStart + 1 + i] = (pixels[at] - predictor) & 0xff;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

// --- Drawing ----------------------------------------------------------------
//
// Everything is drawn in a unit square and sampled per pixel. A shape is a
// predicate `(u, v) => boolean`; `mask` turns one into per-pixel coverage, and
// the neon look is two blurred copies of the mask screened under the sharp one.

const SAMPLES = 4; // supersampling per axis, for edges that are not stair-stepped

const or =
  (...shapes) =>
  (u, v) =>
    shapes.some((inside) => inside(u, v));

const circle = (cx, cy, r) => (u, v) => (u - cx) ** 2 + (v - cy) ** 2 <= r * r;

/** A stroke from `a` to `b` with round caps, tapering from w0 to w1 (full widths). */
const stroke =
  ([ax, ay], [bx, by], [w0, w1]) =>
  (u, v) => {
    const vx = bx - ax;
    const vy = by - ay;
    const t = Math.max(
      0,
      Math.min(1, ((u - ax) * vx + (v - ay) * vy) / (vx * vx + vy * vy)),
    );
    const half = (w0 + (w1 - w0) * t) / 2;
    return (u - ax - t * vx) ** 2 + (v - ay - t * vy) ** 2 <= half * half;
  };

/** An arc of the ring between two screen angles, with round caps. */
const arc = ({ cx, cy, r, width }, [from, to]) => {
  const half = width / 2;
  const point = (deg) => [
    cx + r * Math.cos((deg * Math.PI) / 180),
    cy + r * Math.sin((deg * Math.PI) / 180),
  ];
  const band = (u, v) => {
    if (Math.abs(Math.hypot(u - cx, v - cy) - r) > half) return false;
    let deg = (Math.atan2(v - cy, u - cx) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return from <= to ? deg >= from && deg <= to : deg >= from || deg <= to;
  };
  return or(band, circle(...point(from), half), circle(...point(to), half));
};

/** Even-odd point-in-polygon. */
const polygon = (points) => (u, v) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

/** The polygon scaled toward its centroid: the bolt's bright core. */
const inset = (points, k) => {
  const cx = points.reduce((sum, [x]) => sum + x, 0) / points.length;
  const cy = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
  return points.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
};

const roundedRect = (x0, y0, x1, y1, radius) => (px, py) => {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false;
  const cx = Math.min(Math.max(px, x0 + radius), x1 - radius);
  const cy = Math.min(Math.max(py, y0 + radius), y1 - radius);
  return (px - cx) ** 2 + (py - cy) ** 2 <= radius * radius;
};

const BOLT = polygon(MARK.bolt);
const BOLT_CORE = polygon(inset(MARK.bolt, 0.72));
const RING = or(...MARK.ring.arcs.map((span) => arc(MARK.ring, span)));
const STREAKS = or(
  ...MARK.streaks.map(({ from, to, width }) => stroke(from, to, width)),
);

/**
 * Coverage of every pixel of an n×n image by a unit-square shape, drawn at
 * `scale` around the centre (below 1 leaves a margin, for Android's mask).
 */
const mask = (n, inside, scale = 1) => {
  const out = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let hits = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const u = 0.5 + ((x + (sx + 0.5) / SAMPLES) / n - 0.5) / scale;
          const v = 0.5 + ((y + (sy + 0.5) / SAMPLES) / n - 0.5) / scale;
          if (inside(u, v)) hits++;
        }
      }
      out[y * n + x] = hits / (SAMPLES * SAMPLES);
    }
  }
  return out;
};

/** Three box passes: close enough to a Gaussian for a glow, and linear in r. */
const blur = (source, n, radius) => {
  const r = Math.max(1, Math.round(radius));
  const clamp = (i) => Math.min(n - 1, Math.max(0, i));
  let a = Float32Array.from(source);
  const b = new Float32Array(n * n);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < n; y++) {
      let sum = 0;
      for (let x = -r; x <= r; x++) sum += a[y * n + clamp(x)];
      for (let x = 0; x < n; x++) {
        b[y * n + x] = sum / (2 * r + 1);
        sum += a[y * n + clamp(x + r + 1)] - a[y * n + clamp(x - r)];
      }
    }
    for (let x = 0; x < n; x++) {
      let sum = 0;
      for (let y = -r; y <= r; y++) sum += b[clamp(y) * n + x];
      for (let y = 0; y < n; y++) {
        a[y * n + x] = sum / (2 * r + 1);
        sum += b[clamp(y + r + 1) * n + x] - b[clamp(y - r) * n + x];
      }
    }
  }
  return a;
};

// --- The icons --------------------------------------------------------------

const DIM = rgb(dark.surfaceDim);
const GLOW_ROOM = rgb(dark.primaryContainer);
const NEON = rgb(dark.primary);
const NEON_END = rgb(dark.tertiary);
const CORE = rgb(dark.onPrimaryContainer);
const DEEP = rgb(light.primary);

/**
 * The neon mark on its dark ground, as linear 0..1 RGB.
 *
 * - `streaks`: the two diagonal streaks. They turn to noise below ~128 px, so
 *   the small sizes leave them out and keep the bolt and the ring.
 * - `scale`: the mark's size inside the square.
 * - `vignette`: how far the ground's centre glow reaches, as a fraction of the
 *   side. At 0.5 the edges are exactly surfaceDim, so the square disappears
 *   into a surfaceDim background (splash screen, share card).
 */
const neon = (n, { streaks = true, scale = 1, vignette = 0.62 } = {}) => {
  const out = new Float32Array(n * n * 3);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const d = Math.min(
        1,
        Math.hypot((x + 0.5) / n - 0.5, (y + 0.5) / n - 0.5) / vignette,
      );
      const k = Math.pow(1 - d, 1.6) * 0.75;
      for (let c = 0; c < 3; c++) {
        out[(y * n + x) * 3 + c] = DIM[c] + (GLOW_ROOM[c] - DIM[c]) * k;
      }
    }
  }

  const screen = (m, colour, gain) => {
    for (let i = 0; i < n * n; i++) {
      const a = Math.min(1, m[i] * gain);
      if (a <= 0) continue;
      for (let c = 0; c < 3; c++) {
        out[i * 3 + c] = 1 - (1 - out[i * 3 + c]) * (1 - colour[c] * a);
      }
    }
  };
  const over = (m, colourAt) => {
    for (let i = 0; i < n * n; i++) {
      if (!m[i]) continue;
      const colour = colourAt(i % n, Math.floor(i / n));
      for (let c = 0; c < 3; c++) {
        out[i * 3 + c] += (colour[c] - out[i * 3 + c]) * m[i];
      }
    }
  };
  const flat = (colour) => () => colour;

  const lit = mask(
    n,
    streaks ? or(BOLT, RING, STREAKS) : or(BOLT, RING),
    scale,
  );
  // A wide glow in the deep primary, a tight one in the light primary.
  screen(blur(lit, n, n * 0.06 * scale), DEEP, 1.6);
  screen(blur(lit, n, n * 0.02 * scale), NEON, 1.1);

  // The ring runs from primary to tertiary, top-left to bottom-right.
  over(mask(n, RING, scale), (x, y) => {
    const t = Math.min(1, Math.max(0, ((x + y) / (2 * n)) * 1.4 - 0.2));
    return NEON.map((c, i) => c + (NEON_END[i] - c) * t);
  });
  if (streaks) over(mask(n, STREAKS, scale), flat(NEON));
  over(mask(n, BOLT, scale), flat(NEON));
  over(mask(n, BOLT_CORE, scale), flat(CORE));
  return out;
};

/** Linear RGB → RGBA, clipped to a rounded square (radius 0: full bleed). */
const toRgba = (image, n, radius = 0) => {
  const pixels = Buffer.alloc(n * n * 4);
  const shape = roundedRect(0, 0, n, n, radius);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      for (let c = 0; c < 3; c++) {
        pixels[i * 4 + c] = Math.round(
          Math.min(1, Math.max(0, image[i * 3 + c])) * 255,
        );
      }
      let hits = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          if (shape(x + (sx + 0.5) / SAMPLES, y + (sy + 0.5) / SAMPLES)) hits++;
        }
      }
      pixels[i * 4 + 3] = Math.round((hits / (SAMPLES * SAMPLES)) * 255);
    }
  }
  return pixels;
};

const icon = (n, options, radius) =>
  encodePng(n, n, toRgba(neon(n, options), n, radius));

/** The share card: the mark centred on a surfaceDim field it fades into. */
const socialCard = (width, height) => {
  const side = height;
  const mark = toRgba(neon(side, { scale: 0.86, vignette: 0.5 }), side);
  const pixels = Buffer.alloc(width * height * 4);
  const [r, g, b] = DIM.map((c) => Math.round(c * 255));
  const x0 = Math.round((width - side) / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const inMark = x >= x0 && x < x0 + side;
      const j = inMark ? (y * side + x - x0) * 4 : -1;
      pixels[i] = inMark ? mark[j] : r;
      pixels[i + 1] = inMark ? mark[j + 1] : g;
      pixels[i + 2] = inMark ? mark[j + 2] : b;
      pixels[i + 3] = 255;
    }
  }
  return encodePng(width, height, pixels);
};

mkdirSync(ASSETS, { recursive: true });
mkdirSync(PUBLIC, { recursive: true });

const files = [
  [resolve(ASSETS, "favicon.png"), icon(96, { streaks: false }, 20)],
  // iOS masks the icon itself, so it goes out full bleed.
  [resolve(ASSETS, "icon.png"), icon(1024)],
  // Android's adaptive foreground: full bleed too (it hides the background
  // colour), with the mark shrunk into the 66/108 safe zone and no streaks,
  // which the launcher's mask would crop.
  [
    resolve(ASSETS, "adaptive-icon.png"),
    icon(1024, { streaks: false, scale: 0.78 }),
  ],
  // On the surfaceDim splash background; the vignette ends at the edges so
  // the square does not show.
  [
    resolve(ASSETS, "splash-icon.png"),
    icon(512, { scale: 0.9, vignette: 0.5 }),
  ],
  [resolve(PUBLIC, "og-image.png"), socialCard(1200, 630)],
];

for (const [path, data] of files) {
  writeFileSync(path, data);
  console.log(
    `icons: ${relative(REPO_ROOT, path)} (${(data.length / 1024).toFixed(1)} KB)`,
  );
}
