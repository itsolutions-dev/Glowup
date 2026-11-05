import React, { useEffect, useState } from "react";
import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import {
  PageShortcutsContext,
  usePageShortcuts,
  withPageShortcuts,
} from "../site/pageShortcuts";
import { ShortcutsDialog } from "../site/ShortcutsDialog";
import { matchShortcut, type Shortcut } from "../site/useKeyboardShortcuts";

const noop = () => {};
const shortcut = (s: Partial<Shortcut> & { key: string }): Shortcut => ({
  label: s.key,
  description: s.key,
  run: noop,
  ...s,
});
const press = (key: string, mods: Partial<Record<string, boolean>> = {}) => ({
  key,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
});

describe("matchShortcut", () => {
  const undo = shortcut({ key: "z", meta: true, description: "Undo" });
  const redo = shortcut({
    key: "z",
    meta: true,
    shift: true,
    description: "Redo",
  });
  const help = shortcut({ key: "?", description: "Help" });
  const typed = shortcut({ key: "k", meta: true, whileTyping: true });
  const all = [undo, redo, help, typed];

  it("tells Shift combinations apart", () => {
    expect(
      matchShortcut(all, press("Z", { ctrlKey: true, shiftKey: true }), false),
    ).toBe(redo);
    expect(matchShortcut(all, press("z", { ctrlKey: true }), false)).toBe(undo);
    expect(matchShortcut(all, press("?", { shiftKey: true }), false)).toBe(
      help,
    );
  });

  it("leaves typing alone, and Alt to the browser", () => {
    expect(
      matchShortcut(all, press("z", { ctrlKey: true }), true),
    ).toBeUndefined();
    expect(matchShortcut(all, press("k", { ctrlKey: true }), true)).toBe(typed);
    expect(
      matchShortcut(all, press("z", { ctrlKey: true, altKey: true }), false),
    ).toBeUndefined();
  });
});

const Providers = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 1280, height: 900 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <ThemeProvider>{children}</ThemeProvider>
  </SafeAreaProvider>
);

describe("page shortcuts", () => {
  it("are listed under This page", async () => {
    await render(
      <Providers>
        <ShortcutsDialog
          visible
          onDismiss={noop}
          shortcuts={[shortcut({ key: "t", description: "Switch the scheme" })]}
          pageShortcuts={[
            shortcut({
              key: "Delete",
              label: "Del",
              description: "Delete the selection",
            }),
          ]}
        />
      </Providers>,
    );
    expect(screen.getByText("This page")).toBeTruthy();
    expect(screen.getByText("Delete the selection")).toBeTruthy();
  });

  it("are registered while the page is mounted", async () => {
    let registered: Shortcut[] = [];
    const Page = () => {
      usePageShortcuts(PAGE);
      return null;
    };
    const PAGE = [
      shortcut({ key: "Delete", description: "Delete the selection" }),
    ];
    const Shell = ({ show }: { show: boolean }) => {
      const [list, setList] = useState<Shortcut[]>([]);
      useEffect(() => {
        registered = list;
      });
      return (
        <PageShortcutsContext.Provider value={setList}>
          {show ? <Page /> : null}
        </PageShortcutsContext.Provider>
      );
    };
    const view = await render(<Shell show />);
    expect(registered).toBe(PAGE);
    await view.rerender(<Shell show={false} />);
    expect(registered).toEqual([]);
  });
});

describe("shortcuts, after the review", () => {
  const down = shortcut({ key: "ArrowDown", description: "Move down" });

  it("leave a key a focused widget already handled alone", () => {
    expect(
      matchShortcut(
        [down],
        { ...press("ArrowDown"), defaultPrevented: true },
        false,
      ),
    ).toBeUndefined();
    expect(matchShortcut([down], press("ArrowDown"), false)).toBe(down);
  });

  it("leave the page's own out while a dialog of the site is open", () => {
    const site = [shortcut({ key: "t" })];
    expect(withPageShortcuts(site, [down], true)).toBe(site);
    expect(withPageShortcuts(site, [down], false)).toEqual([...site, down]);
  });
});
