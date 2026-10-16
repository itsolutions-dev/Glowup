import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Tabs, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const TABS = [
  { label: "Overview", key: "overview" },
  { label: "Billing", key: "billing" },
  { label: "Audit", key: "audit", disabled: true },
];

describe("Tabs", () => {
  it("still works by position with plain strings", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await draw(
      <Tabs tabs={["One", "Two"]} activeTab={0} onChange={onChange} />,
    );
    expect(getByLabelText("One").props.accessibilityState.selected).toBe(true);
    await fireEvent.press(getByLabelText("Two"));
    expect(onChange).toHaveBeenCalledWith(1, undefined);
  });

  it("marks the tab named by activeKey and reports the key on press", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await draw(
      <Tabs tabs={TABS} activeKey="billing" onChange={onChange} />,
    );
    expect(getByLabelText("Billing").props.accessibilityState.selected).toBe(
      true,
    );
    expect(getByLabelText("Overview").props.accessibilityState.selected).toBe(
      false,
    );
    await fireEvent.press(getByLabelText("Overview"));
    expect(onChange).toHaveBeenCalledWith(0, "overview");
  });

  it("follows a key when the tabs around it change position", async () => {
    const { getByLabelText, rerender } = await draw(
      <Tabs tabs={TABS} activeKey="billing" onChange={() => {}} />,
    );
    await rerender(
      <ThemeProvider>
        <Tabs
          tabs={[TABS[1], TABS[0]]}
          activeKey="billing"
          onChange={() => {}}
        />
      </ThemeProvider>,
    );
    expect(getByLabelText("Billing").props.accessibilityState.selected).toBe(
      true,
    );
  });

  it("ignores presses on a disabled tab and announces it as disabled", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await draw(
      <Tabs tabs={TABS} activeKey="overview" onChange={onChange} />,
    );
    expect(getByLabelText("Audit").props.accessibilityState.disabled).toBe(
      true,
    );
    await fireEvent.press(getByLabelText("Audit"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects nothing, and hides the indicator, for a key that matches no tab", async () => {
    const { getByLabelText, toJSON } = await draw(
      <Tabs tabs={TABS} activeKey="missing" onChange={() => {}} />,
    );
    TABS.forEach((tab) =>
      expect(getByLabelText(tab.label).props.accessibilityState.selected).toBe(
        false,
      ),
    );
    expect(JSON.stringify(toJSON())).toContain('"opacity":0');
  });
});
