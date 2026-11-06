import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import ComponentsIndex from "../app/components/index";
import { CATEGORY_OF, FLAT_ORDER, TOTAL_COUNT } from "../catalogue/categories";
import { descriptionOf } from "../catalogue/descriptions";
import { exampleFor } from "../catalogue/examples";

// The view and the category filter are remembered through AsyncStorage.
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

// No navigator is mounted in a test: `Link` renders what it wraps.
jest.mock("expo-router", () => {
  const { Fragment } = jest.requireActual("react");
  return {
    router: { push: jest.fn() },
    Link: ({ children }: { children: React.ReactNode }) => (
      <Fragment>{children}</Fragment>
    ),
  };
});

describe("the components gallery", () => {
  const draw = () =>
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 1280, height: 900 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ThemeProvider>
          <ComponentsIndex />
        </ThemeProvider>
      </SafeAreaProvider>,
    );

  it("says what the page is for, with the count from the catalogue", async () => {
    await draw();
    expect(
      screen.getByText(new RegExp(`^${TOTAL_COUNT} components, each with one`)),
    ).toBeTruthy();
  });

  it("scrolls in the library's ScrollArea, so the scrollbar is the themed one", async () => {
    await draw();
    // ScrollArea names its scroll view `${testID}-viewport`.
    expect(screen.getByTestId("page-scroller-viewport")).toBeTruthy();
  });

  it("clamps a card's description to two lines, in the gallery and in the list", async () => {
    await draw();
    const description = descriptionOf("Switch", CATEGORY_OF.Switch);
    expect(screen.getAllByText(description)[0].props.numberOfLines).toBe(2);

    await fireEvent.press(screen.getByRole("radio", { name: "List" }));
    expect(screen.getAllByText(description)[0].props.numberOfLines).toBe(2);
  });

  // A phone drew all ~100 live previews at once: the page took 5.6 s to appear and
  // 8–11 s to settle on a ZTE Blade A51 (6/11). On native a card mounts its preview
  // once the reader has scrolled to within a couple of screens of it.
  it("on native, mounts a card's preview only once the reader scrolls near it", async () => {
    const withExample = FLAT_ORDER.filter((name) => exampleFor(name));
    const first = withExample[0];
    const last = withExample[withExample.length - 1];
    await draw();

    // Nothing is known about the screen yet: no preview.
    expect(screen.queryByTestId(`preview-${first}`)).toBeNull();

    const scroller = screen.getByTestId("page-scroller-viewport");
    await fireEvent(scroller, "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 800 } },
    });
    for (const group of screen.getAllByTestId(/^gallery-group-/)) {
      // Each group far below the previous one, as on a one-column phone.
      const index = screen.getAllByTestId(/^gallery-group-/).indexOf(group);
      await fireEvent(group, "layout", {
        nativeEvent: {
          layout: { x: 0, y: 400 + index * 5000, width: 390, height: 4800 },
        },
      });
    }

    expect(screen.getByTestId(`preview-${first}`)).toBeTruthy();
    expect(screen.queryByTestId(`preview-${last}`)).toBeNull();

    await fireEvent.scroll(scroller, {
      nativeEvent: {
        contentOffset: { x: 0, y: 1_000_000 },
        contentSize: { width: 390, height: 1_000_800 },
        layoutMeasurement: { width: 390, height: 800 },
      },
    });
    expect(screen.getByTestId(`preview-${last}`)).toBeTruthy();
    // Kept once mounted: scrolling back does not unmount what was seen.
    await fireEvent.scroll(scroller, {
      nativeEvent: {
        contentOffset: { x: 0, y: 0 },
        contentSize: { width: 390, height: 1_000_800 },
        layoutMeasurement: { width: 390, height: 800 },
      },
    });
    expect(screen.getByTestId(`preview-${last}`)).toBeTruthy();
  });
});
