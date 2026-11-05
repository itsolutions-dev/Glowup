import React from "react";
import { act, render } from "@testing-library/react-native";
import { ThemeProvider, palettes, useTheme, type Theme } from "..";
import themeConfig from "../providers/theme.json";

// The chart palette is the scheme's own steps (dark is not a flip of light),
// and a brand palette does not change it: it was validated as a set.
describe("theme.charts", () => {
  const harness = async (
    props: Omit<React.ComponentProps<typeof ThemeProvider>, "children">,
  ) => {
    let theme!: Theme;
    let toggle!: () => void;
    const Probe = () => {
      const t = useTheme();
      theme = t.theme;
      toggle = t.toggleTheme;
      return null;
    };
    await render(
      <ThemeProvider {...props}>
        <Probe />
      </ThemeProvider>,
    );
    return { theme: () => theme, toggle: () => act(async () => toggle()) };
  };

  it("follows the scheme: light steps, then dark steps", async () => {
    const view = await harness({});
    const first = view.theme();
    await view.toggle();
    const second = view.theme();
    const [light, dark] = first.isDark ? [second, first] : [first, second];
    expect(light.charts).toEqual(themeConfig.charts.light);
    expect(dark.charts).toEqual(themeConfig.charts.dark);
    expect(light.charts.categorical).toHaveLength(8);
    expect(dark.charts.categorical).not.toEqual(light.charts.categorical);
  });

  it("stays the same under a brand palette", async () => {
    const brand = Object.values(palettes).find((p) => p.id !== "baseline")!;
    const view = await harness({ initialPalette: brand });
    const expected = view.theme().isDark
      ? themeConfig.charts.dark
      : themeConfig.charts.light;
    expect(view.theme().charts).toEqual(expected);
  });
});
