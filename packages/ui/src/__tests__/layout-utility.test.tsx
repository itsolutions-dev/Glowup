import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { render, renderHook } from "@testing-library/react-native";
import AbsoluteCenter from "../components/Layout/AbsoluteCenter";
import Box from "../components/Layout/Box";
import Break from "../components/Layout/Break";
import Center from "../components/Layout/Center";
import Visible from "../components/Visible";
import { SizeClass, useBreakpointValue } from "../hooks/useBreakpoint";
import ViewportProvider from "../providers/Viewport";
import { Theme, ThemeProvider, useTheme } from "../providers/ThemeProvider";

let theme: Theme;
const Probe = () => {
  const current = useTheme().theme;
  useEffect(() => {
    theme = current;
  }, [current]);
  return null;
};

const draw = (ui: React.ReactElement, width?: number) =>
  render(
    <ThemeProvider>
      <Probe />
      <ViewportProvider width={width}>{ui}</ViewportProvider>
    </ThemeProvider>,
  );

const style = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

describe("AbsoluteCenter", () => {
  it("fills the parent and centres on both axes by default", async () => {
    const { getByTestId } = await draw(
      <AbsoluteCenter testID="c">
        <Text>x</Text>
      </AbsoluteCenter>,
    );
    expect(style(getByTestId("c"))).toMatchObject({
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: "center",
      justifyContent: "center",
    });
  });

  it("centres only horizontally", async () => {
    const { getByTestId } = await draw(
      <AbsoluteCenter testID="c" axis="horizontal" />,
    );
    const s = style(getByTestId("c"));
    expect(s.alignItems).toBe("center");
    expect(s.justifyContent).toBeUndefined();
  });

  it("centres only vertically", async () => {
    const { getByTestId } = await draw(
      <AbsoluteCenter testID="c" axis="vertical" />,
    );
    const s = style(getByTestId("c"));
    expect(s.justifyContent).toBe("center");
    expect(s.alignItems).toBeUndefined();
  });

  it("lets presses through to what is under it, but not the child's", async () => {
    const { getByTestId } = await draw(<AbsoluteCenter testID="c" />);
    expect(style(getByTestId("c")).pointerEvents).toBe("box-none");
  });

  it("renders its children and merges style last", async () => {
    const { getByText, getByTestId } = await draw(
      <AbsoluteCenter testID="c" style={{ top: 10 }}>
        <Text>inside</Text>
      </AbsoluteCenter>,
    );
    expect(getByText("inside")).toBeTruthy();
    expect(style(getByTestId("c")).top).toBe(10);
  });

  it("passes view props on, such as accessibility", async () => {
    const { getByLabelText } = await draw(
      <AbsoluteCenter accessibilityLabel="spinner" accessible />,
    );
    expect(getByLabelText("spinner")).toBeTruthy();
  });
});

describe("Break", () => {
  it("cancels the padding of a container with negative margins", async () => {
    const { getByTestId } = await draw(
      <Box padding={16}>
        <Break testID="b" inline={16} block={8} />
      </Box>,
    );
    expect(style(getByTestId("b"))).toEqual({
      marginStart: -16,
      marginEnd: -16,
      marginTop: -8,
      marginBottom: -8,
    });
  });

  it("takes a spacing token and resolves it through the theme", async () => {
    const { getByTestId } = await draw(
      <Break testID="b" inline="m" block="xs" />,
    );
    expect(style(getByTestId("b"))).toEqual({
      marginStart: -theme.spacing.m,
      marginEnd: -theme.spacing.m,
      marginTop: -theme.spacing.xs,
      marginBottom: -theme.spacing.xs,
    });
  });

  it("breaks out of one edge only", async () => {
    const { getByTestId } = await draw(<Break testID="b" blockStart={12} />);
    expect(style(getByTestId("b"))).toEqual({ marginTop: -12 });
  });

  it("lets an edge win over its axis", async () => {
    const { getByTestId } = await draw(
      <Break testID="b" inline={16} inlineEnd={0} blockEnd="s" block={4} />,
    );
    expect(style(getByTestId("b"))).toEqual({
      marginStart: -16,
      marginTop: -4,
      marginBottom: -theme.spacing.s,
    });
  });

  it("adds no margin without props, and never a negative zero", async () => {
    const { getByTestId } = await draw(
      <>
        <Break testID="none" />
        <Break testID="zero" inline={0} />
      </>,
    );
    expect(style(getByTestId("none"))).toEqual({});
    expect(style(getByTestId("zero"))).toEqual({});
  });

  it("keeps a margin the caller sets in style", async () => {
    const { getByTestId } = await draw(
      <Break testID="b" inline={8} style={{ marginTop: 3 }} />,
    );
    expect(style(getByTestId("b"))).toEqual({
      marginStart: -8,
      marginEnd: -8,
      marginTop: 3,
    });
  });

  it("renders its children", async () => {
    const { getByText } = await draw(
      <Break inline="m">
        <Text>wide</Text>
      </Break>,
    );
    expect(getByText("wide")).toBeTruthy();
  });
});

describe("Center", () => {
  it("is a Box centred on both axes, as a row", async () => {
    const { getByTestId } = await draw(<Center testID="c" />);
    expect(style(getByTestId("c"))).toEqual({
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    });
  });

  it("is a centred column with direction=column", async () => {
    const { getByTestId } = await draw(
      <Center testID="c" direction="column" />,
    );
    expect(style(getByTestId("c"))).toEqual({
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    });
  });

  it("takes the other Box props", async () => {
    const { getByTestId } = await draw(
      <Center
        testID="c"
        width={200}
        height={100}
        padding={8}
        background="surfaceContainer"
        radius="medium"
        gap={4}
      />,
    );
    expect(style(getByTestId("c"))).toMatchObject({
      width: 200,
      height: 100,
      padding: 8,
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.shape.medium,
      gap: 4,
      alignItems: "center",
    });
  });

  it("renders its children and merges style last", async () => {
    const { getByText, getByTestId } = await draw(
      <Center testID="c" style={{ alignItems: "flex-start" }}>
        <Text>in the middle</Text>
      </Center>,
    );
    expect(getByText("in the middle")).toBeTruthy();
    expect(style(getByTestId("c")).alignItems).toBe("flex-start");
  });
});

describe("Visible", () => {
  const sizes: [string, number][] = [
    ["compact", 360],
    ["medium", 700],
    ["expanded", 900],
    ["large", 1300],
    ["extraLarge", 1700],
  ];

  const shows = async (ui: React.ReactElement, width: number) => {
    const { queryByText } = await draw(ui, width);
    return !!queryByText("child");
  };

  it("shows its children by default", async () => {
    expect(
      await shows(
        <Visible>
          <Text>child</Text>
        </Visible>,
        360,
      ),
    ).toBe(true);
  });

  it("hides them when `when` is false, and shows the fallback", async () => {
    const { queryByText, getByText } = await draw(
      <Visible when={false} fallback={<Text>fallback</Text>}>
        <Text>child</Text>
      </Visible>,
    );
    expect(queryByText("child")).toBeNull();
    expect(getByText("fallback")).toBeTruthy();
  });

  it("renders nothing for a false `when` without a fallback", async () => {
    const { queryByText } = await draw(
      <Visible when={false}>
        <Text>child</Text>
      </Visible>,
    );
    expect(queryByText("child")).toBeNull();
  });

  it.each(sizes)("above=medium at %s", async (_, width) => {
    expect(
      await shows(
        <Visible above="medium">
          <Text>child</Text>
        </Visible>,
        width,
      ),
    ).toBe(width >= 600);
  });

  it.each(sizes)("below=expanded at %s", async (_, width) => {
    expect(
      await shows(
        <Visible below="expanded">
          <Text>child</Text>
        </Visible>,
        width,
      ),
    ).toBe(width < 840);
  });

  it.each(sizes)("only=large at %s", async (name, width) => {
    expect(
      await shows(
        <Visible only="large">
          <Text>child</Text>
        </Visible>,
        width,
      ),
    ).toBe(name === "large");
  });

  it.each(sizes)("only=[compact, large] at %s", async (name, width) => {
    expect(
      await shows(
        <Visible only={["compact", "large"]}>
          <Text>child</Text>
        </Visible>,
        width,
      ),
    ).toBe(name === "compact" || name === "large");
  });

  it("needs every condition: a window in range and `when`", async () => {
    const ui = (when: boolean) => (
      <Visible above="medium" below="large" when={when}>
        <Text>child</Text>
      </Visible>
    );
    expect(await shows(ui(true), 900)).toBe(true);
    expect(await shows(ui(false), 900)).toBe(false);
    expect(await shows(ui(true), 360)).toBe(false);
    expect(await shows(ui(true), 1300)).toBe(false);
  });

  it("never shows below=compact: there is nothing smaller", async () => {
    expect(
      await shows(
        <Visible below="compact">
          <Text>child</Text>
        </Visible>,
        360,
      ),
    ).toBe(false);
  });

  it("swaps in the fallback by size class", async () => {
    const ui = (
      <Visible above="expanded" fallback={<Text>rail</Text>}>
        <Text>child</Text>
      </Visible>
    );
    const wide = await draw(ui, 1000);
    expect(wide.getByText("child")).toBeTruthy();
    expect(wide.queryByText("rail")).toBeNull();
    const narrow = await draw(ui, 400);
    expect(narrow.queryByText("child")).toBeNull();
    expect(narrow.getByText("rail")).toBeTruthy();
  });

  describe("keepMounted", () => {
    const Counter = ({ onMount }: { onMount: () => void }) => {
      React.useEffect(onMount, [onMount]);
      return <Text>child</Text>;
    };

    it("hides with display none instead of unmounting", async () => {
      const { getByTestId, queryByText } = await draw(
        <Visible keepMounted when={false}>
          <View testID="kept" />
          <Text>child</Text>
        </Visible>,
      );
      // Queries skip a hidden subtree; the node itself is still in the tree.
      expect(queryByText("child")).toBeNull();
      expect(getByTestId("kept", { includeHiddenElements: true })).toBeTruthy();
    });

    it("does not remount the children when the condition flips", async () => {
      const onMount = jest.fn();
      const ui = (when: boolean) => (
        <ThemeProvider>
          <Visible keepMounted when={when}>
            <Counter onMount={onMount} />
          </Visible>
        </ThemeProvider>
      );
      const { rerender, queryByText } = await render(ui(true));
      await rerender(ui(false));
      expect(queryByText("child")).toBeNull();
      await rerender(ui(true));
      expect(queryByText("child")).toBeTruthy();
      expect(onMount).toHaveBeenCalledTimes(1);
    });

    it("lays the wrapper out as if it were not there while shown", async () => {
      const shown = await draw(
        <Visible keepMounted>
          <View testID="kept" />
        </Visible>,
      );
      expect(JSON.stringify(shown.toJSON())).toContain('"display":"contents"');
      const hidden = await draw(
        <Visible keepMounted when={false}>
          <View testID="kept" />
        </Visible>,
      );
      expect(JSON.stringify(hidden.toJSON())).toContain('"display":"none"');
    });

    it("shows the fallback beside the hidden children", async () => {
      const { getByText, queryByText } = await draw(
        <Visible keepMounted when={false} fallback={<Text>fallback</Text>}>
          <Text>child</Text>
        </Visible>,
      );
      expect(getByText("fallback")).toBeTruthy();
      expect(queryByText("child")).toBeNull();
    });

    it("shows no fallback while the children show", async () => {
      const { getByText, queryByText } = await draw(
        <Visible keepMounted fallback={<Text>fallback</Text>}>
          <Text>child</Text>
        </Visible>,
      );
      expect(getByText("child")).toBeTruthy();
      expect(queryByText("fallback")).toBeNull();
    });
  });
});

describe("useBreakpointValue", () => {
  const at = async <T,>(
    width: number,
    values: Partial<Record<SizeClass, T>>,
    fallback?: T,
  ) => {
    const { result } = await renderHook(
      () => useBreakpointValue(values, fallback as T),
      {
        wrapper: ({ children }) => (
          <ViewportProvider width={width}>{children}</ViewportProvider>
        ),
      },
    );
    return result.current;
  };

  it("returns the value set for the current size class", async () => {
    const values = {
      compact: 1,
      medium: 2,
      expanded: 3,
      large: 4,
      extraLarge: 5,
    };
    expect(await at(360, values)).toBe(1);
    expect(await at(700, values)).toBe(2);
    expect(await at(900, values)).toBe(3);
    expect(await at(1300, values)).toBe(4);
    expect(await at(1700, values)).toBe(5);
  });

  it("falls back to the largest size class below the current one", async () => {
    const values = { compact: "phone", expanded: "desktop" };
    expect(await at(700, values)).toBe("phone");
    expect(await at(900, values)).toBe("desktop");
    expect(await at(1700, values)).toBe("desktop");
  });

  it("uses the fallback when no class at or below the current one is set", async () => {
    expect(await at(360, { large: "wide" }, "narrow")).toBe("narrow");
    expect(await at(1300, { large: "wide" }, "narrow")).toBe("wide");
  });

  it("is undefined without a match and without a fallback", async () => {
    expect(await at(360, { large: "wide" })).toBeUndefined();
  });

  it("takes falsy values as values", async () => {
    expect(await at(900, { compact: 5, medium: 0 }, 9)).toBe(0);
    expect(await at(900, { compact: true, medium: false }, true)).toBe(false);
  });
});
