import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { ChartTooltip } from "../ChartTooltip";

const place = async (x: number, y: number) => {
  await render(
    <ThemeProvider>
      <ChartTooltip
        x={x}
        y={y}
        containerWidth={300}
        title="Jan"
        testID="tip"
        rows={[{ color: "red", name: "A", value: "1" }]}
      />
    </ThemeProvider>,
  );
  const card = screen.getByTestId("tip");
  await fireEvent(card, "layout", {
    nativeEvent: { layout: { width: 120, height: 50, x: 0, y: 0 } },
  });
  const style = StyleSheet.flatten(screen.getByTestId("tip").props.style);
  const [tx, ty] = style.transform as {
    translateX?: number;
    translateY?: number;
  }[];
  return { left: tx.translateX, top: ty.translateY, opacity: style.opacity };
};

describe("ChartTooltip", () => {
  it("is hidden and at the corner until it is measured", async () => {
    await render(
      <ThemeProvider>
        <ChartTooltip
          x={150}
          y={100}
          containerWidth={300}
          title="Jan"
          testID="tip"
          rows={[]}
        />
      </ThemeProvider>,
    );
    const style = StyleSheet.flatten(screen.getByTestId("tip").props.style);
    expect(style.opacity).toBe(0);
    expect(style.left).toBe(0);
    expect(style.top).toBe(0);
  });

  it("centres on the point, above it", async () => {
    expect(await place(150, 100)).toEqual({ left: 90, top: 42, opacity: 1 });
  });

  it("stays inside the chart on both edges, moved by a transform and not by left", async () => {
    expect((await place(295, 100)).left).toBe(180);
  });

  it("does not go above the top", async () => {
    expect((await place(20, 10)).top).toBe(0);
  });
});
