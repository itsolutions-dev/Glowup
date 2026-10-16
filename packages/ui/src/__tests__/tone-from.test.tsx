import React from "react";
import { render } from "@testing-library/react-native";
import {
  Chip,
  StatusBadge,
  ThemeProvider,
  toneFrom,
  toneFromColor,
  toneFromString,
} from "..";

const lightness = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 2.55;
};

describe("toneFrom", () => {
  it("is deterministic and tells strings apart", () => {
    expect(toneFromString("Lead", "light")).toEqual(
      toneFromString("Lead", "light"),
    );
    expect(toneFromString("Lead", "light")).not.toEqual(
      toneFromString("Cliente", "light"),
    );
  });

  it("keeps text legible on its tint in both schemes, for any input", () => {
    const sources = ["#1D5B9D", "#FFC107", "#9E9E9E", "#000000", "#FFFFFF"];
    const texts = ["", "a", "Lead", "Cliente", "Preventivo inviato"];
    (["light", "dark"] as const).forEach((mode) => {
      [
        ...sources.map((s) => toneFromColor(s, mode)),
        ...texts.map((t) => toneFromString(t, mode)),
      ].forEach(({ background, foreground }) => {
        expect(background).toMatch(/^#[0-9A-F]{6}$/);
        expect(
          Math.abs(lightness(background) - lightness(foreground)),
        ).toBeGreaterThan(40);
      });
    });
  });

  it("goes light on light and dark on dark", () => {
    const light = toneFromColor("#1D5B9D", "light");
    const dark = toneFromColor("#1D5B9D", "dark");
    expect(lightness(light.background)).toBeGreaterThan(
      lightness(dark.background),
    );
  });

  it("reads #RRGGBB as a colour and anything else as text", () => {
    expect(toneFrom("#1D5B9D", "light")).toEqual(
      toneFromColor("#1D5B9D", "light"),
    );
    expect(toneFrom("1D5B9D", "light")).toEqual(
      toneFromString("1D5B9D", "light"),
    );
  });

  it("tints Chip and StatusBadge from toneFrom", async () => {
    const { background } = toneFromColor("#1D5B9D", "light");
    const matches = (ui: React.ReactElement) =>
      render(<ThemeProvider>{ui}</ThemeProvider>).then(({ toJSON }) =>
        JSON.stringify(toJSON()).toUpperCase().includes(background),
      );
    expect(await matches(<Chip label="Chip" toneFrom="#1D5B9D" />)).toBe(true);
    expect(await matches(<Chip label="Chip" />)).toBe(false);
    expect(
      await matches(<StatusBadge label="Badge" toneFrom="#1D5B9D" />),
    ).toBe(true);
  });
});
