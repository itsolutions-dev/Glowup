import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Accordion, Stat, ThemeProvider, useTheme, type Theme } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const json = async (ui: React.ReactElement) =>
  JSON.stringify((await draw(ui)).toJSON());

/** The theme's colours, read from inside the provider. */
const themeOf = async () => {
  let theme: Theme | undefined;
  const Probe = () => {
    theme = useTheme().theme;
    return null;
  };
  await draw(<Probe />);
  return theme as unknown as Theme;
};

describe("Accordion", () => {
  // The chevron and the panel run on timers; none should fire between tests.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("is closed by default and opens from expanded", async () => {
    const closed = await draw(<Accordion title="FAQ">Answer</Accordion>);
    expect(closed.getByRole("button").props.accessibilityState).toMatchObject({
      expanded: false,
    });
    expect(closed.queryByText("Answer")).toBeNull();

    const open = await draw(
      <Accordion title="FAQ" expanded>
        Answer
      </Accordion>,
    );
    expect(open.getByRole("button").props.accessibilityState).toMatchObject({
      expanded: true,
    });
    expect(open.getByText("Answer")).toBeTruthy();
  });

  it("toggles on press and reports the new state every time", async () => {
    const onClick = jest.fn();
    const { getByRole } = await draw(
      <Accordion title="FAQ" onClick={onClick}>
        Answer
      </Accordion>,
    );
    await fireEvent.press(getByRole("button"));
    expect(onClick).toHaveBeenLastCalledWith(true);
    expect(getByRole("button").props.accessibilityState).toMatchObject({
      expanded: true,
    });
    await fireEvent.press(getByRole("button"));
    expect(onClick).toHaveBeenLastCalledWith(false);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("follows expanded when the prop changes, and works controlled", async () => {
    const tree = (expanded: boolean) => (
      <ThemeProvider>
        <Accordion title="FAQ" expanded={expanded}>
          Answer
        </Accordion>
      </ThemeProvider>
    );
    const { getByRole, rerender } = await render(tree(false));
    const isOpen = () => getByRole("button").props.accessibilityState.expanded;
    expect(isOpen()).toBe(false);
    await rerender(tree(true));
    expect(isOpen()).toBe(true);
    await rerender(tree(false));
    expect(isOpen()).toBe(false);

    // A parent that keeps `expanded` in its own state.
    const Controlled = () => {
      const [expanded, setExpanded] = useState(false);
      return (
        <>
          <Accordion title="FAQ" expanded={expanded} onClick={setExpanded}>
            Answer
          </Accordion>
          <Text testID="state">{String(expanded)}</Text>
        </>
      );
    };
    const controlled = await draw(<Controlled />);
    await fireEvent.press(controlled.getByRole("button"));
    expect(controlled.getByTestId("state").props.children).toBe("true");
    expect(
      controlled.getByRole("button").props.accessibilityState,
    ).toMatchObject({ expanded: true });
    await fireEvent.press(controlled.getByRole("button"));
    expect(controlled.getByTestId("state").props.children).toBe("false");
  });

  it("draws icon as a glyph name or a node, and a turning chevron by default", async () => {
    const chevron = await json(<Accordion title="a">x</Accordion>);
    expect(chevron).toContain("rotate");
    const glyph = await json(
      <Accordion title="a" icon="plus">
        x
      </Accordion>,
    );
    expect(glyph).not.toContain("rotate");
    const node = await draw(
      <Accordion title="a" icon={<Text testID="mark">+</Text>}>
        x
      </Accordion>,
    );
    expect(node.getByTestId("mark")).toBeTruthy();
    expect(JSON.stringify(node.toJSON())).not.toContain("rotate");
  });

  it("is outlined by default and contained on request", async () => {
    const theme = await themeOf();
    const outlined = await json(<Accordion title="a">x</Accordion>);
    expect(outlined).toContain('"borderWidth":1');
    expect(outlined).toContain(
      `"borderColor":"${theme.colors.outlineVariant}"`,
    );
    const contained = await json(
      <Accordion title="a" variant="contained">
        x
      </Accordion>,
    );
    expect(contained).not.toContain('"borderWidth":1');
    expect(contained).toContain(
      `"backgroundColor":"${theme.colors.surfaceContainerLow}"`,
    );
  });
});

describe("Stat", () => {
  const delta = async (props: object) => {
    const { getByText } = await draw(
      <Stat label="Revenue" value="1.2M" delta="12%" {...props} />,
    );
    return StyleSheet.flatten(getByText("12%").props.style).color;
  };

  it("colours the trend up success, down error and flat neutral by default", async () => {
    const { colors } = await themeOf();
    expect(await delta({ trend: "up" })).toBe(colors.success);
    expect(await delta({ trend: "down" })).toBe(colors.error);
    expect(await delta({ trend: "flat" })).toBe(colors.onSurfaceVariant);
  });

  it("takes trendColor as a theme token, or any colour", async () => {
    const { colors } = await themeOf();
    // A metric where down is good: the caller says so.
    expect(await delta({ trend: "down", trendColor: "success" })).toBe(
      colors.success,
    );
    expect(await delta({ trend: "up", trendColor: "tertiary" })).toBe(
      colors.tertiary,
    );
    expect(await delta({ trend: "up", trendColor: "#123456" })).toBe("#123456");
    // The arrow follows it.
    const out = await json(
      <Stat label="a" value="1" delta="2" trend="up" trendColor="#123456" />,
    );
    expect(out.match(/"color":"#123456"/g)).toHaveLength(2);
  });

  it("stacks label and value by default, and puts them on one line with row", async () => {
    const column = await json(
      <Stat label="Revenue" value="1.2M" delta="12%" />,
    );
    expect(column).not.toContain('"flexWrap":"wrap"');
    const { getByText, toJSON } = await draw(
      <Stat
        label="Revenue"
        value="1.2M"
        delta="12%"
        trend="up"
        direction="row"
      />,
    );
    const row = JSON.stringify(toJSON());
    expect(row).toContain('"flexWrap":"wrap"');
    // The label first, then the value with its delta behind it.
    expect(row.indexOf("Revenue")).toBeLessThan(row.indexOf("1.2M"));
    expect(row.indexOf("1.2M")).toBeLessThan(row.indexOf("12%"));
    expect(getByText("12%")).toBeTruthy();
  });

  it("keeps the help text under the row", async () => {
    const { getByText } = await draw(
      <Stat label="a" value="1" direction="row" helpText="vs last month" />,
    );
    expect(getByText("vs last month")).toBeTruthy();
  });
});
