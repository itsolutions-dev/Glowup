import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { ListItem, ListSection, ThemeProvider, palettes } from "..";

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

type Node = { props: Record<string, any> };
type Tree = { queryAll: (p: (n: Node) => boolean) => Node[] };

const style = (node: Node) =>
  StyleSheet.flatten(node.props.style) as Record<string, any>;

const colours = palettes.baseline.light;
const dark = palettes.baseline.dark;

/** The row's container: the node that carries the variant's border. */
const container = (tree: Tree) =>
  tree.queryAll(
    (n) => style(n)?.borderRadius === 12 && "borderWidth" in style(n),
  )[0];

describe("ListItem variant", () => {
  const draw = async (variant?: "standard" | "outlined" | "contained") => {
    const view = await wrap(<ListItem primaryText="Row" variant={variant} />);
    return style(container(view.container as unknown as Tree));
  };

  it("contained is the default: the secondary container fill, no visible border", async () => {
    const fill = await draw();
    expect([colours.secondaryContainer, dark.secondaryContainer]).toContain(
      fill.backgroundColor,
    );
    expect(fill.borderColor).toBe("transparent");
    expect(await draw("contained")).toEqual(fill);
  });

  it("standard is transparent with no border", async () => {
    expect(await draw("standard")).toMatchObject({
      backgroundColor: "transparent",
      borderColor: "transparent",
    });
  });

  it("outlined has an outline border and no fill", async () => {
    const outlined = await draw("outlined");
    expect(outlined.backgroundColor).toBe("transparent");
    expect([colours.outlineVariant, dark.outlineVariant]).toContain(
      outlined.borderColor,
    );
  });

  it("keeps one border width across the variants", async () => {
    // One at a time: concurrent renders share one act scope.
    const widths: unknown[] = [];
    for (const variant of ["standard", "outlined", "contained"] as const)
      widths.push((await draw(variant)).borderWidth);
    expect(new Set(widths).size).toBe(1);
    expect(widths[0]).toBeGreaterThan(0);
  });

  it.each(["standard", "outlined", "contained"] as const)(
    "%s keeps the border width on hover and press",
    async (variant) => {
      const view = await wrap(
        <ListItem primaryText="Row" variant={variant} onClick={() => {}} />,
      );
      const tree = view.container as unknown as Tree;
      const rest = style(container(tree)).borderWidth;
      const restFill = style(container(tree)).backgroundColor;
      const button = view.getByRole("button");
      for (const event of ["hoverIn", "pressIn"]) {
        await fireEvent(button, event);
        expect(style(container(tree)).borderWidth).toBe(rest);
        // The state is drawn: the fill moves, the box does not.
        expect(style(container(tree)).backgroundColor).not.toBe(restFill);
        await fireEvent(button, event.replace("In", "Out"));
      }
    },
  );
});

describe("ListSection gap and showDividers", () => {
  const rule = (tree: Tree) =>
    tree.queryAll(
      (n) =>
        style(n)?.height === 1 &&
        [colours.outlineVariant, dark.outlineVariant].includes(
          style(n)?.backgroundColor,
        ),
    );
  const margins = (tree: Tree) =>
    tree
      .queryAll((n) => typeof style(n)?.marginVertical === "number")
      .map((n) => style(n).marginVertical);

  const items = (n: number) =>
    Array.from({ length: n }, (_, i) => (
      <ListItem key={i} primaryText={`Item ${i}`} />
    ));

  it("draws n - 1 rules between n items", async () => {
    const { container: tree, getByText } = await wrap(
      <ListSection showDividers>{items(4)}</ListSection>,
    );
    expect(getByText("Item 3")).toBeTruthy();
    expect(rule(tree as unknown as Tree)).toHaveLength(3);
  });

  it("draws none for one item or without the prop, and ignores what draws nothing", async () => {
    const one = await wrap(<ListSection showDividers>{items(1)}</ListSection>);
    expect(rule(one.container as unknown as Tree)).toHaveLength(0);
    const off = await wrap(<ListSection>{items(3)}</ListSection>);
    expect(rule(off.container as unknown as Tree)).toHaveLength(0);
    const holes = await wrap(
      <ListSection showDividers>
        {items(2)}
        {false}
        {null}
      </ListSection>,
    );
    expect(rule(holes.container as unknown as Tree)).toHaveLength(1);
  });

  it("is not the closing divider: that one is still one rule below the section", async () => {
    const { container: tree } = await wrap(
      <ListSection divider showDividers>
        {items(3)}
      </ListSection>,
    );
    expect(rule(tree as unknown as Tree)).toHaveLength(3);
    const closing = await wrap(<ListSection divider>{items(3)}</ListSection>);
    expect(rule(closing.container as unknown as Tree)).toHaveLength(1);
  });

  it("puts a token's or a number's space between items, not at the ends", async () => {
    const token = await wrap(<ListSection gap="l">{items(3)}</ListSection>);
    // Half above and half below each of the two joints: 24 in all.
    expect(margins(token.container as unknown as Tree)).toEqual([12, 12]);
    const px = await wrap(<ListSection gap={10}>{items(2)}</ListSection>);
    expect(margins(px.container as unknown as Tree)).toEqual([5]);
    const none = await wrap(<ListSection>{items(3)}</ListSection>);
    expect(margins(none.container as unknown as Tree)).toEqual([]);
  });

  it("keeps the rule in the middle of the gap", async () => {
    const { container: tree } = await wrap(
      <ListSection gap="m" showDividers>
        {items(2)}
      </ListSection>,
    );
    expect(margins(tree as unknown as Tree)).toEqual([8]);
    expect(rule(tree as unknown as Tree)).toHaveLength(1);
  });
});
