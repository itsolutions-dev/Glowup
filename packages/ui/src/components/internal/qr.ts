// QR Code (Model 2) encoder after ISO/IEC 18004: versions 1-40, error
// correction L / M / Q / H, numeric, alphanumeric and byte (UTF-8) modes, the
// eight masks and the four penalty rules. Pure TypeScript, no platform API and
// no dependency: `QrCode` draws what `encodeQr` returns.
//
// Checked against reference encoders produced outside the repo (see
// `__tests__/qr.test.ts`): every module of every symbol compared, all masks.

/** Error correction level: the share of the symbol that can be lost and read back. */
export type QrLevel = "L" | "M" | "Q" | "H";

/** The input alphabet the data was packed in: the narrowest one that holds it. */
export type QrMode = "numeric" | "alphanumeric" | "byte";

export interface QrOptions {
  /** Defaults to `"M"`. */
  level?: QrLevel;
  /** Smallest version to use (1-40); the symbol grows when the data needs more. Defaults to 1. */
  minVersion?: number;
  /** Force a mask (0-7) instead of scoring all eight and taking the best. */
  mask?: number;
}

export interface QrSymbol {
  version: number;
  /** Modules per side: `4 * version + 17`. */
  size: number;
  level: QrLevel;
  mode: QrMode;
  mask: number;
  /** `modules[y][x]`, `true` for a dark module. No quiet zone. */
  modules: boolean[][];
}

const LEVELS: QrLevel[] = ["L", "M", "Q", "H"];
// What the two format-information bits say for each level (not in the order L, M, Q, H).
const FORMAT_LEVEL_BITS: Record<QrLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

// Error correction codewords per block and number of blocks, by version
// (index 0 unused, so a table reads by version number), one row per level.
const EC_PER_BLOCK = [
  [
    0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30,
    28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30,
  ],
  [
    0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26,
    26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
    28, 28, 28,
  ],
  [
    0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28,
    26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30,
  ],
  [
    0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28,
    26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30,
  ],
];
const BLOCKS = [
  [
    0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10,
    12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  [
    0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17,
    18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  [
    0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23,
    23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  [
    0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25,
    34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
];

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

// --- Reed-Solomon over GF(256), x^8 + x^4 + x^3 + x^2 + 1 -------------------

const EXP = new Uint8Array(510);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = EXP[i + 255] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

// The generator polynomial of the given degree, without its leading 1.
const generator = (degree: number) => {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    poly.forEach((c, j) => {
      next[j] ^= c;
      next[j + 1] ^= mul(c, EXP[i]);
    });
    poly = next;
  }
  return poly.slice(1);
};

// The remainder of `data` divided by the generator: the error correction codewords.
const remainder = (data: number[], gen: number[]) => {
  const rem = new Array<number>(gen.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem.shift()!;
    rem.push(0);
    gen.forEach((c, i) => {
      rem[i] ^= mul(c, factor);
    });
  }
  return rem;
};

// --- Capacity ---------------------------------------------------------------

// Alignment pattern centres along one axis.
const alignmentPositions = (version: number) => {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step =
    version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const positions = [6];
  for (let p = version * 4 + 10; positions.length < count; p -= step) {
    positions.splice(1, 0, p);
  }
  return positions;
};

// Modules that carry data or error correction: all but the function patterns.
const dataModules = (version: number) => {
  let n = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const count = Math.floor(version / 7) + 2;
    n -= (25 * count - 10) * count - 55;
    if (version >= 7) n -= 36;
  }
  return n;
};

const totalCodewords = (version: number) => dataModules(version) >> 3;

const dataCodewords = (version: number, level: QrLevel) => {
  const l = LEVELS.indexOf(level);
  return (
    totalCodewords(version) - EC_PER_BLOCK[l][version] * BLOCKS[l][version]
  );
};

// --- Data -------------------------------------------------------------------

const utf8 = (text: string) => {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
      const low = text.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (low - 0xdc00);
        i++;
      }
    }
    if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd; // a lone surrogate
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000)
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else
      out.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 63),
        0x80 | ((c >> 6) & 63),
        0x80 | (c & 63),
      );
  }
  return out;
};

/** The narrowest mode that holds `text`: digits only, the 45 alphanumeric characters, or bytes. */
export const qrMode = (text: string): QrMode =>
  /^[0-9]*$/.test(text)
    ? "numeric"
    : /^[0-9A-Z $%*+\-./:]*$/.test(text)
      ? "alphanumeric"
      : "byte";

const MODE_BITS: Record<QrMode, number> = {
  numeric: 1,
  alphanumeric: 2,
  byte: 4,
};
const countBits = (mode: QrMode, version: number) => {
  const widths = {
    numeric: [10, 12, 14],
    alphanumeric: [9, 11, 13],
    byte: [8, 16, 16],
  };
  return widths[mode][version < 10 ? 0 : version < 27 ? 1 : 2];
};

// The mode's payload as bits, and how many characters (or bytes) it counts.
const payload = (text: string, mode: QrMode) => {
  const bits: number[] = [];
  const put = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  if (mode === "numeric") {
    for (let i = 0; i < text.length; i += 3) {
      const chunk = text.slice(i, i + 3);
      put(parseInt(chunk, 10), chunk.length * 3 + 1);
    }
    return { bits, count: text.length };
  }
  if (mode === "alphanumeric") {
    for (let i = 0; i < text.length; i += 2) {
      const a = ALPHANUMERIC.indexOf(text[i]);
      if (i + 1 < text.length) {
        put(a * 45 + ALPHANUMERIC.indexOf(text[i + 1]), 11);
      } else put(a, 6);
    }
    return { bits, count: text.length };
  }
  const bytes = utf8(text);
  bytes.forEach((b) => put(b, 8));
  return { bits, count: bytes.length };
};

/**
 * The codewords of a symbol, before they are drawn: the data (mode, count,
 * payload, terminator, padding) and the full stream, error correction included
 * and interleaved. Exported for the tests.
 */
export const qrCodewords = (
  text: string,
  level: QrLevel = "M",
  minVersion = 1,
) => {
  const mode = qrMode(text);
  const { bits: body, count } = payload(text, mode);
  let version = Math.max(1, Math.floor(minVersion));
  for (; ; version++) {
    if (version > 40) {
      throw new RangeError(
        `QR code: ${text.length} characters do not fit at level ${level}`,
      );
    }
    const width = countBits(mode, version);
    if (
      count < 2 ** width &&
      4 + width + body.length <= dataCodewords(version, level) * 8
    ) {
      break;
    }
  }

  const capacity = dataCodewords(version, level) * 8;
  const bits: number[] = [];
  const put = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  // An empty text has no segment at all: the terminator and the padding.
  if (count > 0) {
    put(MODE_BITS[mode], 4);
    put(count, countBits(mode, version));
    body.forEach((b) => bits.push(b));
  }
  put(0, Math.min(4, capacity - bits.length)); // terminator
  put(0, (8 - (bits.length % 8)) % 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  }
  for (let pad = 0xec; data.length < capacity / 8; pad ^= 0xec ^ 0x11) {
    data.push(pad);
  }

  // Split into blocks, each with its own error correction, then interleave.
  const l = LEVELS.indexOf(level);
  const blockCount = BLOCKS[l][version];
  const ecLength = EC_PER_BLOCK[l][version];
  const total = totalCodewords(version);
  const shortBlocks = blockCount - (total % blockCount);
  const shortLength = Math.floor(total / blockCount) - ecLength;
  const gen = generator(ecLength);
  const dataBlocks: number[][] = [];
  for (let b = 0, at = 0; b < blockCount; b++) {
    const length = shortLength + (b < shortBlocks ? 0 : 1);
    dataBlocks.push(data.slice(at, at + length));
    at += length;
  }
  const ecBlocks = dataBlocks.map((block) => remainder(block, gen));
  const codewords: number[] = [];
  for (let i = 0; i <= shortLength; i++) {
    dataBlocks.forEach((block) => {
      if (i < block.length) codewords.push(block[i]);
    });
  }
  for (let i = 0; i < ecLength; i++)
    ecBlocks.forEach((e) => codewords.push(e[i]));
  return { version, mode, data, codewords };
};

// --- Symbol -----------------------------------------------------------------

type Grid = boolean[][];
const grid = (size: number): Grid =>
  Array.from({ length: size }, () => new Array<boolean>(size).fill(false));

// The condition under which a mask flips the module at column x, row y.
const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

// A BCH remainder: `value` shifted by the generator's degree, divided by `poly`.
const bch = (value: number, poly: number, degree: number) => {
  let rem = value;
  for (let i = 0; i < degree; i++)
    rem = (rem << 1) ^ ((rem >>> (degree - 1)) * poly);
  return rem;
};

// The 15 format bits (level, mask, BCH code), already xored with their own mask.
const formatBits = (level: QrLevel, mask: number) => {
  const data = (FORMAT_LEVEL_BITS[level] << 3) | mask;
  return ((data << 10) | bch(data, 0x537, 10)) ^ 0x5412;
};

const drawFormat = (
  set: (x: number, y: number, dark: boolean) => void,
  size: number,
  bits: number,
) => {
  const bit = (i: number) => ((bits >>> i) & 1) !== 0;
  for (let i = 0; i <= 5; i++) set(8, i, bit(i));
  set(8, 7, bit(6));
  set(8, 8, bit(7));
  set(7, 8, bit(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
  set(8, size - 8, true); // the always-dark module
};

// The function patterns, and which modules they and the format areas claim.
const frame = (version: number) => {
  const size = version * 4 + 17;
  const modules = grid(size);
  const reserved = grid(size);
  const set = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    reserved[y][x] = true;
  };

  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  // Finders with their separators.
  [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ].forEach(([cx, cy]) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, d !== 2 && d !== 4);
      }
    }
  });
  const positions = alignmentPositions(version);
  positions.forEach((cx, i) => {
    positions.forEach((cy, j) => {
      const last = positions.length - 1;
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === last) ||
        (i === last && j === 0)
      ) {
        return; // under a finder
      }
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    });
  });
  drawFormat(set, size, 0); // claims the format modules; each mask draws its own
  if (version >= 7) {
    const bits = (version << 12) | bch(version, 0x1f25, 12);
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      const dark = ((bits >>> i) & 1) !== 0;
      set(a, b, dark);
      set(b, a, dark);
    }
  }
  return { size, modules, reserved };
};

// The four penalty rules of the standard; the lower the score, the easier to scan.
const penalty = (modules: Grid) => {
  const size = modules.length;
  let score = 0;

  // Rules 1 and 3 read lines: runs of one colour, and 1:1:3:1:1 finder-like
  // patterns with a light margin (the quiet zone counts as light).
  const line = (at: (i: number) => boolean) => {
    const runs: number[] = [];
    let colour = false;
    let run = size; // the light margin before the line joins its first light run
    for (let i = 0; i < size; i++) {
      if (at(i) === colour) run++;
      else {
        runs.push(run);
        colour = at(i);
        run = 1;
      }
    }
    runs.push(run + (colour ? 0 : size));
    if (colour) runs.push(size);
    for (let k = 0; k + 6 < runs.length; k += 2) {
      const n = runs[k + 1];
      if (
        runs[k + 2] === n &&
        runs[k + 3] === 3 * n &&
        runs[k + 4] === n &&
        runs[k + 5] === n
      ) {
        if (runs[k] >= 4 * n && runs[k + 6] >= n) score += 40;
        if (runs[k + 6] >= 4 * n && runs[k] >= n) score += 40;
      }
    }
  };
  const runScore = (at: (i: number) => boolean) => {
    let length = 1;
    for (let i = 1; i < size; i++) {
      if (at(i) === at(i - 1)) {
        length++;
        if (length === 5) score += 3;
        else if (length > 5) score += 1;
      } else length = 1;
    }
  };
  for (let a = 0; a < size; a++) {
    line((i) => modules[a][i]);
    line((i) => modules[i][a]);
    runScore((i) => modules[a][i]);
    runScore((i) => modules[i][a]);
  }

  // Rule 2: 2x2 blocks of one colour.
  let dark = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules[y][x]) dark++;
      if (
        x < size - 1 &&
        y < size - 1 &&
        modules[y][x] === modules[y][x + 1] &&
        modules[y][x] === modules[y + 1][x] &&
        modules[y][x] === modules[y + 1][x + 1]
      ) {
        score += 3;
      }
    }
  }

  // Rule 4: 10 per whole 5% the dark share is off 50%.
  const total = size * size;
  score += 10 * Math.floor(Math.abs(dark * 20 - total * 10) / total);
  return score;
};

/**
 * Encodes `text` as a QR code symbol. Throws a `RangeError` when it does not
 * fit in version 40 at the level (2953 bytes at `"L"`, 1273 at `"H"`).
 */
export const encodeQr = (text: string, options: QrOptions = {}): QrSymbol => {
  const { level = "M", minVersion = 1, mask: forced } = options;
  if (
    forced !== undefined &&
    !(forced >= 0 && forced <= 7 && Number.isInteger(forced))
  ) {
    throw new RangeError("QR code: mask must be an integer from 0 to 7");
  }
  const { version, mode, codewords } = qrCodewords(text, level, minVersion);
  const { size, modules: base, reserved } = frame(version);

  // The codewords, most significant bit first, up the right-most column pair
  // and back down the next, skipping the vertical timing pattern.
  let bit = 0;
  const bitCount = codewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = ((right + 1) & 2) === 0 ? size - 1 - v : v;
        if (reserved[y][x] || bit >= bitCount) continue;
        base[y][x] = ((codewords[bit >> 3] >>> (7 - (bit & 7))) & 1) !== 0;
        bit++;
      }
    }
  }

  const masked = (mask: number) => {
    const modules = base.map((row, y) =>
      row.map((dark, x) =>
        reserved[y][x] ? dark : dark !== MASKS[mask](x, y),
      ),
    );
    drawFormat(
      (x, y, dark) => {
        modules[y][x] = dark;
      },
      size,
      formatBits(level, mask),
    );
    return modules;
  };

  if (forced !== undefined) {
    return {
      version,
      size,
      level,
      mode,
      mask: forced,
      modules: masked(forced),
    };
  }
  let best = { mask: 0, modules: masked(0), score: Infinity };
  best.score = penalty(best.modules);
  for (let mask = 1; mask < 8; mask++) {
    const modules = masked(mask);
    const score = penalty(modules);
    if (score < best.score) best = { mask, modules, score };
  }
  return { version, size, level, mode, mask: best.mask, modules: best.modules };
};

/**
 * The dark modules as one SVG path of rectangles (a run of neighbours in a row
 * is one rectangle), each module one unit square at `offset` from the corner.
 */
export const qrPath = (modules: boolean[][], offset = 0) => {
  let d = "";
  modules.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!row[x]) continue;
      let end = x + 1;
      while (end < row.length && row[end]) end++;
      d += `M${x + offset} ${y + offset}h${end - x}v1h-${end - x}z`;
      x = end; // `end` is light, or past the row
    }
  });
  return d;
};
