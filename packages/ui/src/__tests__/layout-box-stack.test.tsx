import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { render } from "@testing-library/react-native";
import * as library from "..";
import {
  Box,
  Center,
  HStack,
  Stack,
  ThemeProvider,
  VStack,
  useTheme,
} from "..";
import type { BoxVariant, Theme } from "..";

let theme: Theme;
const Probe = () => {
  const current = useTheme().theme;
  useEffect(() => {
    theme = current;
  }, [current]);
  return null;
};

const draw = (ui: React.ReactElement) =>
  render(
    <ThemeProvider>
      <Probe />
      {ui}
    </ThemeProvider>,
  );

const style = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

describe("Box", () => {
  it("is a plain View without a variant", async () => {
    const { getByTestId } = await draw(<Box testID="box" />);
    expect(style(getByTestId("box"))).toEqual({});
  });

  const centred = { alignItems: "center", justifyContent: "center" };
  const fullPage = { flex: 1, minHeight: "100%" };
  const fullSize = { width: "100%", height: "100%" };
  const variants: [BoxVariant, Record<string, unknown>][] = [
    ["standard", {}],
    ["flex", { flexDirection: "row" }],
    ["column-flex", { flexDirection: "column" }],
    ["centered-flex", { flexDirection: "row", ...centred }],
    ["centered-column-flex", { flexDirection: "column", ...centred }],
    ["full-page-flex", { flexDirection: "row", ...fullPage }],
    ["full-page-column-flex", { flexDirection: "column", ...fullPage }],
    ["full-size-flex", { flexDirection: "row", ...fullSize }],
    ["full-size-column", { flexDirection: "column", ...fullSize }],
    [
      "full-size-centered-flex",
      { flexDirection: "row", ...centred, ...fullSize },
    ],
    [
      "full-size-centered-column-flex",
      { flexDirection: "column", ...centred, ...fullSize },
    ],
  ];
  it.each(variants)("variant %s", async (variant, expected) => {
    const { getByTestId } = await draw(<Box testID="box" variant={variant} />);
    expect(style(getByTestId("box"))).toEqual(expected);
  });

  it("takes padding and margin as px, on every edge", async () => {
    const { getByTestId } = await draw(
      <Box testID="box" padding={12} margin={6} />,
    );
    expect(style(getByTestId("box"))).toEqual({ padding: 12, margin: 6 });
  });

  it("resolves background as a theme token or a raw colour", async () => {
    const { getByTestId } = await draw(
      <>
        <Box testID="token" background="surfaceContainer" />
        <Box testID="raw" background="#123456" />
      </>,
    );
    expect(style(getByTestId("token")).backgroundColor).toBe(
      theme.colors.surfaceContainer,
    );
    expect(style(getByTestId("raw")).backgroundColor).toBe("#123456");
  });

  it("keeps radius, border, gap, alignment and size", async () => {
    const { getByTestId } = await draw(
      <Box
        testID="box"
        radius="medium"
        borderWidth={1}
        borderColor="outline"
        gap={4}
        align="center"
        justify="space-between"
        width={120}
        height={40}
        wrap
      />,
    );
    expect(style(getByTestId("box"))).toEqual({
      borderRadius: theme.shape.medium,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      gap: 4,
      alignItems: "center",
      justifyContent: "space-between",
      width: 120,
      height: 40,
      flexWrap: "wrap",
    });
  });

  it("applies the props over the variant, and style over both", async () => {
    const { getByTestId } = await draw(
      <Box
        testID="box"
        variant="full-size-centered-flex"
        width={200}
        align="flex-start"
        style={{ flexDirection: "column", height: 50 }}
      />,
    );
    expect(style(getByTestId("box"))).toEqual({
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
      width: 200,
      height: 50,
    });
  });

  it("does not let an unset prop blank the variant", async () => {
    const { getByTestId } = await draw(
      <Box testID="box" variant="full-size-flex" width={undefined} />,
    );
    expect(style(getByTestId("box")).width).toBe("100%");
  });

  it("forwards View props", async () => {
    const { getByLabelText } = await draw(<Box accessibilityLabel="panel" />);
    expect(getByLabelText("panel")).toBeTruthy();
  });
});

describe("Stack", () => {
  it("stacks vertically with the small spacing by default", async () => {
    const { getByTestId } = await draw(
      <Stack testID="stack">
        <Text>A</Text>
      </Stack>,
    );
    expect(style(getByTestId("stack"))).toEqual({
      flexDirection: "column",
      gap: theme.spacing.s,
    });
  });

  it("locks the axis in HStack and VStack, and reverses", async () => {
    const { getByTestId } = await draw(
      <>
        <HStack testID="h" />
        <VStack testID="v" />
        <Stack testID="r" direction="horizontal" reverse />
        <Stack testID="c" reverse />
      </>,
    );
    expect(style(getByTestId("h")).flexDirection).toBe("row");
    expect(style(getByTestId("v")).flexDirection).toBe("column");
    expect(style(getByTestId("r")).flexDirection).toBe("row-reverse");
    expect(style(getByTestId("c")).flexDirection).toBe("column-reverse");
  });

  const spacings: [string, Parameters<typeof Stack>[0]["spacing"], unknown][] =
    [
      ["a token name", "xl", 32],
      ["a number of px", 5, 5],
      ["zero", 0, 0],
      ["a numeric string", "12", 12],
      ["a numeric string with px", "12px", 12],
      ["a string that is neither", "wide", undefined],
      ["a prototype name", "constructor", undefined],
    ];
  it.each(spacings)("spacing as %s", async (_name, spacing, gap) => {
    const { getByTestId } = await draw(
      <Stack testID="stack" spacing={spacing} />,
    );
    expect(style(getByTestId("stack")).gap).toBe(gap);
  });

  it("merges style last, and keeps the Box props", async () => {
    const { getByTestId } = await draw(
      <HStack
        testID="stack"
        padding={8}
        background="surface"
        align="center"
        wrap
        style={{ flexDirection: "column", padding: 1 }}
      />,
    );
    expect(style(getByTestId("stack"))).toMatchObject({
      flexDirection: "column",
      padding: 1,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      flexWrap: "wrap",
    });
  });

  describe("dividers", () => {
    const rules = (tree: unknown): Record<string, unknown>[] => {
      const found: Record<string, unknown>[] = [];
      const visit = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        const { props, children } = node as {
          props?: { style?: unknown };
          children?: unknown[];
        };
        const flat = props?.style
          ? (StyleSheet.flatten(props.style as never) as Record<
              string,
              unknown
            >)
          : undefined;
        if (flat?.backgroundColor === theme.colors.outlineVariant) {
          found.push(flat);
        }
        children?.forEach(visit);
      };
      visit(tree);
      return found;
    };

    it("draws none unless asked", async () => {
      const { toJSON } = await draw(
        <VStack>
          <Text>A</Text>
          <Text>B</Text>
        </VStack>,
      );
      expect(rules(toJSON())).toHaveLength(0);
    });

    it("puts a horizontal rule between the children of a VStack", async () => {
      const { toJSON, getAllByText } = await draw(
        <VStack dividers>
          <Text>A</Text>
          <Text>B</Text>
          <Text>C</Text>
        </VStack>,
      );
      const lines = rules(toJSON());
      expect(lines).toHaveLength(2);
      expect(lines[0]).toMatchObject({ height: 1 });
      expect(lines[0]).not.toHaveProperty("width");
      expect(getAllByText(/[ABC]/).map((t) => t.props.children)).toEqual([
        "A",
        "B",
        "C",
      ]);
    });

    it("puts a vertical rule between the children of an HStack", async () => {
      const { toJSON } = await draw(
        <HStack dividers>
          <Text>A</Text>
          <Text>B</Text>
        </HStack>,
      );
      const lines = rules(toJSON());
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({ width: 1, alignSelf: "stretch" });
    });

    it("skips empty children", async () => {
      const { toJSON } = await draw(
        <VStack dividers>
          {null}
          <Text>A</Text>
          {false}
          <Text>B</Text>
          {undefined}
        </VStack>,
      );
      expect(rules(toJSON())).toHaveLength(1);
    });

    it("draws none around a single child", async () => {
      const { toJSON } = await draw(
        <VStack dividers>
          <Text>A</Text>
          {false}
        </VStack>,
      );
      expect(rules(toJSON())).toHaveLength(0);
    });

    it("uses a node as the divider", async () => {
      const { getAllByText, toJSON } = await draw(
        <HStack dividers={<Text>|</Text>}>
          <Text>A</Text>
          <Text>B</Text>
          <Text>C</Text>
        </HStack>,
      );
      expect(getAllByText("|")).toHaveLength(2);
      expect(rules(toJSON())).toHaveLength(0);
      const order = getAllByText(/[ABC|]/).map((t) => t.props.children);
      expect(order).toEqual(["A", "|", "B", "|", "C"]);
    });
  });
});

describe("Center", () => {
  it("is exported again, as a thin wrapper on Box's centered variants", async () => {
    expect(Object.keys(library)).toContain("Center");
    const { getByTestId } = await draw(
      <>
        <Center testID="row" />
        <Center testID="column" direction="column" />
        <Box testID="box" variant="centered-flex" />
      </>,
    );
    expect(style(getByTestId("row"))).toEqual(style(getByTestId("box")));
    expect(style(getByTestId("row"))).toEqual({
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    });
    expect(style(getByTestId("column"))).toEqual({
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    });
  });

  it("is in the types too: the export list names it", () => {
    // A compile-time check: `type-check` fails while `Center` is not exported.
    const present: "Center" extends keyof typeof library ? true : false = true;
    expect(present).toBe(true);
  });
});
