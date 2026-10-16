import React from "react";
import { Appearance, Pressable, Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { Snackbar, ThemeProvider, ToastProvider, palettes, useToast } from "..";

const scheme = () =>
  Appearance.getColorScheme() === "dark" ? "dark" : "light";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("Snackbar status types", () => {
  const colours = palettes.baseline[scheme()];
  const cases = [
    ["success", colours.successContainer, colours.success],
    ["warning", colours.warningContainer, colours.warning],
    ["info", colours.infoContainer, colours.info],
    ["error", colours.errorContainer, colours.error],
  ] as const;

  it.each(cases)(
    "%s takes its container and accent from the theme",
    async (type, container, accent) => {
      const { toJSON } = await draw(
        <Snackbar visible message="Saved" type={type} onDismiss={() => {}} />,
      );
      const out = JSON.stringify(toJSON());
      expect(out).toContain(`"backgroundColor":"${container}"`);
      expect(out).toContain(accent);
    },
  );

  it("leaves the default neutral, with no status icon", async () => {
    const { toJSON } = await draw(
      <Snackbar visible message="Saved" onDismiss={() => {}} />,
    );
    expect(JSON.stringify(toJSON())).toContain(
      `"backgroundColor":"${colours.surfaceContainerHighest}"`,
    );
  });
});

describe("useToast warning and info", () => {
  const Trigger = ({ kind }: { kind: "warning" | "info" }) => {
    const toast = useToast();
    return (
      <Pressable
        accessibilityLabel="go"
        onPress={() => toast[kind](`a ${kind} message`)}
      >
        <Text>go</Text>
      </Pressable>
    );
  };

  it.each(["warning", "info"] as const)("%s() shows a toast", async (kind) => {
    const { getByLabelText, getByText } = await render(
      <ThemeProvider>
        <ToastProvider>
          <Trigger kind={kind} />
        </ToastProvider>
      </ThemeProvider>,
    );
    await fireEvent.press(getByLabelText("go"));
    expect(getByText(`a ${kind} message`)).toBeTruthy();
  });
});
