import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ThemeProvider, ToggleButtonGroup } from "..";

// The CRM's TriStateFilter: all / yes / no as icon-only buttons with a tooltip.
const TRI = [
  { value: null, icon: "account-multiple" as const, tooltip: "All" },
  { value: true, icon: "check" as const, tooltip: "Active" },
  { value: false, icon: "close" as const, tooltip: "Inactive" },
];

describe("ToggleButtonGroup with typed values", () => {
  it("keeps null, false and true apart", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    const onValueChange = jest.fn();
    const view = await render(
      <ThemeProvider>
        <ToggleButtonGroup
          options={TRI}
          value={false}
          onValueChange={onValueChange}
        />
      </ThemeProvider>,
    );
    const selected = view
      .getAllByRole("radio")
      .filter((r) => r.props.accessibilityState?.checked);
    expect(selected).toHaveLength(1);
    expect(selected[0].props.accessibilityLabel).toBe("Inactive");

    await fireEvent.press(view.getByLabelText("All"));
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("toggles typed values", async () => {
    const onValueChange = jest.fn();
    const view = await render(
      <ThemeProvider>
        <ToggleButtonGroup
          multiSelect
          options={[1, 2, 3].map((n) => ({ value: n, label: `N${n}` }))}
          value={[1]}
          onValueChange={onValueChange}
        />
      </ThemeProvider>,
    );
    await fireEvent.press(view.getByLabelText("N2"));
    expect(onValueChange).toHaveBeenLastCalledWith([1, 2]);
    await fireEvent.press(view.getByLabelText("N1"));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it("names an icon-only segment by its tooltip", async () => {
    const view = await render(
      <ThemeProvider>
        <ToggleButtonGroup
          options={[
            { value: "a", icon: "close", tooltip: "Inactive" },
            { value: "b", icon: "check", label: "Yes", tooltip: "Active" },
          ]}
          value="a"
          onValueChange={() => {}}
        />
      </ThemeProvider>,
    );
    const labels = view
      .getAllByRole("radio")
      .map((r) => r.props.accessibilityLabel);
    // The label still wins over the tooltip.
    expect(labels).toEqual(["Inactive", "Yes"]);
  });
});
