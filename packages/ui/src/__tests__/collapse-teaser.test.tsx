import React from "react";
import { Animated, Text } from "react-native";
import { render } from "@testing-library/react-native";
import { Collapse, ThemeProvider } from "..";

let mockReduceMotion = false;
jest.mock("../components/internal/useReduceMotion", () => ({
  useReduceMotion: () => mockReduceMotion,
}));

const draw = (collapsedHeight: number) =>
  render(
    <ThemeProvider>
      <Collapse open={false} collapsedHeight={collapsedHeight}>
        <Text>First lines of the note</Text>
      </Collapse>
    </ThemeProvider>,
  );

describe("a closed Collapse and assistive tech", () => {
  it("hides content nobody can see", async () => {
    const view = await draw(0);
    expect(view.queryByText("First lines of the note")).toBeNull();
  });

  it("does not hide the teaser that stays on screen", async () => {
    const view = await draw(40);
    expect(view.getByText("First lines of the note")).toBeTruthy();
  });
});

describe("a Collapse under reduced motion", () => {
  afterEach(() => {
    mockReduceMotion = false;
    jest.restoreAllMocks();
  });

  it("opens in place, as the Accordion's chevron already did", async () => {
    mockReduceMotion = true;
    const timing = jest.spyOn(Animated, "timing");
    const ui = (open: boolean) => (
      <ThemeProvider>
        <Collapse open={open} duration={300}>
          <Text>Body</Text>
        </Collapse>
      </ThemeProvider>
    );
    const view = await render(ui(false));
    await view.rerender(ui(true));
    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ duration: 0 }),
    );
  });
});
