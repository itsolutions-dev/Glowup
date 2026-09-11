// Draws the app icon set and the site favicon from the theme's own colour
// tokens, so the marks cannot end up a different purple from the UI they sit
// next to.
//
// No image dependency: a PNG is a signature, three chunks and a zlib stream,
// and zlib ships with Node. Adding sharp or canvas to a documentation site to
// draw five flat shapes is not a trade worth making.
//
// Run with `npm run icons -w @its/glowup-playground`. The output is committed —
// regenerate it when theme.json's primary colours change, which is the only
// thing that alters it.
// Imported explicitly rather than taken from the global: these scripts are
// linted with the app's own globals, which do not include Buffer.
import { Buffer } from "node:buffer";
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../..");
const ASSETS = resolve(HERE, "../assets");
// Expo copies `public/` into the export root verbatim, which is what an OG
// image needs: a stable URL, not a content-hashed path under _expo/static.
const PUBLIC = resolve(HERE, "../public");

const theme = JSON.parse(
  await import("node:fs/promises").then((fs) =>
    fs.readFile(
      resolve(REPO_ROOT, "packages/ui/src/providers/theme.json"),
      "utf8",
    ),
  ),
);

const light = theme.colors.light;

const rgba = (hex, alpha = 255) => {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    alpha,
  ];
};

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

  // One filter byte per scanline. Filter 0 (none) keeps the encoder trivial;
  // these images are flat colour and compress well regardless.
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

// --- Drawing ----------------------------------------------------------------

const SAMPLES = 4; // supersampling per axis, for edges that are not stair-stepped

/**
 * Coverage of one pixel by a shape, in 0..1, by sampling a SAMPLES×SAMPLES grid
 * inside it. Cheap, exact enough for flat shapes, and the reason the corners
 * and the star's cusps do not look chewed.
 */
const coverage = (x, y, inside) => {
  let hits = 0;
  for (let sy = 0; sy < SAMPLES; sy++) {
    for (let sx = 0; sx < SAMPLES; sx++) {
      const px = x + (sx + 0.5) / SAMPLES;
      const py = y + (sy + 0.5) / SAMPLES;
      if (inside(px, py)) hits++;
    }
  }
  return hits / (SAMPLES * SAMPLES);
};

const blend = (pixels, index, [r, g, b, a], alpha) => {
  const src = (a / 255) * alpha;
  if (src <= 0) return;
  const dstAlpha = pixels[index + 3] / 255;
  const outAlpha = src + dstAlpha * (1 - src);
  if (outAlpha === 0) return;
  for (let channel = 0; channel < 3; channel++) {
    const dst = pixels[index + channel];
    const source = [r, g, b][channel];
    pixels[index + channel] = Math.round(
      (source * src + dst * dstAlpha * (1 - src)) / outAlpha,
    );
  }
  pixels[index + 3] = Math.round(outAlpha * 255);
};

const paint = (pixels, width, height, colour, inside) => {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = coverage(x, y, inside);
      if (alpha > 0) blend(pixels, (y * width + x) * 4, colour, alpha);
    }
  }
};

const roundedRect = (x0, y0, x1, y1, radius) => (px, py) => {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false;
  const cx = Math.min(Math.max(px, x0 + radius), x1 - radius);
  const cy = Math.min(Math.max(py, y0 + radius), y1 - radius);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
};

/**
 * The mark: a four-pointed spark, the shape an astroid describes —
 * |x|^(2/3) + |y|^(2/3) ≤ r^(2/3). Concave sides, sharp cusps, and no glyph
 * data needed to draw it.
 */
const spark = (cx, cy, radius) => (px, py) => {
  const dx = Math.abs(px - cx);
  const dy = Math.abs(py - cy);
  const k = 2 / 3;
  return Math.pow(dx, k) + Math.pow(dy, k) <= Math.pow(radius, k);
};

const blank = (width, height) => Buffer.alloc(width * height * 4, 0);

// --- The icons --------------------------------------------------------------

const PRIMARY = rgba(light.primary);
const ON_PRIMARY = rgba(light.onPrimary);
const PRIMARY_CONTAINER = rgba(light.primaryContainer);
const SURFACE = rgba(light.surfaceContainerLow);

/** Full-bleed square: what iOS and the web favicon mask themselves. */
const badge = (size, { background = PRIMARY, mark = ON_PRIMARY, radius }) => {
  const pixels = blank(size, size);
  paint(
    pixels,
    size,
    size,
    background,
    roundedRect(0, 0, size, size, radius ?? size * 0.22),
  );
  paint(pixels, size, size, mark, spark(size / 2, size / 2, size * 0.34));
  return encodePng(size, size, pixels);
};

/** Transparent ground, mark only — Android composites its own background. */
const markOnly = (size, colour = PRIMARY, scale = 0.28) => {
  const pixels = blank(size, size);
  paint(pixels, size, size, colour, spark(size / 2, size / 2, size * scale));
  return encodePng(size, size, pixels);
};

const socialCard = (width, height) => {
  const pixels = blank(width, height);
  paint(pixels, width, height, SURFACE, () => true);

  const badgeSize = Math.round(height * 0.42);
  const x0 = (width - badgeSize) / 2;
  const y0 = (height - badgeSize) / 2;
  paint(
    pixels,
    width,
    height,
    PRIMARY,
    roundedRect(x0, y0, x0 + badgeSize, y0 + badgeSize, badgeSize * 0.24),
  );
  paint(
    pixels,
    width,
    height,
    ON_PRIMARY,
    spark(width / 2, height / 2, badgeSize * 0.34),
  );

  // Two tonal sparks off to the sides, so the card is not a lone square.
  paint(
    pixels,
    width,
    height,
    PRIMARY_CONTAINER,
    spark(width * 0.2, height * 0.32, height * 0.1),
  );
  paint(
    pixels,
    width,
    height,
    PRIMARY_CONTAINER,
    spark(width * 0.82, height * 0.7, height * 0.07),
  );

  return encodePng(width, height, pixels);
};

mkdirSync(ASSETS, { recursive: true });
mkdirSync(PUBLIC, { recursive: true });

const files = [
  [resolve(ASSETS, "favicon.png"), badge(96, { radius: 20 })],
  [resolve(ASSETS, "icon.png"), badge(1024, { radius: 0 })],
  [resolve(ASSETS, "adaptive-icon.png"), markOnly(1024)],
  [resolve(ASSETS, "splash-icon.png"), markOnly(512, PRIMARY, 0.32)],
  [resolve(PUBLIC, "og-image.png"), socialCard(1200, 630)],
];

for (const [path, data] of files) {
  writeFileSync(path, data);
  console.log(
    `icons: ${relative(REPO_ROOT, path)} (${(data.length / 1024).toFixed(1)} KB)`,
  );
}
