import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { Showcase } from "../site/Showcase";

// The landing page's sampler: live components, so it has to keep mounting and
// answering. (The page around it needs the router.)
describe("overview sampler", () => {
  const draw = () =>
    render(
      <ThemeProvider>
        <Showcase />
      </ThemeProvider>,
    );

  it("shows the task, the chips and the steps", async () => {
    const { getByText } = await draw();
    expect(
      getByText("Ship one screen to iOS, Android and the web"),
    ).toBeTruthy();
    expect(getByText("60%")).toBeTruthy();
    expect(getByText("Material 3")).toBeTruthy();
    expect(getByText("Start in three steps")).toBeTruthy();
  });

  it("plays and pauses", async () => {
    const { getByRole, queryByRole } = await draw();
    await fireEvent.press(getByRole("button", { name: "Play" }));
    expect(getByRole("button", { name: "Pause" })).toBeTruthy();
    expect(queryByRole("button", { name: "Play" })).toBeNull();
  });

  it("moves the stepper to the step that was pressed", async () => {
    const { getByLabelText } = await draw();
    await fireEvent.press(getByLabelText("Step 3: Compose"));
    expect(
      getByLabelText("Step 3: Compose").props.accessibilityState,
    ).toMatchObject({ selected: true });
  });
});
