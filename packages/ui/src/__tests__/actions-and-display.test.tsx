import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  FAB,
  IconButton,
  Rating,
  ThemeProvider,
  Typography,
  useTheme,
  type Theme,
} from "..";

let theme: Theme;
const Probe = () => {
  const current = useTheme().theme;
  useEffect(() => {
    theme = current;
  }, [current]);
  return null;
};

const draw = (ui: React.ReactElement) =>
  render(
    <ThemeProvider>
      <Probe />
      {ui}
    </ThemeProvider>,
  );

// A FAB reads the safe-area insets.
const drawWithInsets = (ui: React.ReactElement) =>
  draw(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      {ui}
    </SafeAreaProvider>,
  );

/** The nearest ancestor of `node` (itself included) whose style sets `key`. */
const ancestorWith = (node: any, key: string) => {
  for (let n = node; n; n = n.parent) {
    if (style(n)[key] !== undefined) return n;
  }
  throw new Error(`no ancestor sets ${key}`);
};

const style = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

describe("Typography", () => {
  it("is body text unless a variant says otherwise", async () => {
    const { getByText } = await draw(<Typography>Plain</Typography>);
    expect(style(getByText("Plain")).fontSize).toBe(
      theme.typography.bodyLarge.fontSize,
    );
  });

  it("draws the Material names with the theme's roles", async () => {
    const { getByText } = await draw(
      <>
        <Typography variant="h4">Heading</Typography>
        <Typography variant="body2">Body</Typography>
        <Typography variant="displayLarge">Legacy</Typography>
      </>,
    );
    expect(style(getByText("Heading")).fontSize).toBe(
      theme.typography.headlineLarge.fontSize,
    );
    expect(style(getByText("Body")).fontSize).toBe(
      theme.typography.bodyMedium.fontSize,
    );
    expect(style(getByText("Legacy")).fontSize).toBe(
      theme.typography.displayLarge.fontSize,
    );
  });

  it("takes a token or a raw colour, a size, a alignment and one line", async () => {
    const { getByText } = await draw(
      <>
        <Typography variant="caption" color="primary" align="center" nowrap>
          Token
        </Typography>
        <Typography variant="caption" color="#123456" fontSize={20}>
          Raw
        </Typography>
      </>,
    );
    const token = getByText("Token");
    expect(style(token).color).toBe(theme.colors.primary);
    expect(style(token).textAlign).toBe("center");
    expect(token.props.numberOfLines).toBe(1);
    const raw = getByText("Raw");
    expect(style(raw).color).toBe("#123456");
    expect(style(raw).fontSize).toBe(20);
    // The line height follows the size instead of clipping it.
    expect(style(raw).lineHeight).toBe(
      Math.round(
        (theme.typography.bodySmall.lineHeight! * 20) /
          theme.typography.bodySmall.fontSize!,
      ),
    );
  });

  it("is pressable through onClick", async () => {
    const onClick = jest.fn();
    const { getByText } = await draw(
      <Typography variant="body1" onClick={onClick}>
        Press me
      </Typography>,
    );
    await fireEvent.press(getByText("Press me"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("Button", () => {
  it("calls onClick and paints its variant in its colour role", async () => {
    const onClick = jest.fn();
    const { getByRole } = await draw(
      <Button variant="filled" color="warning" onClick={onClick}>
        Careful
      </Button>,
    );
    await fireEvent.press(getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(style(getByRole("button")).backgroundColor).toBe(
      theme.colors.warning,
    );
  });

  it("puts the icon on the start or the end of the label", async () => {
    const iconFirst = async (iconPosition: "start" | "end") => {
      const { toJSON, unmount } = await draw(
        <Button
          iconName="plus"
          iconPosition={iconPosition}
          iconStyle={{ letterSpacing: 7 }}
          accessibilityLabel="x"
        >
          Add
        </Button>,
      );
      const tree = JSON.stringify(toJSON());
      await unmount();
      return tree.indexOf('"letterSpacing":7') < tree.indexOf('"Add"');
    };
    expect(await iconFirst("start")).toBe(true);
    expect(await iconFirst("end")).toBe(false);
  });
});

describe("IconButton", () => {
  it("calls onClick", async () => {
    const onClick = jest.fn();
    const { getByRole } = await draw(
      <IconButton icon="plus" accessibilityLabel="Add" onClick={onClick} />,
    );
    await fireEvent.press(getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("colours the filled variant from its role", async () => {
    const { getByRole } = await draw(
      <IconButton
        icon="plus"
        accessibilityLabel="Add"
        variant="filled"
        color="success"
      />,
    );
    expect(style(getByRole("button")).backgroundColor).toBe(
      theme.colors.success,
    );
  });

  it("shows its title as a tooltip", async () => {
    const {
      getByLabelText,
      getAllByLabelText,
      queryByLabelText,
      getByText,
      queryByText,
    } = await draw(
      <IconButton icon="plus" accessibilityLabel="Add" title="Add a row" />,
    );
    expect(queryByText("Add a row")).toBeNull();
    // The tooltip's wrapper is not a second element of the same name: behind an
    // accessible wrapper a screen reader would never reach the button itself.
    expect(getAllByLabelText("Add")).toHaveLength(1);
    expect(queryByLabelText("Add a row")).toBeNull();
    await fireEvent(getByLabelText("Add"), "longPress");
    expect(getByText("Add a row")).toBeTruthy();
  });
});

describe("Chip", () => {
  it("has a large size, a role colour and a circular border", async () => {
    const { getByText } = await draw(
      <Chip label="Done" size="large" color="success" border="circular" />,
    );
    const box = ancestorWith(getByText("Done"), "height");
    expect(style(box).height).toBe(40);
    expect(style(box).borderRadius).toBe(20);
    expect(style(box).backgroundColor).toBe(theme.colors.success);
  });

  it("has squared corners", async () => {
    const { getByText } = await draw(<Chip label="Box" border="squared" />);
    expect(style(ancestorWith(getByText("Box"), "height")).borderRadius).toBe(
      0,
    );
  });

  it("calls onClick", async () => {
    const onClick = jest.fn();
    const { getByRole } = await draw(<Chip label="Go" onClick={onClick} />);
    await fireEvent.press(getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("FAB sizes", () => {
  it("is 40, 56 and 96 wide in its three sizes", async () => {
    const widths: Record<string, unknown> = {};
    for (const size of ["small", "medium", "large"] as const) {
      const { getByLabelText, unmount } = await drawWithInsets(
        <FAB icon="plus" label={size} size={size} onClick={() => {}} />,
      );
      widths[size] = style(getByLabelText(size)).width;
      await unmount();
    }
    expect(widths).toEqual({ small: 40, medium: 56, large: 96 });
  });
});

describe("Badge", () => {
  it("takes a colour role and a corner", async () => {
    const { getByText } = await draw(
      <Badge count={3} color="info" position="bottom-left" />,
    );
    const pill = getByText("3").parent!;
    expect(style(pill).backgroundColor).toBe(theme.colors.info);
    expect(style(pill).bottom).toBeLessThan(0);
    expect(style(pill).left).toBeLessThan(0);
    expect(style(pill).top).toBeUndefined();
  });
});

describe("Avatar", () => {
  it("takes a named size", async () => {
    const { getByLabelText } = await draw(
      <Avatar name="Ada Lovelace" size="large" />,
    );
    expect(style(getByLabelText("Ada Lovelace Avatar")).width).toBe(56);
  });

  it("shows its name as a tooltip", async () => {
    const { getByLabelText, getByText } = await draw(
      <Avatar name="Ada Lovelace" onClick={() => {}} />,
    );
    await fireEvent(getByLabelText("Ada Lovelace Avatar"), "longPress");
    expect(getByText("Ada Lovelace")).toBeTruthy();
  });
});

describe("Rating", () => {
  it("steps by halves when asked to", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await draw(
      <Rating value={0} interval={0.5} onChange={onChange} />,
    );
    await fireEvent.press(getByLabelText("2.5 stars"));
    expect(onChange).toHaveBeenCalledWith(2.5);
    await fireEvent.press(getByLabelText("3 stars"));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("clears on a second tap unless it is required", async () => {
    const onChange = jest.fn();
    const free = await draw(<Rating value={3} onChange={onChange} />);
    await fireEvent.press(free.getByLabelText("3 stars"));
    expect(onChange).toHaveBeenLastCalledWith(0);
    await free.unmount();

    const onRequired = jest.fn();
    const required = await draw(
      <Rating value={3} required onChange={onRequired} />,
    );
    await fireEvent.press(required.getByLabelText("3 stars"));
    expect(onRequired).toHaveBeenLastCalledWith(3);
  });

  it("previews the rating under the pointer", async () => {
    const { getByLabelText, toJSON } = await draw(
      <Rating value={1} onChange={() => {}} />,
    );
    // The filled share of an icon is its glyph clipped to a width.
    const filled = () =>
      JSON.stringify(toJSON()).split('"overflow":"hidden"').length - 1;
    expect(filled()).toBe(1);
    await fireEvent(getByLabelText("4 stars"), "hoverIn");
    // The value is still 1, but four icons are drawn filled while the pointer
    // rests on the fourth, and one again when it leaves.
    expect(filled()).toBe(4);
    await fireEvent(getByLabelText("4 stars"), "hoverOut");
    expect(filled()).toBe(1);
  });

  it("draws any icon that has an outline", async () => {
    const glyphs = async (icon: "star" | "heart") => {
      const { toJSON, unmount } = await draw(<Rating value={2} icon={icon} />);
      const tree = JSON.stringify(toJSON());
      await unmount();
      return tree;
    };
    // Same layout, other glyphs: the icon prop reaches the drawing.
    expect(await glyphs("heart")).not.toBe(await glyphs("star"));
  });
});

describe("Card", () => {
  it("is pressable through onClick", async () => {
    const onClick = jest.fn();
    const { getByRole } = await draw(
      <Card onClick={onClick}>
        <Card.Title
          title="Line 4"
          startIcon={<Avatar name="L4" />}
          endIcon={<Chip label="Live" />}
        />
      </Card>,
    );
    await fireEvent.press(getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("marks a selected card with a primary border, for screen readers too, without moving", async () => {
    const box = (s: Record<string, number>) =>
      (s.padding ?? 0) + (s.borderWidth ?? 0);
    for (const variant of ["filled", "outlined"] as const) {
      const { getByRole, rerender } = await draw(
        <Card variant={variant} onClick={() => {}}>
          <Typography variant="body1">Calls</Typography>
        </Card>,
      );
      const idle = StyleSheet.flatten(getByRole("button").props.style);
      expect(getByRole("button").props.accessibilityState?.selected).toBe(
        undefined,
      );

      await rerender(
        <ThemeProvider>
          <Probe />
          <Card variant={variant} onClick={() => {}} selected>
            <Typography variant="body1">Calls</Typography>
          </Card>
        </ThemeProvider>,
      );
      const card = getByRole("button", { selected: true });
      const style = StyleSheet.flatten(card.props.style);
      expect(style.borderWidth).toBe(2);
      expect(style.borderColor).toBe(theme.colors.primary);
      expect(box(style)).toBe(box(idle));
    }
  });

  it("lays the title between a start and an end slot", async () => {
    const { getByText } = await draw(
      <Card.Title
        title="Line 4"
        startIcon={<Typography variant="body1">start</Typography>}
        endIcon={<Typography variant="body1">end</Typography>}
      />,
    );
    expect(getByText("start")).toBeTruthy();
    expect(getByText("Line 4")).toBeTruthy();
    expect(getByText("end")).toBeTruthy();
  });
});
