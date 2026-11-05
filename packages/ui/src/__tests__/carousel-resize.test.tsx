import React from "react";
import { ScrollView, Text } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { Carousel, ThemeProvider } from "..";

type Node = { props: Record<string, any> };

// On a rotation or a window resize the pages change width but the scroll
// offset does not: the carousel was left between two pages.
it("snaps back onto its page when its width changes", async () => {
  const scrollTo = ScrollView.prototype.scrollTo as unknown as jest.Mock;
  const view = await render(
    <ThemeProvider>
      <Carousel>
        <Text>One</Text>
        <Text>Two</Text>
        <Text>Three</Text>
      </Carousel>
    </ThemeProvider>,
  );
  const frame = view.container.queryAll((n: Node) => !!n.props.onLayout)[0];
  const scroller = view.container.queryAll(
    (n: Node) => n.props.pagingEnabled && !!n.props.onScroll,
  )[0];
  const layout = (width: number) =>
    act(() =>
      frame.props.onLayout({ nativeEvent: { layout: { width, height: 200 } } }),
    );

  await layout(300);
  await fireEvent.scroll(scroller, {
    nativeEvent: { contentOffset: { x: 300, y: 0 } },
  });
  scrollTo.mockClear();
  await layout(500);
  expect(scrollTo).toHaveBeenLastCalledWith({ x: 500, animated: false });
});
