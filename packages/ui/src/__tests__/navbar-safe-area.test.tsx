import React from "react";
import { StyleSheet } from "react-native";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavBar, ThemeProvider } from "..";

// A bottom bar sat under the phone's gesture bar (Android 15 draws apps edge
// to edge): it left no room for the bottom inset, as AppBar does at the top.
const draw = (safeArea?: boolean) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <ThemeProvider>
        <NavBar
          activeId="a"
          onClick={() => {}}
          safeArea={safeArea}
          items={[
            { id: "a", label: "Dettagli", icon: "account-outline" },
            { id: "b", label: "Storico", icon: "history" },
          ]}
        />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

const barPadding = async (safeArea?: boolean) => {
  const view = await draw(safeArea);
  const bar = view.container.queryAll(
    (n: { props: Record<string, unknown> }) =>
      n.props.accessibilityRole === "tablist",
  )[0];
  return StyleSheet.flatten(bar.props.style as never) as {
    paddingBottom?: number;
    paddingVertical?: number;
  };
};

it("leaves room for the bottom inset", async () => {
  expect((await barPadding()).paddingBottom).toBe(12 + 34);
});

it("does not with safeArea={false}", async () => {
  const style = await barPadding(false);
  expect(style.paddingBottom ?? style.paddingVertical).toBe(12);
});
