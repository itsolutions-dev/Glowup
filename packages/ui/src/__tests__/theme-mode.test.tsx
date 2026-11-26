import React from "react";
import { Appearance, Text } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { ThemeProvider, useTheme, type ThemeMode } from "..";

// An app that stores the reader's scheme starts on it, with no frame of the
// other one, and can hand the choice to the provider or keep it itself (P2 in
// docs/crm-proposals.md).
const latest: { api?: ReturnType<typeof useTheme> } = {};
const keep = (api: ReturnType<typeof useTheme>) => {
  latest.api = api;
};
const Probe = () => {
  const api = useTheme();
  keep(api);
  return <Text>{api.theme.isDark ? "dark" : "light"}</Text>;
};

const withScheme = (scheme: "light" | "dark" | null) =>
  jest.spyOn(Appearance, "getColorScheme").mockReturnValue(scheme);

afterEach(() => jest.restoreAllMocks());

describe("ThemeProvider mode", () => {
  it("follows the device by default", async () => {
    withScheme("dark");
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText("dark")).toBeTruthy();
    expect(latest.api!.mode).toBe("system");
  });

  it("starts on initialMode, from the first render", async () => {
    withScheme("light");
    const seen: boolean[] = [];
    const Spy = () => {
      seen.push(useTheme().theme.isDark);
      return null;
    };
    await render(
      <ThemeProvider initialMode="dark">
        <Spy />
      </ThemeProvider>,
    );
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every(Boolean)).toBe(true);
  });

  it("keeps the choice itself and reports it", async () => {
    withScheme("light");
    const onModeChange = jest.fn();
    await render(
      <ThemeProvider initialMode="light" onModeChange={onModeChange}>
        <Probe />
      </ThemeProvider>,
    );
    await act(async () => latest.api!.toggleTheme());
    expect(screen.getByText("dark")).toBeTruthy();
    expect(onModeChange).toHaveBeenLastCalledWith("dark");
    await act(async () => latest.api!.setMode("system"));
    expect(screen.getByText("light")).toBeTruthy();
    expect(latest.api!.mode).toBe("system");
  });

  it("shows the controlled mode and only reports a change", async () => {
    withScheme("light");
    const onModeChange = jest.fn();
    const App = ({ mode }: { mode: ThemeMode }) => (
      <ThemeProvider mode={mode} onModeChange={onModeChange}>
        <Probe />
      </ThemeProvider>
    );
    const view = await render(<App mode="dark" />);
    expect(screen.getByText("dark")).toBeTruthy();
    await act(async () => latest.api!.toggleTheme());
    expect(onModeChange).toHaveBeenLastCalledWith("light");
    expect(screen.getByText("dark")).toBeTruthy();
    await view.rerender(<App mode="light" />);
    expect(screen.getByText("light")).toBeTruthy();
  });

  it("does not hand themed components a new context for an inline onModeChange", async () => {
    const values: unknown[] = [];
    const Spy = () => {
      values.push(useTheme());
      return null;
    };
    const App = () => (
      <ThemeProvider onModeChange={() => {}}>
        <Spy />
      </ThemeProvider>
    );
    const view = await render(<App />);
    await view.rerender(<App />);
    expect(values.length).toBe(2);
    expect(values[1]).toBe(values[0]);
  });
});
