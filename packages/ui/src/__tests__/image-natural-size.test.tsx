import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Image, ThemeProvider } from "..";

// With neither `height` nor `ratio` the frame had no height: nothing showed.
const frameOf = (view: Awaited<ReturnType<typeof render>>) =>
  StyleSheet.flatten(view.getByTestId("photo").props.style);

describe("Image without height or ratio", () => {
  it("holds a placeholder shape, then takes the picture's own", async () => {
    const onLoad = jest.fn();
    const view = await render(
      <ThemeProvider>
        <Image
          testID="photo"
          source={{ uri: "https://example.com/a.jpg" }}
          alt="Shop front"
          onLoad={onLoad}
        />
      </ThemeProvider>,
    );
    expect(frameOf(view).aspectRatio).toBe(4 / 3);
    await fireEvent(view.getByLabelText("Shop front"), "load", {
      nativeEvent: { source: { width: 800, height: 400 } },
    });
    expect(frameOf(view).aspectRatio).toBe(2);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it("leaves a given height or ratio alone", async () => {
    const view = await render(
      <ThemeProvider>
        <Image
          testID="photo"
          source={{ uri: "https://example.com/a.jpg" }}
          alt="Shop front"
          height={120}
        />
      </ThemeProvider>,
    );
    await fireEvent(view.getByLabelText("Shop front"), "load", {
      nativeEvent: { source: { width: 800, height: 400 } },
    });
    expect(frameOf(view)).toMatchObject({ height: 120 });
    expect(frameOf(view).aspectRatio).toBeUndefined();
  });
});
