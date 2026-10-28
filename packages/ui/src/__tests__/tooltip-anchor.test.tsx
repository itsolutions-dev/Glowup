import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { render } from "@testing-library/react-native";
import { ThemeProvider, Tooltip } from "..";

// The Tooltip's wrapper is the box its parent lays out around the anchor. It hugs
// the anchor and must still follow the parent: centred in a centred column (a
// named Avatar on a testimonial), and no wider than the parent (a CaptionValue
// value cut at its width).
const boxesOf = async (parentStyle: object) => {
  const { toJSON } = await render(
    <ThemeProvider>
      <View style={parentStyle}>
        <Tooltip content="Ada Lovelace">
          <Text>AL</Text>
        </Tooltip>
      </View>
    </ThemeProvider>,
  );
  type Node = { props: { style?: unknown }; children: Node[] };
  const parent = toJSON() as unknown as Node;
  const flat = (node: Node) =>
    (StyleSheet.flatten(node.props.style as never) ?? {}) as Record<
      string,
      unknown
    >;
  const wrapper = parent.children[0];
  return { wrapper: flat(wrapper), anchor: flat(wrapper.children[0]) };
};
const wrapperOf = async (parentStyle: object) =>
  (await boxesOf(parentStyle)).wrapper;

describe("Tooltip anchor", () => {
  it("follows the parent's alignment instead of pinning itself to the start", async () => {
    const wrapper = await wrapperOf({ alignItems: "center" });
    expect(wrapper.alignSelf).toBeUndefined();
  });

  it("keeps the anchor at its own size in a stretching parent", async () => {
    const wrapper = await wrapperOf({});
    expect(wrapper.alignItems).toBe("flex-start");
  });

  // A text cut to one line is as wide as its whole line at min-content: the
  // anchor around it has to be capped too, or it grows to that and the text
  // never cuts.
  it("never grows past its parent, so a cut text stays cut", async () => {
    const { wrapper, anchor } = await boxesOf({ width: 200 });
    expect(wrapper.maxWidth).toBe("100%");
    expect(anchor.maxWidth).toBe("100%");
  });
});
