import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Stepper, ThemeProvider } from "..";
import type { StepperProps } from "..";

const draw = (props: Partial<StepperProps> = {}) =>
  render(
    <ThemeProvider>
      <Stepper
        steps={["Cart", "Shipping", "Payment"]}
        activeStep={1}
        {...props}
      />
    </ThemeProvider>,
  );

const style = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

describe.each(["row", "column"] as const)(
  "Stepper direction=%s",
  (direction) => {
    it("names each step and marks the current one", async () => {
      const { getByLabelText, getAllByRole } = await draw({ direction });
      expect(getAllByRole("button")).toHaveLength(3);
      expect(
        getByLabelText("Step 2: Shipping").props.accessibilityState,
      ).toMatchObject({ selected: true });
      expect(
        getByLabelText("Step 3: Payment").props.accessibilityState,
      ).toMatchObject({ selected: false });
    });

    it("shows the labels, a number for the steps ahead and a check for the done ones", async () => {
      const { getByText, queryByText } = await draw({ direction });
      expect(getByText("Cart")).toBeTruthy();
      expect(getByText("Shipping")).toBeTruthy();
      expect(getByText("Payment")).toBeTruthy();
      // step 1 is done: its circle holds a check, not the number
      expect(queryByText("1")).toBeNull();
      expect(getByText("2")).toBeTruthy();
      expect(getByText("3")).toBeTruthy();
    });

    it("reports the pressed step through onClick", async () => {
      const onClick = jest.fn();
      const { getByLabelText } = await draw({ direction, onClick });
      await fireEvent.press(getByLabelText("Step 3: Payment"));
      expect(onClick).toHaveBeenCalledWith(2);
      await fireEvent.press(getByLabelText("Step 1: Cart"));
      expect(onClick).toHaveBeenLastCalledWith(0);
    });

    it("is not pressable without onClick", async () => {
      const { getByLabelText } = await draw({ direction });
      expect(
        getByLabelText("Step 2: Shipping").props.accessibilityState,
      ).toMatchObject({ disabled: true });
    });

    it("takes steps with icons", async () => {
      const { getByLabelText } = await draw({
        direction,
        steps: [
          { label: "Cart", icon: "cart-outline" },
          { label: "Pay", icon: "credit-card-outline" },
        ],
        activeStep: 0,
      });
      expect(getByLabelText("Step 2: Pay")).toBeTruthy();
    });
  },
);

describe("Stepper layout", () => {
  it("row is the default: the steps sit side by side", async () => {
    const { toJSON } = await draw();
    const tree = toJSON() as unknown as {
      props: { style?: unknown };
    };
    expect(style(tree).flexDirection).toBe("row");
    expect(style(tree).justifyContent).toBe("space-between");
  });

  it("column stacks them: the container is not a row, and each step is", async () => {
    const { toJSON, getByText } = await draw({ direction: "column" });
    const tree = toJSON() as unknown as {
      props: { style?: unknown };
      children: { props: { style?: unknown } }[];
    };
    expect(style(tree).flexDirection).toBeUndefined();
    // each step is a row of circle rail and label
    expect(style(tree.children[0]).flexDirection).toBe("row");
    expect(tree.children).toHaveLength(3);
    // the label is not squeezed to the row layout's 80
    expect(style(getByText("Shipping")).maxWidth).toBeUndefined();
  });

  // A step row is as tall as its circle and the line down to the next step; a
  // label centred in all of that sat below its circle.
  it("column keeps each label beside its circle", async () => {
    const { toJSON } = await draw({ direction: "column" });
    const tree = toJSON() as unknown as {
      children: { children: { props: { style?: unknown } }[] }[];
    };
    for (const step of tree.children) {
      expect(style(step.children[1]).alignSelf).toBe("flex-start");
    }
  });

  it("column wraps a long label instead of cutting it", async () => {
    const { getByText } = await draw({
      direction: "column",
      steps: ["A step with a rather long description", "Done"],
    });
    expect(
      getByText("A step with a rather long description").props,
    ).not.toHaveProperty("numberOfLines", 1);
  });

  it("row keeps cutting a label to one line", async () => {
    const { getByText } = await draw({ steps: ["Cart", "Shipping"] });
    expect(getByText("Shipping").props.numberOfLines).toBe(1);
  });
});
