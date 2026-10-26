import React from "react";
import { Platform } from "react-native";
import { act, render } from "@testing-library/react-native";
import { ThemeProvider, useTheme, type Theme } from "..";
import { applyWebScrollbars } from "../providers/webScrollbars";

// The browser's `document`, as far as the rule needs: one style tag in the head.
const fakeDocument = () => {
  const tags: { id: string; textContent: string; remove: () => void }[] = [];
  const doc = {
    head: {
      appendChild: (tag: (typeof tags)[number]) => {
        tags.push(tag);
      },
    },
    getElementById: (id: string) => tags.find((tag) => tag.id === id) ?? null,
    createElement: () => {
      const tag = {
        id: "",
        textContent: "",
        remove: () => {
          tags.splice(tags.indexOf(tag), 1);
        },
      };
      return tag;
    },
  };
  return { doc, tags };
};

describe("themed browser scrollbars", () => {
  const original = (globalThis as { document?: unknown }).document;
  afterEach(() => {
    (globalThis as { document?: unknown }).document = original;
    jest.restoreAllMocks();
  });

  const harness = async (props: { themeScrollbars?: boolean } = {}) => {
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

  it("writes one rule with the theme's outline colour and colour scheme", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const { doc, tags } = fakeDocument();
    (globalThis as { document?: unknown }).document = doc;

    const view = await harness();
    expect(tags).toHaveLength(1);
    expect(tags[0].id).toBe("glowup-scrollbars");
    expect(tags[0].textContent).toContain("color-scheme:light");
    expect(tags[0].textContent).toContain(
      `scrollbar-color:${view.theme().colors.outline} transparent`,
    );
    expect(tags[0].textContent).toContain("scrollbar-width:thin");

    // The same tag, rewritten for the other mode: not a second one.
    await view.toggle();
    expect(tags).toHaveLength(1);
    expect(tags[0].textContent).toContain("color-scheme:dark");
    expect(tags[0].textContent).toContain(
      `scrollbar-color:${view.theme().colors.outline} transparent`,
    );
  });

  it("can be switched off, and does nothing off the web", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const web = fakeDocument();
    (globalThis as { document?: unknown }).document = web.doc;
    await harness({ themeScrollbars: false });
    expect(web.tags).toHaveLength(0);

    jest.replaceProperty(Platform, "OS", "ios");
    const native = fakeDocument();
    (globalThis as { document?: unknown }).document = native.doc;
    await harness();
    expect(native.tags).toHaveLength(0);
  });

  it("removes its rule when the provider goes away", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const { doc, tags } = fakeDocument();
    (globalThis as { document?: unknown }).document = doc;
    const stop = applyWebScrollbars({ thumb: "#777777", dark: true });
    expect(tags).toHaveLength(1);
    stop?.();
    expect(tags).toHaveLength(0);
  });
});
