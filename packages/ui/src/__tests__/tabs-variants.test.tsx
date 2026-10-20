import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Tabs, ThemeProvider, useTheme, type TabsProps, type Theme } from "..";

let theme: Theme;
const Probe = () => {
  const current = useTheme().theme;
  useEffect(() => {
    theme = current;
  }, [current]);
  return null;
};

const ui = (props: Partial<TabsProps> = {}) => (
  <ThemeProvider>
    <Probe />
    <Tabs
      tabs={["One", "Two", "Three"]}
      activeTab={1}
      onChange={() => {}}
      testID="tabs"
      {...props}
    />
  </ThemeProvider>
);
const draw = (props: Partial<TabsProps> = {}) => render(ui(props));

const style = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

const layout = (x: number, width: number) => ({
  nativeEvent: { layout: { x, y: 0, width, height: 48 } },
});

const ICON_TABS = [
  { label: "Home", icon: "home" },
  { label: "Inbox", icon: "inbox" },
];

describe("Tabs variants", () => {
  it("standard is the default: an underline under the active tab, on the surface", async () => {
    const { getByTestId, getByText } = await draw();
    const bar = style(getByTestId("tabs"));
    expect(bar.backgroundColor).toBe(theme.colors.surface);
    expect(bar.borderBottomWidth).toBe(1);
    expect(bar.borderRadius).toBeUndefined();
    const indicator = style(getByTestId("tabs-indicator"));
    expect(indicator.height).toBe(3);
    expect(indicator.backgroundColor).toBe(theme.colors.primary);
    expect(style(getByText("Two")).color).toBe(theme.colors.primary);
    expect(style(getByText("One")).color).toBe(theme.colors.onSurfaceVariant);
  });

  it("rounded is a pill on a rounded track", async () => {
    const { getByTestId, getByText } = await draw({ variant: "rounded" });
    const track = style(getByTestId("tabs"));
    expect(track.backgroundColor).toBe(theme.colors.surfaceContainerHigh);
    expect(track.borderRadius).toBeGreaterThan(100);
    expect(track.borderBottomWidth).toBeUndefined();
    const pill = style(getByTestId("tabs-indicator"));
    expect(pill.backgroundColor).toBe(theme.colors.primary);
    expect(pill.borderRadius).toBeGreaterThan(100);
    // the label sits on the pill, so it takes the colour made for it
    expect(style(getByText("Two")).color).toBe(theme.colors.onPrimary);
    expect(style(getByText("One")).color).toBe(theme.colors.onSurfaceVariant);
  });

  it("shows the indicator once the active tab is measured, in either variant", async () => {
    for (const variant of ["standard", "rounded"] as const) {
      const { getByTestId, getByLabelText, unmount } = await draw({ variant });
      expect(style(getByTestId("tabs-indicator")).opacity).toBe(0);
      await fireEvent(getByLabelText("One"), "layout", layout(0, 100));
      // another tab than the active one: still nothing to show
      expect(style(getByTestId("tabs-indicator")).opacity).toBe(0);
      await fireEvent(getByLabelText("Two"), "layout", layout(100, 100));
      expect(style(getByTestId("tabs-indicator")).opacity).toBe(1);
      await unmount();
    }
  });

  it.each(["standard", "rounded"] as const)(
    "%s keeps keys, onChange and disabled tabs",
    async (variant) => {
      const onChange = jest.fn();
      const tabs = [
        { label: "Overview", key: "overview" },
        { label: "Billing", key: "billing" },
        { label: "Audit", key: "audit", disabled: true },
      ];
      const { getByLabelText } = await draw({
        variant,
        tabs,
        activeTab: undefined,
        activeKey: "billing",
        onChange,
      });
      expect(getByLabelText("Billing").props.accessibilityState).toMatchObject({
        selected: true,
      });
      await fireEvent.press(getByLabelText("Overview"));
      expect(onChange).toHaveBeenCalledWith(0, "overview");
      await fireEvent.press(getByLabelText("Audit"));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(getByLabelText("Audit").props.accessibilityState).toMatchObject({
        disabled: true,
      });
    },
  );

  it("rounded puts the icon before the label, standard above it", async () => {
    const rounded = await draw({ variant: "rounded", tabs: ICON_TABS });
    // an inline tab is a row
    expect(style(rounded.getByLabelText("Home")).flexDirection).toBe("row");
    await rounded.unmount();
    const standard = await draw({ tabs: ICON_TABS });
    expect(style(standard.getByLabelText("Home")).flexDirection).not.toBe(
      "row",
    );
  });
});

describe("Tabs color", () => {
  it("defaults to primary", async () => {
    const { getByTestId } = await draw();
    expect(style(getByTestId("tabs-indicator")).backgroundColor).toBe(
      theme.colors.primary,
    );
  });

  it("paints the underline and the selected label in the role's colour", async () => {
    const { getByTestId, getByText } = await draw({ color: "tertiary" });
    expect(style(getByTestId("tabs-indicator")).backgroundColor).toBe(
      theme.colors.tertiary,
    );
    expect(style(getByText("Two")).color).toBe(theme.colors.tertiary);
    expect(style(getByText("One")).color).toBe(theme.colors.onSurfaceVariant);
  });

  it("paints the pill in the role's colour and the label on it in `on` that colour", async () => {
    const { getByTestId, getByText } = await draw({
      variant: "rounded",
      color: "error",
    });
    expect(style(getByTestId("tabs-indicator")).backgroundColor).toBe(
      theme.colors.error,
    );
    expect(style(getByText("Two")).color).toBe(theme.colors.onError);
  });
});

describe("Tabs size", () => {
  it.each([
    ["sm", 40, "labelMedium"],
    ["md", 48, "labelLarge"],
    ["lg", 56, "titleMedium"],
  ] as const)("%s is %sdp tall and set in %s", async (size, height, type) => {
    const { getByTestId, getByText } = await draw({ size });
    expect(style(getByTestId("tabs")).height).toBe(height);
    expect(style(getByText("One")).fontSize).toBe(
      theme.typography[type].fontSize,
    );
  });

  it.each([
    ["sm", 64],
    ["md", 80],
    ["lg", 96],
  ] as const)("%s with icons is %sdp tall", async (size, height) => {
    const { getByTestId } = await draw({ size, tabs: ICON_TABS });
    expect(style(getByTestId("tabs")).height).toBe(height);
  });

  it("rounded keeps the label-only height with icons", async () => {
    const { getByTestId } = await draw({
      size: "lg",
      variant: "rounded",
      tabs: ICON_TABS,
    });
    expect(style(getByTestId("tabs")).height).toBe(56);
  });

  it("is md by default", async () => {
    const { getByTestId } = await draw();
    expect(style(getByTestId("tabs")).height).toBe(48);
  });
});

describe("Tabs height and width", () => {
  it("fills the width it has, 100%, by default", async () => {
    const { getByTestId } = await draw();
    expect(style(getByTestId("tabs")).width).toBe("100%");
  });

  it("takes a height and a width in dp", async () => {
    const { getByTestId } = await draw({ height: 60, width: 300 });
    const bar = style(getByTestId("tabs"));
    expect(bar.height).toBe(60);
    expect(bar.width).toBe(300);
  });

  it("takes them as percentages too", async () => {
    const { getByTestId } = await draw({ height: "10%", width: "50%" });
    const bar = style(getByTestId("tabs"));
    expect(bar.height).toBe("10%");
    expect(bar.width).toBe("50%");
  });

  it("wins over the size, with or without icons", async () => {
    const { getByTestId } = await draw({
      size: "lg",
      height: 70,
      tabs: ICON_TABS,
    });
    expect(style(getByTestId("tabs")).height).toBe(70);
  });
});

describe("Tabs showBorders", () => {
  it("draws no dividers and no outline by default", async () => {
    const { queryByTestId, getByTestId } = await draw();
    expect(queryByTestId("tabs-divider-0")).toBeNull();
    expect(style(getByTestId("tabs")).borderWidth).toBeUndefined();
  });

  it("standard: a divider between each pair of tabs, none after the last", async () => {
    const { queryByTestId, getByTestId } = await draw({ showBorders: true });
    expect(getByTestId("tabs-divider-0")).toBeTruthy();
    expect(getByTestId("tabs-divider-1")).toBeTruthy();
    expect(queryByTestId("tabs-divider-2")).toBeNull();
    expect(style(getByTestId("tabs-divider-0")).backgroundColor).toBe(
      theme.colors.outlineVariant,
    );
    // no outline around an underline bar
    expect(style(getByTestId("tabs")).borderWidth).toBeUndefined();
  });

  it("rounded: an outline around the track", async () => {
    const { getByTestId } = await draw({
      variant: "rounded",
      showBorders: true,
    });
    const track = style(getByTestId("tabs"));
    expect(track.borderWidth).toBe(1);
    expect(track.borderColor).toBe(theme.colors.outlineVariant);
  });

  it("rounded: dividers between the tabs, except where the pill is", async () => {
    const { queryByTestId } = await draw({
      variant: "rounded",
      showBorders: true,
      tabs: ["One", "Two", "Three", "Four"],
      activeTab: 0,
    });
    // One | Two touches the pill under One; Two | Three and Three | Four do not.
    expect(queryByTestId("tabs-divider-0")).toBeNull();
    expect(queryByTestId("tabs-divider-1")).toBeTruthy();
    expect(queryByTestId("tabs-divider-2")).toBeTruthy();
    expect(queryByTestId("tabs-divider-3")).toBeNull();
  });
});

describe("Tabs fullWidth", () => {
  it("shares the width equally between the tabs by default", async () => {
    const { getByLabelText, queryByTestId } = await draw();
    expect(queryByTestId("tabs-scroll")).toBeNull();
    for (const label of ["One", "Two", "Three"]) {
      expect(style(getByLabelText(label)).flex).toBe(1);
    }
  });

  it("with fullWidth={false} sizes each tab to its label and scrolls sideways", async () => {
    const { getByLabelText, getByTestId } = await draw({ fullWidth: false });
    const scroll = getByTestId("tabs-scroll");
    expect(scroll.props.horizontal).toBe(true);
    expect(scroll.props.showsHorizontalScrollIndicator).toBe(false);
    for (const label of ["One", "Two", "Three"]) {
      expect(style(getByLabelText(label)).flex).toBeUndefined();
    }
  });

  it("keeps working: press, select, indicator, in the scrolling bar", async () => {
    const onChange = jest.fn();
    const { getByLabelText, getByTestId } = await draw({
      fullWidth: false,
      onChange,
    });
    await fireEvent.press(getByLabelText("Three"));
    expect(onChange).toHaveBeenCalledWith(2, undefined);
    await fireEvent(getByLabelText("Two"), "layout", layout(80, 90));
    expect(style(getByTestId("tabs-indicator")).opacity).toBe(1);
  });

  it("a rounded track then hugs its tabs; an underline bar keeps its divider across", async () => {
    const track = await draw({ variant: "rounded", fullWidth: false });
    expect(style(track.getByTestId("tabs")).alignSelf).toBe("flex-start");
    expect(style(track.getByTestId("tabs")).width).toBeUndefined();
    await track.unmount();
    const bar = await draw({ fullWidth: false });
    expect(style(bar.getByTestId("tabs")).alignSelf).toBeUndefined();
  });

  it("an explicit width still holds", async () => {
    const { getByTestId } = await draw({
      variant: "rounded",
      fullWidth: false,
      width: 240,
    });
    const track = style(getByTestId("tabs"));
    expect(track.width).toBe(240);
    expect(track.alignSelf).toBeUndefined();
  });
});
