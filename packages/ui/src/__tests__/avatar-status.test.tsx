import React from "react";
import { Appearance, StyleSheet } from "react-native";
import { render } from "@testing-library/react-native";
import { Avatar, ThemeProvider, useTheme, type Theme } from "..";

type Node = { props: { style?: unknown } };

// The status dots were fixed hexes (#4CAF50, #FFB300): they ignored the
// theme's status roles, in both modes.
it.each(["light", "dark"] as const)(
  "the status dots take the theme's status colours in %s",
  async (mode) => {
    jest.spyOn(Appearance, "getColorScheme").mockReturnValue(mode);
    let theme: Theme | undefined;
    const Probe = () => {
      theme = useTheme().theme;
      return null;
    };
    const colours = async (status: "online" | "away" | "busy" | "offline") => {
      const view = await render(
        <ThemeProvider>
          <Probe />
          <Avatar name="Ada Lovelace" status={status} />
        </ThemeProvider>,
      );
      return view.container
        .queryAll((n: Node) => !!n.props.style)
        .map((n: Node) => StyleSheet.flatten(n.props.style as never))
        .map((s) => (s as { backgroundColor?: string }).backgroundColor);
    };
    expect(await colours("online")).toContain(theme!.colors.success);
    expect(await colours("away")).toContain(theme!.colors.warning);
    expect(await colours("busy")).toContain(theme!.colors.error);
    expect(await colours("offline")).toContain(theme!.colors.outline);
  },
);
