import React from "react";
import { Appearance, Pressable, StyleSheet, Text } from "react-native";
import { act, render, fireEvent } from "@testing-library/react-native";
import { parseToHsl } from "polished";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Snackbar, ThemeProvider, ToastProvider, palettes, useToast } from "..";

const scheme = () =>
  Appearance.getColorScheme() === "dark" ? "dark" : "light";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

/** The style of the snackbar's outer, absolutely positioned row. */
const rowStyle = (container: {
  queryAll: (
    p: (n: { props: Record<string, any> }) => boolean,
  ) => { props: Record<string, any> }[];
}) =>
  StyleSheet.flatten(
    container.queryAll((n) => n.props.accessibilityRole === "alert")[0].props
      .style,
  );

const drawInSafeArea = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 400, height: 800 },
        insets: { top: 20, left: 0, right: 0, bottom: 10 },
      }}
    >
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );

describe("Snackbar severity", () => {
  const colours = palettes.baseline[scheme()];
  const cases = [
    ["success", colours.success, colours.onSuccess],
    ["warning", colours.warning, colours.onWarning],
    ["info", colours.info, colours.onInfo],
    ["error", colours.error, colours.onError],
  ] as const;

  it.each(cases)(
    "%s is filled with its colour and the text on it",
    async (severity, main, onMain) => {
      const { toJSON } = await draw(
        <Snackbar
          visible
          message="Saved"
          severity={severity}
          onDismiss={() => {}}
        />,
      );
      const out = JSON.stringify(toJSON());
      expect(out).toContain(`"backgroundColor":"${main}"`);
      expect(out).toContain(`"color":"${onMain}"`);
    },
  );

  it("reads green for success and blue for info, in light and dark", () => {
    for (const mode of ["light", "dark"] as const) {
      const { hue } = parseToHsl(palettes.baseline[mode].success);
      expect(hue).toBeGreaterThan(90);
      expect(hue).toBeLessThan(160);
      const info = parseToHsl(palettes.baseline[mode].info).hue;
      expect(info).toBeGreaterThan(190);
      expect(info).toBeLessThan(250);
    }
  });

  it("outlined: the surface with the severity's outline, label and icon", async () => {
    const { toJSON } = await draw(
      <Snackbar
        visible
        message="Saved"
        severity="success"
        variant="outlined"
        onDismiss={() => {}}
      />,
    );
    const out = JSON.stringify(toJSON());
    expect(out).toContain(`"backgroundColor":"${colours.surface}"`);
    expect(out).toContain(`"borderColor":"${colours.success}"`);
    expect(out).toContain(`"color":"${colours.success}"`);
    // The filled colour is not drawn at all.
    expect(out).not.toContain(`"backgroundColor":"${colours.success}"`);
  });

  it("without a severity it is the neutral inverse surface, with no status icon", async () => {
    const { toJSON } = await draw(
      <Snackbar visible message="Saved" onDismiss={() => {}} />,
    );
    const out = JSON.stringify(toJSON());
    expect(out).toContain(`"backgroundColor":"${colours.inverseSurface}"`);
    expect(out).toContain(`"color":"${colours.inverseOnSurface}"`);
  });

  it("outlined without a severity is a plain outlined surface", async () => {
    const { toJSON } = await draw(
      <Snackbar
        visible
        message="Saved"
        variant="outlined"
        onDismiss={() => {}}
      />,
    );
    const out = JSON.stringify(toJSON());
    expect(out).toContain(`"backgroundColor":"${colours.surface}"`);
    expect(out).toContain(`"borderColor":"${colours.outline}"`);
  });
});

describe("Snackbar position", () => {
  const place = async (
    position?: React.ComponentProps<typeof Snackbar>["position"],
  ) => {
    const { container } = await drawInSafeArea(
      <Snackbar
        visible
        message="Saved"
        position={position}
        onDismiss={() => {}}
      />,
    );
    return rowStyle(container);
  };

  it("sits at the bottom centre by default, clear of the bottom inset", async () => {
    expect(await place()).toMatchObject({
      bottom: 24 + 10,
      alignItems: "center",
    });
    expect(await place("bottom-center")).toMatchObject({ bottom: 34 });
  });

  it.each([
    ["top-left", "flex-start"],
    ["top-center", "center"],
    ["top-right", "flex-end"],
  ] as const)(
    "%s hangs from the top, clear of the top inset",
    async (p, align) => {
      const style = await place(p);
      expect(style).toMatchObject({ top: 24 + 20, alignItems: align });
      expect(style.bottom).toBeUndefined();
    },
  );

  it.each([
    ["bottom-left", "flex-start"],
    ["bottom-right", "flex-end"],
  ] as const)("%s stands on the bottom edge", async (p, align) => {
    const style = await place(p);
    expect(style).toMatchObject({ bottom: 34, alignItems: align });
    expect(style.top).toBeUndefined();
  });
});

describe("Snackbar action", () => {
  it("runs the action's onClick, then dismisses", async () => {
    const order: string[] = [];
    const { getByRole } = await draw(
      <Snackbar
        visible
        message="Deleted"
        action={{ label: "Undo", onClick: () => order.push("undo") }}
        onDismiss={() => order.push("dismiss")}
      />,
    );
    await fireEvent.press(getByRole("button", { name: "Undo" }));
    expect(order).toEqual(["undo", "dismiss"]);
  });
});

describe("Snackbar timeout and onClose", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("without onClose it hides itself after the duration", async () => {
    const onDismiss = jest.fn();
    await draw(
      <Snackbar
        visible
        message="Saved"
        duration={3000}
        onDismiss={onDismiss}
      />,
    );
    await act(async () => {
      jest.advanceTimersByTime(2999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("with onClose it stays up past the duration until the close button", async () => {
    const onDismiss = jest.fn();
    const onClose = jest.fn();
    const { getByRole, getByText } = await draw(
      <Snackbar
        visible
        message="Saved"
        duration={1000}
        onDismiss={onDismiss}
        onClose={onClose}
      />,
    );
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(getByText("Saved")).toBeTruthy();

    await fireEvent.press(getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has no close button without onClose", async () => {
    const { queryByRole } = await draw(
      <Snackbar visible message="Saved" onDismiss={() => {}} />,
    );
    expect(queryByRole("button", { name: "Close" })).toBeNull();
  });
});

describe("useToast", () => {
  type Show = Parameters<ReturnType<typeof useToast>["show"]>[0];

  const Trigger = ({ options }: { options: Show }) => {
    const toast = useToast();
    return (
      <Pressable accessibilityLabel="go" onPress={() => toast.show(options)}>
        <Text>go</Text>
      </Pressable>
    );
  };

  const HelperTrigger = ({
    kind,
  }: {
    kind: "success" | "error" | "warning" | "info";
  }) => {
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

  const colours = palettes.baseline[scheme()];

  it.each(["success", "error", "warning", "info"] as const)(
    "%s() shows a toast with that severity",
    async (kind) => {
      const { getByLabelText, getByText, toJSON } = await render(
        <ThemeProvider>
          <ToastProvider>
            <HelperTrigger kind={kind} />
          </ToastProvider>
        </ThemeProvider>,
      );
      await fireEvent.press(getByLabelText("go"));
      expect(getByText(`a ${kind} message`)).toBeTruthy();
      expect(JSON.stringify(toJSON())).toContain(
        `"backgroundColor":"${colours[kind]}"`,
      );
    },
  );

  it("passes variant, position and action through", async () => {
    const onClick = jest.fn();
    const { getByLabelText, getByRole, toJSON, container } = await render(
      <ThemeProvider>
        <ToastProvider>
          <Trigger
            options={{
              message: "Moved",
              severity: "info",
              variant: "outlined",
              position: "top-right",
              action: { label: "Undo", onClick },
            }}
          />
        </ToastProvider>
      </ThemeProvider>,
    );
    await fireEvent.press(getByLabelText("go"));
    const out = JSON.stringify(toJSON());
    expect(out).toContain(`"borderColor":"${colours.info}"`);
    expect(rowStyle(container)).toMatchObject({
      top: 24,
      alignItems: "flex-end",
    });
    await fireEvent.press(getByRole("button", { name: "Undo" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses the provider's position unless the toast has its own", async () => {
    const position = async (own?: Show["position"]) => {
      const { getByLabelText, container } = await render(
        <ThemeProvider>
          <ToastProvider position="top-left">
            <Trigger options={{ message: "Hi", position: own }} />
          </ToastProvider>
        </ThemeProvider>,
      );
      await fireEvent.press(getByLabelText("go"));
      return rowStyle(container);
    };
    expect(await position()).toMatchObject({
      top: 24,
      alignItems: "flex-start",
    });
    expect(await position("bottom-right")).toMatchObject({
      bottom: 24,
      alignItems: "flex-end",
    });
  });

  it("onClose keeps the toast up until it is closed, then removes it", async () => {
    jest.useFakeTimers();
    try {
      const onClose = jest.fn();
      const { getByLabelText, getByRole, getByText, queryByText } =
        await render(
          <ThemeProvider>
            <ToastProvider>
              <Trigger
                options={{ message: "Sticky", duration: 500, onClose }}
              />
            </ToastProvider>
          </ThemeProvider>,
        );
      await fireEvent.press(getByLabelText("go"));
      await act(async () => {
        jest.advanceTimersByTime(30_000);
      });
      expect(getByText("Sticky")).toBeTruthy();

      await fireEvent.press(getByRole("button", { name: "Close" }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(queryByText("Sticky")).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("without onClose the toast times out and leaves the queue", async () => {
    jest.useFakeTimers();
    try {
      const { getByLabelText, getByText, queryByText } = await render(
        <ThemeProvider>
          <ToastProvider>
            <Trigger options={{ message: "Fleeting", duration: 500 }} />
          </ToastProvider>
        </ThemeProvider>,
      );
      await fireEvent.press(getByLabelText("go"));
      expect(getByText("Fleeting")).toBeTruthy();
      await act(async () => {
        jest.advanceTimersByTime(500);
      });
      expect(queryByText("Fleeting")).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
