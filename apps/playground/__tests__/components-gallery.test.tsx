import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import ComponentsIndex from "../app/components/index";
import { CATEGORY_OF, TOTAL_COUNT } from "../catalogue/categories";
import { descriptionOf } from "../catalogue/descriptions";

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
});
