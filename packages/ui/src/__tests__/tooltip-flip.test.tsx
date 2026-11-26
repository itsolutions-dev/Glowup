import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { PortalHost, ThemeProvider, Tooltip } from "..";

const layout = (width: number, height: number) => ({
  nativeEvent: { layout: { x: 0, y: 0, width, height } },
});

// A tip opened from an anchor `y` dp from the top of the window.
const openAt = async (y: number, position?: "top" | "bottom") => {
  jest
    .spyOn(View.prototype as any, "measureInWindow")
    .mockImplementation((cb: any) => cb(100, y, 40, 40));
  const view = await render(
    <ThemeProvider>
      <PortalHost>
        <Tooltip
          content="Export to Excel"
          position={position}
          hideDelay={10_000}
        >
          <Text>XLS</Text>
        </Tooltip>
      </PortalHost>
    </ThemeProvider>,
  );
  const anchor = view.getByLabelText("Export to Excel");
  await fireEvent(anchor, "layout", layout(40, 40));
  await act(async () => {
    fireEvent(anchor, "longPress");
  });
  const tip = () =>
    (view.container as any).queryAll(
      (n: { props: Record<string, unknown> }) => n.props.role === "tooltip",
    )[0];
  await fireEvent(tip(), "layout", layout(120, 24));
  return StyleSheet.flatten(tip().props.style);
};

describe("Tooltip in a portal", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("sits above its anchor when there is room", async () => {
    expect((await openAt(300)).top).toBe(300 - 24 - 8);
  });

  it("goes below an anchor at the top of the window instead of off its edge", async () => {
    expect((await openAt(4)).top).toBe(4 + 40 + 8);
  });

  it("goes above an anchor at the bottom of the window when asked for below", async () => {
    const { height } = require("react-native").Dimensions.get("window");
    expect((await openAt(height - 44, "bottom")).top).toBe(
      height - 44 - 24 - 8,
    );
  });
});
