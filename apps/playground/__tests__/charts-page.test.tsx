import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import ChartsPage from "../app/charts";

const open = async () => {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1280, height: 900 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <ChartsPage />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  await fireEvent(screen.getByTestId("demo-bars"), "layout", {
    nativeEvent: { layout: { width: 600, height: 240, x: 0, y: 0 } },
  });
};

const bars = () => screen.queryAllByTestId(/^demo-bars-bar-/);

describe("the charts page", () => {
  it("draws the bars, reports a tapped month and switches state", async () => {
    await open();
    // 12 months x 2 series
    expect(bars()).toHaveLength(24);
    expect(screen.getByText("Tap or hover a month.")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("demo-bars-category-2"));
    expect(screen.getByText("Selected: Mar")).toBeTruthy();

    await fireEvent.press(screen.getByText("empty"));
    expect(bars()).toHaveLength(0);
    expect(screen.getByText("No data")).toBeTruthy();

    await fireEvent.press(screen.getByText("loading"));
    expect(screen.getByTestId("demo-bars").props.accessibilityLabel).toBe(
      "Loading",
    );
  });

  it("switches to lines and to areas", async () => {
    await open();
    await fireEvent.press(screen.getByText("lines"));
    // the chart is a new one: it measures itself again
    await fireEvent(screen.getByTestId("demo-bars"), "layout", {
      nativeEvent: { layout: { width: 600, height: 240, x: 0, y: 0 } },
    });
    expect(bars()).toHaveLength(0);
    expect(screen.getByTestId("demo-bars-line-answered")).toBeTruthy();
    expect(screen.queryByTestId("demo-bars-area-answered")).toBeNull();

    await fireEvent.press(screen.getByText("area"));
    await fireEvent(screen.getByTestId("demo-bars"), "layout", {
      nativeEvent: { layout: { width: 600, height: 240, x: 0, y: 0 } },
    });
    expect(screen.getByTestId("demo-bars-area-answered")).toBeTruthy();
  });

  it("draws the donut, the gauge, the stacked bar and the sparklines", async () => {
    await open();
    const measure = (id: string, height: number) =>
      fireEvent(screen.getByTestId(id), "layout", {
        nativeEvent: { layout: { width: 300, height, x: 0, y: 0 } },
      });
    await measure("demo-donut", 220);
    await measure("demo-gauge", 220);
    await measure("demo-stack", 32);
    await measure("demo-spark-Answered", 32);

    expect(screen.getAllByTestId(/^demo-donut-slice-/)).toHaveLength(4);
    expect(screen.getAllByTestId(/^demo-stack-segment-/)).toHaveLength(4);
    expect(screen.getByTestId("demo-spark-Answered-line")).toBeTruthy();
    expect(screen.getByTestId("demo-gauge-track")).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).toContain(`"content":"72%"`);

    await fireEvent.press(screen.getByText("More"));
    expect(JSON.stringify(screen.toJSON())).toContain(`"content":"90%"`);
  });

  it("draws thousands of points densely", async () => {
    await open();
    await fireEvent(screen.getByTestId("demo-many"), "layout", {
      nativeEvent: { layout: { width: 600, height: 240, x: 0, y: 0 } },
    });
    // 2000 points x 2 series: a path per series, no node per bar
    expect(screen.getByTestId("demo-many-dense-value")).toBeTruthy();
    expect(screen.queryAllByTestId(/^demo-many-bar-/)).toHaveLength(0);
  });
});
