import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { Collapse, ThemeProvider } from "..";

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
