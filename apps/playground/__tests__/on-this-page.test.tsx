import React, { useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";

import { OnThisPage, useScrollSpy } from "../site/OnThisPage";

const SECTIONS = [
  { id: "example", label: "Example" },
  { id: "variants", label: "Variants" },
  { id: "api", label: "API reference" },
];

describe("OnThisPage", () => {
  it("links to every section, marks the current one and reports a press", async () => {
    const onSelect = jest.fn();
    await render(
      <ThemeProvider>
        <OnThisPage sections={SECTIONS} active="variants" onSelect={onSelect} />
      </ThemeProvider>,
    );
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(
      screen.getByRole("link", { name: "Variants" }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByRole("link", { name: "Example" }).props.accessibilityState,
    ).toMatchObject({ selected: false });

    await fireEvent.press(screen.getByRole("link", { name: "API reference" }));
    expect(onSelect).toHaveBeenCalledWith("api");
  });
});

describe("useScrollSpy", () => {
  const Probe = () => {
    const scrollRef = useRef<ScrollView>(null);
    const spy = useScrollSpy(["example", "variants"], scrollRef);
    return (
      <ScrollView testID="scroller" ref={scrollRef} onScroll={spy.onScroll}>
        <View testID="column" onLayout={spy.track("column")}>
          <View testID="row" onLayout={spy.track("row")}>
            <View testID="example" onLayout={spy.track("example")} />
            <View testID="variants" onLayout={spy.track("variants")} />
          </View>
        </View>
        <Text testID="state">{`${spy.active} ${spy.scrolled}`}</Text>
      </ScrollView>
    );
  };

  const layout = (y: number) => ({ nativeEvent: { layout: { y } } });
  const scroll = (y: number) => ({
    nativeEvent: {
      contentOffset: { x: 0, y },
      layoutMeasurement: { width: 800, height: 600 },
      contentSize: { width: 800, height: 3000 },
    },
  });
  const state = () => screen.getByTestId("state").props.children;

  it("follows the scroll: the current section and the back-to-top threshold", async () => {
    await render(<Probe />);
    expect(state()).toBe("example false");

    // A section's top is its own offset plus the column's and the row's.
    await fireEvent(screen.getByTestId("column"), "layout", layout(24));
    await fireEvent(screen.getByTestId("row"), "layout", layout(100));
    await fireEvent(screen.getByTestId("example"), "layout", layout(0));
    await fireEvent(screen.getByTestId("variants"), "layout", layout(800));

    await fireEvent(screen.getByTestId("scroller"), "scroll", scroll(500));
    expect(state()).toBe("example true");
    await fireEvent(screen.getByTestId("scroller"), "scroll", scroll(900));
    expect(state()).toBe("variants true");
    await fireEvent(screen.getByTestId("scroller"), "scroll", scroll(0));
    expect(state()).toBe("example false");
  });
});
