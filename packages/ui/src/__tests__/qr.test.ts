import {
  encodeQr,
  qrCodewords,
  qrMode,
  qrPath,
  type QrLevel,
} from "../components/internal/qr";
import vectors from "./__fixtures__/qr-vectors.json";

// The matrices come from reference encoders installed outside the repo (see
// `_generated` in the fixture): every module of every case is compared.
const LEVELS: QrLevel[] = ["L", "M", "Q", "H"];

const rows = (modules: boolean[][]) =>
  modules
    .map((row) => row.map((dark) => (dark ? "1" : "0")).join(""))
    .join("/");

const fnv = (text: string) => {
  let h = 0x811c9dc5;
  for (const ch of text.replace(/\//g, "")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
};

describe("qrMode", () => {
  it("takes the narrowest alphabet that holds the text", () => {
    expect(qrMode("0123456789")).toBe("numeric");
    expect(qrMode("HELLO WORLD $%*+-./:")).toBe("alphanumeric");
    expect(qrMode("Hello")).toBe("byte");
    expect(qrMode("caffè")).toBe("byte");
  });
});

describe("codewords", () => {
  it("packs the ISO 18004 example, 01234567 at version 1-M", () => {
    const { version, mode, data, codewords } = qrCodewords("01234567", "M");
    expect([version, mode]).toEqual([1, "numeric"]);
    expect(data).toEqual([
      16, 32, 12, 86, 97, 128, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17,
    ]);
    expect(codewords.slice(data.length)).toEqual([
      165, 36, 212, 193, 237, 54, 199, 135, 44, 85,
    ]);
  });

  it("matches the worked HELLO WORLD example, version 1-M", () => {
    const { data, codewords } = qrCodewords("HELLO WORLD", "M");
    expect(data).toEqual([
      32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17,
    ]);
    expect(codewords.slice(data.length)).toEqual([
      196, 35, 39, 119, 235, 215, 231, 226, 93, 23,
    ]);
  });

  it("interleaves the blocks of a multi-block version", () => {
    // Version 5-Q has 2 short blocks of 15 data codewords and 2 of 16.
    const { version, data, codewords } = qrCodewords("a".repeat(50), "Q");
    expect(version).toBe(5);
    expect(data).toHaveLength(62);
    expect(codewords).toHaveLength(134);
    // Round-robin: the first codewords are the heads of the four blocks.
    expect(codewords.slice(0, 4)).toEqual([
      data[0],
      data[15],
      data[30],
      data[46],
    ]);
    // The long blocks' extra codeword closes the data, after the short rows.
    expect(codewords.slice(60, 62)).toEqual([data[45], data[61]]);
  });
});

describe("capacity", () => {
  const version = (text: string, level: QrLevel) =>
    encodeQr(text, { level }).version;

  it("grows the version exactly where the standard's tables say", () => {
    expect(version("1".repeat(41), "L")).toBe(1);
    expect(version("1".repeat(42), "L")).toBe(2);
    expect(version("A".repeat(25), "L")).toBe(1);
    expect(version("A".repeat(26), "L")).toBe(2);
    expect(version("a".repeat(17), "L")).toBe(1);
    expect(version("a".repeat(18), "L")).toBe(2);
    expect(version("a".repeat(2953), "L")).toBe(40);
    expect(version("a".repeat(1273), "H")).toBe(40);
    expect(version("1".repeat(7089), "L")).toBe(40);
  });

  it("counts bytes, not characters, in byte mode", () => {
    // "è" is 2 bytes, an emoji 4: 17 bytes fit version 1-L, 18 do not.
    expect(version("è".repeat(8) + "a", "L")).toBe(1);
    expect(version("è".repeat(9), "L")).toBe(2);
    expect(version("\u{1F600}".repeat(4) + "a", "L")).toBe(1);
    expect(version("\u{1F600}".repeat(4) + "ab", "L")).toBe(2);
  });

  it("throws a RangeError when the text fits no version", () => {
    expect(() => encodeQr("a".repeat(2954), { level: "L" })).toThrow(
      RangeError,
    );
    expect(() => encodeQr("1".repeat(7090), { level: "L" })).toThrow(
      RangeError,
    );
    expect(() => encodeQr("a".repeat(1274), { level: "H" })).toThrow(
      RangeError,
    );
  });

  it("honours minVersion and refuses a bad mask", () => {
    expect(encodeQr("a", { minVersion: 7 }).version).toBe(7);
    expect(encodeQr("a", { minVersion: 7 }).size).toBe(45);
    expect(() => encodeQr("a", { mask: 8 })).toThrow(RangeError);
    expect(() => encodeQr("a", { mask: 1.5 })).toThrow(RangeError);
  });

  it("encodes an empty text as a version 1 symbol", () => {
    const symbol = encodeQr("");
    expect(symbol.version).toBe(1);
    expect(symbol.modules).toHaveLength(21);
  });
});

describe("symbol structure", () => {
  const { modules, size } = encodeQr("structure", {
    level: "Q",
    minVersion: 7,
  });

  it("is square, 4 * version + 17 modules a side", () => {
    expect(size).toBe(45);
    expect(modules.every((row) => row.length === size)).toBe(true);
  });

  it("has three finder patterns and the always-dark module", () => {
    const finder = [
      "1111111",
      "1000001",
      "1011101",
      "1011101",
      "1011101",
      "1000001",
      "1111111",
    ];
    const at = (x: number, y: number) =>
      finder.every((line, dy) =>
        line
          .split("")
          .every((c, dx) => modules[y + dy][x + dx] === (c === "1")),
      );
    expect(at(0, 0)).toBe(true);
    expect(at(size - 7, 0)).toBe(true);
    expect(at(0, size - 7)).toBe(true);
    expect(modules[size - 8][8]).toBe(true);
  });

  it("alternates the timing patterns between the finders", () => {
    for (let i = 8; i < size - 8; i++) {
      expect(modules[6][i]).toBe(i % 2 === 0);
      expect(modules[i][6]).toBe(i % 2 === 0);
    }
  });
});

describe("against reference encoders", () => {
  it.each(vectors.full.map((v, i) => [i, v] as const))(
    "case %i matches module for module",
    (_, v) => {
      const symbol = encodeQr(v.text, {
        level: v.level as QrLevel,
        mask: v.forcedMask ? v.mask : undefined,
      });
      expect(symbol.mode).toBe(v.mode);
      expect(symbol.version).toBe(v.version);
      expect(symbol.mask).toBe(v.mask);
      expect(rows(symbol.modules)).toBe(v.rows);
    },
  );

  it("covers every mask, versions with version information and the UTF-8 case", () => {
    const masks = vectors.full.filter((v) => v.forcedMask).map((v) => v.mask);
    expect(masks.sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(
      Math.max(...vectors.full.map((v) => v.version)),
    ).toBeGreaterThanOrEqual(7);
    expect(vectors.full.some((v) => /[^\x00-\x7f]/.test(v.text))).toBe(true);
  });

  // Every version at every level, a short text pinned to it with minVersion,
  // and the longest byte text that still fits it: the capacity tables, the
  // alignment patterns and the version information of all 40 versions.
  describe.each(LEVELS)("level %s, versions 1 to 40", (level) => {
    it("matches for a short text", () => {
      for (let v = 1; v <= 40; v++) {
        const symbol = encodeQr("https://example.com/" + v, {
          level,
          minVersion: v,
        });
        const [hash, mask] =
          vectors.sweepShort[
            `${v}${level}` as keyof typeof vectors.sweepShort
          ].split(":");
        expect([v, fnv(rows(symbol.modules)), String(symbol.mask)]).toEqual([
          v,
          hash,
          mask,
        ]);
      }
    });

    it("matches for a text that fills the version", () => {
      for (let v = 1; v <= 40; v++) {
        const entry =
          vectors.sweepFull[`${v}${level}` as keyof typeof vectors.sweepFull];
        if (!entry) continue;
        const [length, hash, mask] = entry.split(":");
        const text = Array.from({ length: Number(length) }, (_, i) =>
          String.fromCharCode(97 + ((i * 7 + v) % 26)),
        ).join("");
        const symbol = encodeQr(text, { level });
        expect([
          v,
          symbol.version,
          fnv(rows(symbol.modules)),
          String(symbol.mask),
        ]).toEqual([v, v, hash, mask]);
      }
    });
  });

  it("matches for mixed text in all three modes, scoring the masks itself", () => {
    const modes = new Set<string>();
    vectors.mixed.forEach((v) => {
      const symbol = encodeQr(v.text, { level: v.level as QrLevel });
      modes.add(symbol.mode);
      expect([
        v.text,
        symbol.version,
        symbol.mask,
        fnv(rows(symbol.modules)),
      ]).toEqual([v.text, v.version, v.mask, v.hash]);
    });
    expect([...modes].sort()).toEqual(["alphanumeric", "byte", "numeric"]);
  });
});

describe("qrPath", () => {
  it("draws a run of dark modules as one rectangle and shifts by the offset", () => {
    const modules = [
      [true, true, false, true],
      [false, false, false, false],
      [false, true, true, true],
    ];
    expect(qrPath(modules)).toBe("M0 0h2v1h-2zM3 0h1v1h-1zM1 2h3v1h-3z");
    expect(qrPath(modules, 4)).toBe("M4 4h2v1h-2zM7 4h1v1h-1zM5 6h3v1h-3z");
  });
});
