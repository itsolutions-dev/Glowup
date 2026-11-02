import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  Breadcrumbs,
  Checkbox,
  Pagination,
  RadioButton,
  Select,
  Slider,
  Switch,
  Tabs,
  ThemeProvider,
} from "..";

// The web as a browser sees it: react-native-web turns the components into DOM
// elements, and a screen reader reads their role and aria-* attributes. Under
// the native presets react-native folds aria-checked and the like back into
// accessibilityState, so these were checked by hand in Chrome until now.
const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);
const aria = (el: HTMLElement, name: string) => el.getAttribute(`aria-${name}`);

describe("checked state", () => {
  it("a Checkbox says checked, unchecked or mixed", () => {
    const { rerender } = draw(
      <Checkbox label="Terms" checked={false} onValueChange={() => {}} />,
    );
    expect(aria(screen.getByRole("checkbox"), "checked")).toBe("false");
    rerender(
      <ThemeProvider>
        <Checkbox label="Terms" checked onValueChange={() => {}} />
      </ThemeProvider>,
    );
    expect(aria(screen.getByRole("checkbox"), "checked")).toBe("true");
    rerender(
      <ThemeProvider>
        <Checkbox
          label="Terms"
          checked={false}
          indeterminate
          onValueChange={() => {}}
        />
      </ThemeProvider>,
    );
    expect(aria(screen.getByRole("checkbox"), "checked")).toBe("mixed");
  });

  it("a Switch is a switch, and says whether it is on", () => {
    draw(<Switch label="Wi-Fi" value onChange={() => {}} />);
    expect(aria(screen.getByRole("switch"), "checked")).toBe("true");
  });

  it("a RadioButton is a radio, checked when selected", () => {
    draw(
      <>
        <RadioButton label="Yes" selected onPress={() => {}} />
        <RadioButton label="No" selected={false} onPress={() => {}} />
      </>,
    );
    const [yes, no] = screen.getAllByRole("radio");
    expect(aria(yes, "checked")).toBe("true");
    expect(aria(no, "checked")).toBe("false");
  });
});

describe("Tabs", () => {
  it("are tabs, the active one selected and a disabled one disabled", () => {
    draw(
      <Tabs
        tabs={[
          { label: "One" },
          { label: "Two" },
          { label: "Three", disabled: true },
        ]}
        activeTab={1}
        onChange={() => {}}
      />,
    );
    const [one, two, three] = screen.getAllByRole("tab");
    expect(aria(one, "selected")).toBe("false");
    expect(aria(two, "selected")).toBe("true");
    expect(aria(three, "disabled")).toBe("true");
  });
});

describe("Select", () => {
  it("is a combobox that says whether its list is open", () => {
    draw(
      <Select
        label="Colour"
        options={[
          { id: "r", label: "Red", value: "r" },
          { id: "g", label: "Green", value: "g" },
        ]}
        value={null}
        onChange={() => {}}
      />,
    );
    const box = screen.getByRole("combobox");
    expect(aria(box, "expanded")).toBe("false");
    fireEvent.click(box);
    expect(aria(screen.getByRole("combobox"), "expanded")).toBe("true");
  });
});

describe("Slider", () => {
  it("is a slider with its range and value", () => {
    draw(<Slider value={30} min={0} max={100} onValueChange={() => {}} />);
    const slider = screen.getByRole("slider");
    expect(aria(slider, "valuemin")).toBe("0");
    expect(aria(slider, "valuemax")).toBe("100");
    expect(aria(slider, "valuenow")).toBe("30");
  });
});

describe("where you are", () => {
  it("Pagination is a navigation landmark whose current page is marked", () => {
    draw(<Pagination activePage={2} totalPages={5} onChange={() => {}} />);
    const nav = screen.getByRole("navigation");
    const current = within(nav)
      .getAllByRole("button")
      .filter((b) => aria(b, "current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toBe("2");
  });

  it("Breadcrumbs are a navigation landmark whose last item is the current page", () => {
    draw(
      <Breadcrumbs
        items={[
          { id: "h", label: "Home", onPress: () => {} },
          { id: "c", label: "Customers", onPress: () => {} },
          { id: "r", label: "Rossi" },
        ]}
      />,
    );
    const nav = screen.getByRole("navigation");
    expect(within(nav).getByText("Rossi").closest("[aria-current]")).not.toBe(
      null,
    );
    expect(
      aria(
        within(nav).getByText("Rossi").closest("[aria-current]") as HTMLElement,
        "current",
      ),
    ).toBe("page");
  });
});
