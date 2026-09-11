import {
  BASELINE_SEED,
  createPalette,
  palettes,
  type ThemeColorTokens,
} from "../index";

const tokenNames = Object.keys(
  palettes.baseline.light,
) as (keyof ThemeColorTokens)[];

/** CIELAB lightness, the quantity a Material tone is. */
const lightness = (hex: string) => {
  const value = parseInt(hex.replace("#", ""), 16);
  const linear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const y =
    0.2126729 * linear(((value >> 16) & 255) / 255) +
    0.7151522 * linear(((value >> 8) & 255) / 255) +
    0.072175 * linear((value & 255) / 255);
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (y * 24389) / 27;
};

describe("palettes", () => {
  it("gives every shipped palette the complete token set in both schemes", () => {
    Object.values(palettes).forEach((palette) => {
      tokenNames.forEach((token) => {
        expect(typeof palette.light[token]).toBe("string");
        expect(typeof palette.dark[token]).toBe("string");
      });
    });
  });

  it("derives the baseline scheme from its own seed, to within a tone", () => {
    const derived = createPalette(BASELINE_SEED);
    // Not identical — the shipped baseline is hand-authored in HCT, this is
    // CIELAB — but a role must not land on a different tone, or contrast goes.
    (["primary", "onSurface", "surface", "secondary"] as const).forEach(
      (token) => {
        expect(
          Math.abs(
            lightness(derived.light[token]) -
              lightness(palettes.baseline.light[token]),
          ),
        ).toBeLessThan(4);
      },
    );
  });

  it("keeps text legible on its container in both schemes", () => {
    Object.values(palettes).forEach((palette) => {
      (
        [
          ["primary", "onPrimary"],
          ["primaryContainer", "onPrimaryContainer"],
          ["secondaryContainer", "onSecondaryContainer"],
          ["tertiaryContainer", "onTertiaryContainer"],
          ["surface", "onSurface"],
        ] as const
      ).forEach(([bg, fg]) => {
        (["light", "dark"] as const).forEach((scheme) => {
          const distance = Math.abs(
            lightness(palette[scheme][bg]) - lightness(palette[scheme][fg]),
          );
          // Compared as a labelled tuple so a failure names the palette.
          expect([palette.id, scheme, bg, distance > 40]).toEqual([
            palette.id,
            scheme,
            bg,
            true,
          ]);
        });
      });
    });
  });
});
