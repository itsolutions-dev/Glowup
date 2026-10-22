import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { ThemeProvider } from "@its/glowup-ui";
import Home from "../app/index";
import { Showcase } from "../site/Showcase";

// The page around the sampler. `expo-router` is mocked: no navigator is mounted
// in a test, so the router is a spy and `Link` renders what it wraps.
jest.mock("expo-router", () => {
  const { Fragment } = jest.requireActual("react");
  return {
    router: { push: jest.fn() },
    Link: ({ children }: { children: React.ReactNode }) => (
      <Fragment>{children}</Fragment>
    ),
  };
});

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

describe("overview buttons", () => {
  it.each([
    ["Browse components", "/components"],
    ["Get started", "/getting-started"],
  ])("%s navigates to %s", async (label, href) => {
    const { getByRole } = await render(
      <ThemeProvider>
        <Home />
      </ThemeProvider>,
    );
    await fireEvent.press(getByRole("button", { name: label }));
    expect(router.push).toHaveBeenCalledWith(href);
  });
});
