import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Form, Stepper, ThemeProvider, useTheme } from "..";
import type { StepperProps } from "..";

// The CRM's PagesStepper: MUI's MobileStepper, dots or a bar between Back and Next.
let primary = "";
const Probe = () => {
  const current = useTheme().theme.colors.primary;
  useEffect(() => {
    primary = current;
  }, [current]);
  return null;
};

const draw = (props: Partial<StepperProps> = {}) =>
  render(
    <ThemeProvider>
      <Probe />
      <Stepper variant="dots" steps={4} activeStep={1} {...props} />
    </ThemeProvider>,
  );

const bg = (node: { props: { style?: unknown } }) =>
  (
    StyleSheet.flatten(node.props.style as never) as {
      backgroundColor?: string;
    }
  ).backgroundColor;

describe("Stepper variant=dots / progress", () => {
  it("draws one dot per step, the active one in primary", async () => {
    const view = await draw();
    const indicator = view.getByLabelText("Step 2 of 4");
    expect(indicator.props.accessibilityValue).toEqual({
      min: 1,
      max: 4,
      now: 2,
    });
    const dots = view.getAllByTestId("stepper-dot", {
      includeHiddenElements: true,
    });
    expect(dots).toHaveLength(4);
    const colours = dots.map(bg);
    expect(colours[1]).toBe(primary);
    expect(colours.filter((c) => c === primary)).toHaveLength(1);
  });

  it("draws no buttons without handlers", async () => {
    const view = await draw();
    expect(view.queryByRole("button")).toBeNull();
  });

  it("draws the arrows on Back and Next", async () => {
    const view = await draw({ onBack: () => {}, onNext: () => {} });
    // A glyph is a character of the icon font: one per button.
    const glyphs = JSON.stringify(view.toJSON()).match(/material-community/g);
    expect(glyphs).toHaveLength(2);
  });

  it("draws each button only with its own handler", async () => {
    const onlyNext = await draw({ onNext: () => {} });
    expect(onlyNext.queryByRole("button", { name: "Back" })).toBeNull();
    expect(onlyNext.getByRole("button", { name: "Next" })).toBeTruthy();
    const onlyBack = await draw({ onBack: () => {} });
    expect(onlyBack.queryByRole("button", { name: "Next" })).toBeNull();
    expect(onlyBack.getByRole("button", { name: "Back" })).toBeTruthy();
  });

  it("moves with Back and Next", async () => {
    const onBack = jest.fn();
    const onNext = jest.fn();
    const view = await draw({ onBack, onNext });
    await fireEvent.press(view.getByRole("button", { name: "Next" }));
    expect(onNext).toHaveBeenCalledTimes(1);
    await fireEvent.press(view.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("disables Back and Next at the ends", async () => {
    const onBack = jest.fn();
    const onNext = jest.fn();
    const first = await draw({ activeStep: 0, onBack, onNext });
    expect(
      first.getByRole("button", { name: "Back" }).props.accessibilityState,
    ).toMatchObject({ disabled: true });

    const last = await draw({ activeStep: 3, onBack, onNext });
    expect(
      last.getByRole("button", { name: "Next" }).props.accessibilityState,
    ).toMatchObject({ disabled: true });

    const onCancel = jest.fn();
    const cancel = await draw({ activeStep: 0, onBack, onNext, onCancel });
    await fireEvent.press(cancel.getByRole("button", { name: "Back" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
  });

  it("submits on the last step", async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <ThemeProvider>
        <Form onSubmit={onSubmit}>
          <Stepper
            variant="dots"
            steps={3}
            activeStep={2}
            onBack={() => {}}
            onNext={() => {}}
            submitStep
            nextLabel="Save"
          />
        </Form>
      </ThemeProvider>,
    );
    await fireEvent.press(view.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("shows the progress bar", async () => {
    const view = await draw({ variant: "progress", steps: 5, activeStep: 2 });
    expect(view.getByLabelText("Step 3 of 5").props.accessibilityValue).toEqual(
      { min: 1, max: 5, now: 3 },
    );
    // The bar is drawn but not announced a second time ("Progress: 50%").
    expect(view.getAllByRole("progressbar")).toHaveLength(1);
  });

  it("takes a count for the labelled stepper too", async () => {
    const view = await render(
      <ThemeProvider>
        <Stepper steps={3} activeStep={0} />
      </ThemeProvider>,
    );
    expect(view.getAllByRole("button")).toHaveLength(3);
    expect(view.getByLabelText("Step 1")).toBeTruthy();
  });
});
