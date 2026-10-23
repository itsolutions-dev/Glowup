import React from "react";
import { StyleSheet, Text, processColor } from "react-native";
import { act, render } from "@testing-library/react-native";
import { QrCode, ThemeProvider, useTheme, type Theme } from "..";
import { encodeQr, qrPath } from "../components/internal/qr";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);
type View = Awaited<ReturnType<typeof draw>>;

const path = (view: View) =>
  view.container.queryAll((n) => n.type === "RNSVGPath")[0];
const svg = (view: View) =>
  view.container.queryAll((n) => n.type === "RNSVGSvgView")[0];
const box = (view: View, testID = "q") =>
  StyleSheet.flatten(view.getByTestId(testID).props.style);

afterEach(() => jest.restoreAllMocks());

describe("QrCode", () => {
  it("draws the symbol the encoder makes as one path, with the quiet zone around it", async () => {
    const view = await draw(<QrCode value="HELLO WORLD" testID="q" />);
    const { modules } = encodeQr("HELLO WORLD", { level: "M" });
    expect(path(view).props.d).toBe(qrPath(modules, 4));
    // 21 modules and 4 either side: a 29-unit square.
    expect(svg(view).props).toMatchObject({ vbWidth: 29, vbHeight: 29 });
  });

  it("is an image with a label that does not give the value away", async () => {
    const view = await draw(<QrCode value="secret-token-123" testID="q" />);
    const root = view.getByTestId("q");
    expect(root.props).toMatchObject({
      accessible: true,
      accessibilityRole: "image",
      accessibilityLabel: "QR code",
    });
    expect(JSON.stringify(view.toJSON())).not.toContain("secret-token-123");
    await view.rerender(
      <ThemeProvider>
        <QrCode value="x" testID="q" accessibilityLabel="Invite link" />
      </ThemeProvider>,
    );
    expect(view.getByLabelText("Invite link")).toBeTruthy();
  });

  it("is size px square and snaps the modules to whole pixels", async () => {
    const view = await draw(<QrCode value="x" size={200} testID="q" />);
    expect(box(view)).toMatchObject({ width: 200, height: 200 });
    // 29 units in 200 px: 6 px each, 174 px drawn, centred.
    expect(svg(view).props).toMatchObject({ width: 174, height: 174 });
    const small = await draw(<QrCode value="x" size={20} testID="s" />);
    expect(svg(small).props.width).toBeCloseTo(20);
  });

  it("takes the quiet zone in modules, none included", async () => {
    const none = await draw(<QrCode value="x" quietZone={0} />);
    expect(svg(none).props.vbWidth).toBe(21);
    const wide = await draw(<QrCode value="x" quietZone={6} />);
    expect(svg(wide).props.vbWidth).toBe(33);
    expect(path(none).props.d).toBe(
      qrPath(encodeQr("x", { level: "M" }).modules, 0),
    );
  });

  it("encodes at the level asked for, and grows with it", async () => {
    const l = await draw(<QrCode value={"a".repeat(30)} level="L" />);
    const h = await draw(<QrCode value={"a".repeat(30)} level="H" />);
    expect(path(l).props.d).toBe(
      qrPath(encodeQr("a".repeat(30), { level: "L" }).modules, 4),
    );
    expect(path(h).props.d).toBe(
      qrPath(encodeQr("a".repeat(30), { level: "H" }).modules, 4),
    );
    expect(svg(h).props.vbWidth).toBeGreaterThan(svg(l).props.vbWidth);
  });

  it("changes when the value does", async () => {
    const view = await draw(<QrCode value="one" />);
    const before = path(view).props.d;
    await view.rerender(
      <ThemeProvider>
        <QrCode value="two" />
      </ThemeProvider>,
    );
    expect(path(view).props.d).not.toBe(before);
  });

  it("draws an empty value", async () => {
    const view = await draw(<QrCode value="" />);
    expect(path(view).props.d.length).toBeGreaterThan(0);
  });

  it("encodes text outside ASCII as UTF-8", async () => {
    const view = await draw(<QrCode value={"caffè €"} />);
    expect(path(view).props.d).toBe(
      qrPath(encodeQr("caffè €", { level: "M" }).modules, 4),
    );
  });
});

describe("QrCode colours", () => {
  // The theme, and a way to flip it, from inside the provider.
  const harness = async (ui: React.ReactElement) => {
    let theme!: Theme;
    let toggle!: () => void;
    const Probe = () => {
      const t = useTheme();
      theme = t.theme;
      toggle = t.toggleTheme;
      return null;
    };
    const view = await render(
      <ThemeProvider>
        <Probe />
        {ui}
      </ThemeProvider>,
    );
    return {
      view,
      theme: () => theme,
      toggle: () => act(async () => toggle()),
    };
  };

  it("keeps dark modules on a light background in both modes", async () => {
    const { view, theme, toggle } = await harness(
      <QrCode value="x" testID="q" />,
    );
    const check = () => {
      const t = theme();
      const [modules, background] = t.isDark
        ? [t.colors.inverseOnSurface, t.colors.inverseSurface]
        : [t.colors.onSurface, t.colors.surface];
      expect(path(view).props.fill.payload).toBe(processColor(modules));
      expect(box(view).backgroundColor).toBe(background);
    };
    check();
    await toggle();
    check();
  });

  it("takes a theme token or a colour string for both", async () => {
    const view = await draw(
      <QrCode value="x" testID="q" color="primary" backgroundColor="#ffeecc" />,
    );
    let primary = "";
    const Probe = () => {
      primary = useTheme().theme.colors.primary;
      return null;
    };
    await draw(<Probe />);
    expect(path(view).props.fill.payload).toBe(processColor(primary));
    expect(box(view).backgroundColor).toBe("#ffeecc");
  });
});

describe("QrCode logo", () => {
  it("raises the level to H and draws the mark in the middle", async () => {
    const view = await draw(
      <QrCode value="https://example.com" logo="wifi" size={200} testID="q" />,
    );
    expect(path(view).props.d).toBe(
      qrPath(encodeQr("https://example.com", { level: "H" }).modules, 4),
    );
    const logo = StyleSheet.flatten(view.getByTestId("q-logo").props.style);
    // Whole modules, centred on the code, on its background.
    expect(logo.position).toBe("absolute");
    expect(logo.width).toBe(logo.height);
    expect(logo.left).toBeCloseTo((200 - (logo.width as number)) / 2);
    expect(logo.top).toBe(logo.left);
    expect(logo.backgroundColor).toBe(box(view).backgroundColor);
    // About a fifth of the code's side: well inside what level H recovers.
    const { size } = encodeQr("https://example.com", { level: "H" });
    const modules =
      (logo.width as number) / (svg(view).props.width / (size + 8));
    expect(modules).toBeGreaterThanOrEqual(size / 6);
    expect(modules).toBeLessThan(size / 4);
    expect(logo.pointerEvents ?? "none").toBe("none");
  });

  it("takes any node, drawn as given", async () => {
    const view = await draw(
      <QrCode value="x" logo={<Text>LOGO</Text>} testID="q" />,
    );
    expect(view.getByText("LOGO")).toBeTruthy();
  });

  it("draws no logo box without a logo", async () => {
    const view = await draw(<QrCode value="x" testID="q" />);
    expect(view.queryByTestId("q-logo")).toBeNull();
  });

  it("centres the logo on every version, an odd or an even number of modules wide", async () => {
    for (const value of ["x", "a".repeat(60), "a".repeat(400)]) {
      const view = await draw(
        <QrCode value={value} logo="star" size={240} testID="q" />,
      );
      const logo = StyleSheet.flatten(view.getByTestId("q-logo").props.style);
      const { size: n } = encodeQr(value, { level: "H" });
      const unit = svg(view).props.width / (n + 8);
      expect(Math.round((logo.width as number) / unit) % 2).toBe(n % 2);
    }
  });
});

describe("QrCode errors", () => {
  const tooLong = "a".repeat(3000);

  it("draws an empty box and reports a value that does not fit", async () => {
    const onError = jest.fn();
    const view = await draw(
      <QrCode value={tooLong} onError={onError} size={120} testID="q" />,
    );
    expect(path(view)).toBeUndefined();
    expect(view.getByLabelText("QR code unavailable")).toBeTruthy();
    expect(box(view)).toMatchObject({ width: 120, height: 120 });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(RangeError);
  });

  it("reports once per value, not once per render", async () => {
    const onError = jest.fn();
    const view = await draw(<QrCode value={tooLong} onError={onError} />);
    await view.rerender(
      <ThemeProvider>
        <QrCode value={tooLong} onError={() => onError()} />
      </ThemeProvider>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    await view.rerender(
      <ThemeProvider>
        <QrCode value={tooLong + "b"} onError={onError} />
      </ThemeProvider>,
    );
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it("recovers when the value becomes short enough", async () => {
    const view = await draw(<QrCode value={tooLong} />);
    await view.rerender(
      <ThemeProvider>
        <QrCode value="ok" />
      </ThemeProvider>,
    );
    expect(path(view)).toBeDefined();
  });

  it("does not throw without an onError", async () => {
    const view = await draw(<QrCode value={tooLong} />);
    expect(view.getByLabelText("QR code unavailable")).toBeTruthy();
  });
});
