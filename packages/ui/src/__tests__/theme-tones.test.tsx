import React from "react";
import { Appearance } from "react-native";
import { render } from "@testing-library/react-native";
import { getLuminance } from "polished";
import { ThemeProvider, palettes, useTheme, type Theme } from "..";
import { elevationStyle } from "../components/internal/elevation";

const CONTAINERS = [
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
] as const;

const all = Object.values(palettes);

describe.each(["light", "dark"] as const)("%s surfaces", (mode) => {
  // Each step up the container scale is a step away from the page: darker on
  // light, lighter on dark. Light Highest was lighter than High.
  it.each(all.map((p) => [p.id, p] as const))(
    "%s: the containers step in order",
    (_id, palette) => {
      const tones = CONTAINERS.map((k) => getLuminance(palette[mode][k]));
      for (let i = 1; i < tones.length; i++) {
        if (mode === "light")
          expect(tones[i]).toBeLessThanOrEqual(tones[i - 1]);
        else expect(tones[i]).toBeGreaterThanOrEqual(tones[i - 1]);
      }
    },
  );
});

describe("elevationStyle", () => {
  it.each(["light", "dark"] as const)(
    "never steps back toward the page in %s (level 5 was surfaceDim)",
    async (mode) => {
      jest.spyOn(Appearance, "getColorScheme").mockReturnValue(mode);
      let theme: Theme | undefined;
      const Probe = () => {
        theme = useTheme().theme;
        return null;
      };
      await render(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>,
      );
      const tones = [0, 1, 2, 3, 4, 5].map((level) =>
        getLuminance(elevationStyle(theme!, level).backgroundColor as string),
      );
      for (let i = 1; i < tones.length; i++) {
        if (mode === "light")
          expect(tones[i]).toBeLessThanOrEqual(tones[i - 1]);
        else expect(tones[i]).toBeGreaterThanOrEqual(tones[i - 1]);
      }
    },
  );
});

describe("useTheme outside a ThemeProvider", () => {
  it("is the light theme a provider gives with no OS preference", async () => {
    jest.spyOn(Appearance, "getColorScheme").mockReturnValue(null);
    const seen: Theme[] = [];
    const Probe = () => {
      seen.push(useTheme().theme);
      return null;
    };
    await render(<Probe />);
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(seen[0].isDark).toBe(false);
    expect(seen[0].colors).toEqual(seen[1].colors);
  });
});
