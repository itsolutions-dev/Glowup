import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import {
  Icon,
  palettes,
  ThemeProvider,
  useTheme,
  type ThemePalette,
} from "../index";

const Probe = () => {
  const { theme } = useTheme();
  const { fontFamily, fontSize, fontWeight, letterSpacing } =
    theme.typography.displayLarge;
  return (
    <Text testID="probe">
      {JSON.stringify({ fontFamily, fontSize, fontWeight, letterSpacing })}
    </Text>
  );
};

const probe = async (palette?: ThemePalette) => {
  const { getByTestId } = await render(
    <ThemeProvider initialPalette={palette}>
      <Probe />
    </ThemeProvider>,
  );
  return JSON.parse(getByTestId("probe").props.children as string);
};

/** How many SVG paths `name` renders as — an Eva glyph is one, a Material glyph is text. */
const evaPaths = async (palette: ThemePalette, name: string) => {
  const { toJSON } = await render(
    <ThemeProvider initialPalette={palette}>
      <Icon source={name as never} />
    </ThemeProvider>,
  );
  return (JSON.stringify(toJSON()).match(/RNSVGPath/g) ?? []).length;
};

describe("brand palettes: typography", () => {
  it("leaves the default scale alone for palettes without one", async () => {
    expect(await probe()).toMatchObject({
      fontFamily: "System",
      fontSize: 57,
    });
  });

  it("applies Databeasy's Roboto scale", () => {
    const theme = palettes.databeasy.typography!;
    expect(theme.headlineLarge).toMatchObject({
      fontFamily: "Roboto_700Bold",
      fontWeight: "400",
      fontSize: 32,
      lineHeight: 40,
    });
    expect(theme.labelSmall).toMatchObject({
      fontFamily: "Roboto_500Medium",
      fontSize: 11,
      lineHeight: 16,
    });
  });

  it("applies inXpire's Geist scale with tighter titles, through the provider", async () => {
    expect(await probe(palettes.inxpire)).toEqual({
      fontFamily: "Geist_500Medium",
      fontSize: 56,
      fontWeight: "400",
      letterSpacing: -1.12,
    });
  });

  it("names a font file for every variant, so no text falls back to the system font", () => {
    (["databeasy", "inxpire"] as const).forEach((id) => {
      Object.entries(palettes[id].typography!).forEach(([variant, style]) => {
        expect([id, variant, typeof style.fontFamily]).toEqual([
          id,
          variant,
          "string",
        ]);
        expect(style.fontFamily).not.toBe("System");
      });
      expect(Object.keys(palettes[id].typography!)).toHaveLength(15);
    });
  });
});

describe("brand palettes: icon set", () => {
  it("draws Eva icons for inXpire where it has an equivalent", async () => {
    expect(await evaPaths(palettes.inxpire, "close")).toBe(1);
  });

  it("keeps the Material glyph for a name Eva has no match for", async () => {
    expect(await evaPaths(palettes.inxpire, "star-half-full")).toBe(0);
  });

  it("keeps Material icons on every other palette", async () => {
    expect(await evaPaths(palettes.databeasy, "close")).toBe(0);
    expect(await evaPaths(palettes.baseline, "close")).toBe(0);
  });
});
