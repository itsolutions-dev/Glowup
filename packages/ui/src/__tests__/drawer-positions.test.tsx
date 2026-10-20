import React, { useEffect } from "react";
import { Animated, PanResponder, StyleSheet, Text } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Drawer,
  DrawerItem,
  ThemeProvider,
  ViewportProvider,
  useTheme,
  type Theme,
} from "..";
import { useEscapeKey } from "../components/internal/useEscapeKey";

// Escape is a document listener on web; what matters here is what the drawer
// registers with the hook.
jest.mock("../components/internal/useEscapeKey", () => ({
  useEscapeKey: jest.fn(),
}));

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
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1024, height: 768 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <Probe />
        {ui}
      </ThemeProvider>
    </SafeAreaProvider>,
  );

const style = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

const items = <DrawerItem label="Inbox" onClick={() => {}} />;

describe("Drawer static", () => {
  it("is permanent: there is no scrim, and `visible` does not matter", async () => {
    const { getByText, queryByTestId } = await draw(
      <Drawer testID="nav">{items}</Drawer>,
    );
    expect(getByText("Inbox")).toBeTruthy();
    expect(
      queryByTestId("nav-scrim", { includeHiddenElements: true }),
    ).toBeNull();
  });

  it("is a 360 wide column on the left by default, with a hairline toward the content", async () => {
    const { getByTestId } = await draw(<Drawer testID="nav">{items}</Drawer>);
    const nav = style(getByTestId("nav"));
    expect(nav.width).toBe(360);
    expect(nav.borderRightWidth).toBe(1);
    expect(nav.borderRightColor).toBe(theme.colors.outlineVariant);
    expect(nav.backgroundColor).toBe(theme.colors.surface);
  });

  it.each([
    ["left", "borderRightWidth"],
    ["right", "borderLeftWidth"],
    ["top", "borderBottomWidth"],
    ["bottom", "borderTopWidth"],
  ] as const)(
    "position %s draws its hairline on the edge facing the content",
    async (position, edge) => {
      const { getByTestId } = await draw(
        <Drawer position={position} testID="nav">
          {items}
        </Drawer>,
      );
      expect(style(getByTestId("nav"))[edge]).toBe(1);
    },
  );

  it("right is a column of `width`", async () => {
    const { getByTestId } = await draw(
      <Drawer position="right" width={280} testID="nav">
        {items}
      </Drawer>,
    );
    expect(style(getByTestId("nav")).width).toBe(280);
  });

  it.each(["top", "bottom"] as const)(
    "%s spans the width and is as tall as its content, up to `height`",
    async (position) => {
      const { getByTestId, rerender } = await draw(
        <Drawer position={position} testID="nav">
          {items}
        </Drawer>,
      );
      const fit = style(getByTestId("nav"));
      expect(fit.width).toBeUndefined();
      expect(fit.maxHeight).toBe(360);

      await rerender(
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 1024, height: 768 },
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
          }}
        >
          <ThemeProvider>
            <Drawer position={position} height={200} testID="nav">
              {items}
            </Drawer>
          </ThemeProvider>
        </SafeAreaProvider>,
      );
      expect(style(getByTestId("nav")).maxHeight).toBe(200);
    },
  );

  it("keeps the 72 wide icons-only mode", async () => {
    const { getByTestId } = await draw(
      <Drawer collapsed testID="nav">
        {items}
      </Drawer>,
    );
    expect(style(getByTestId("nav")).width).toBe(72);
  });
});

describe("Drawer elevation", () => {
  it("is 0 when static: the plain surface and no shadow", async () => {
    const { getByTestId } = await draw(<Drawer testID="nav">{items}</Drawer>);
    const nav = style(getByTestId("nav"));
    expect(nav.backgroundColor).toBe(theme.colors.surface);
    expect(nav.shadowRadius).toBeUndefined();
  });

  it.each([
    [1, "surfaceContainerLow"],
    [2, "surfaceContainer"],
    [3, "surfaceContainerHigh"],
    [4, "surfaceContainerHighest"],
    [5, "surfaceDim"],
    [9, "surfaceDim"],
    [-2, "surface"],
  ] as const)("level %s paints the %s tone", async (elevation, token) => {
    const { getByTestId } = await draw(
      <Drawer elevation={elevation} testID="nav">
        {items}
      </Drawer>,
    );
    expect(style(getByTestId("nav")).backgroundColor).toBe(theme.colors[token]);
  });

  it("casts a shadow from level 1 up (iOS)", async () => {
    const { getByTestId } = await draw(
      <Drawer elevation={3} testID="nav">
        {items}
      </Drawer>,
    );
    expect(style(getByTestId("nav")).shadowOpacity).toBeGreaterThan(0);
  });

  it("is 1 when swipeable, and settable", async () => {
    const { getByTestId, rerender } = await draw(
      <Drawer variant="swipeable" visible testID="nav">
        {items}
      </Drawer>,
    );
    expect(style(getByTestId("nav-panel")).backgroundColor).toBe(
      theme.colors.surfaceContainerLow,
    );
    await rerender(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 1024, height: 768 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ThemeProvider>
          <Drawer variant="swipeable" visible elevation={4} testID="nav">
            {items}
          </Drawer>
        </ThemeProvider>
      </SafeAreaProvider>,
    );
    expect(style(getByTestId("nav-panel")).backgroundColor).toBe(
      theme.colors.surfaceContainerHighest,
    );
  });
});

describe("Drawer as a side sheet", () => {
  const sheet = (props = {}) => (
    <Drawer
      position="right"
      title="Filters"
      showCloseButton
      testID="sheet"
      {...props}
    >
      <Text>Body</Text>
    </Drawer>
  );

  it("takes arbitrary children, a titled header row and a close button that calls onClose", async () => {
    const onClose = jest.fn();
    const { getByText, getByRole, getByLabelText } = await draw(
      sheet({ onClose }),
    );
    expect(getByText("Body")).toBeTruthy();
    expect(getByRole("header", { name: "Filters" })).toBeTruthy();
    await fireEvent.press(getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("pins `actions` below a divider", async () => {
    const { getByText } = await draw(
      sheet({ actions: <Text>Apply</Text>, showCloseButton: false }),
    );
    expect(getByText("Apply")).toBeTruthy();
    expect(getByText("Body")).toBeTruthy();
  });

  it("shows a back button before the title", async () => {
    const onBack = jest.fn();
    const { getByLabelText } = await draw(sheet({ onBack }));
    await fireEvent.press(getByLabelText("Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("has no close button unless asked", async () => {
    const { queryByLabelText } = await draw(
      sheet({ showCloseButton: false, actions: <Text>Apply</Text> }),
    );
    expect(queryByLabelText("Close")).toBeNull();
  });

  // A View is no accessible element to the role queries, so look at the tree.
  it("a plain navigation drawer is a navigation landmark", async () => {
    const { toJSON } = await draw(<Drawer>{items}</Drawer>);
    expect(JSON.stringify(toJSON())).toContain('"role":"navigation"');
  });

  it("a sheet of arbitrary content is not", async () => {
    const { toJSON } = await draw(sheet());
    expect(JSON.stringify(toJSON())).not.toContain("navigation");
  });

  it("keeps a title as a headline in the list without header chrome", async () => {
    const { getByRole, queryByLabelText } = await draw(
      <Drawer title="Mail">{items}</Drawer>,
    );
    expect(getByRole("header", { name: "Mail" })).toBeTruthy();
    expect(queryByLabelText("Close")).toBeNull();
  });

  it("hides the header row when collapsed", async () => {
    const { queryByText } = await draw(sheet({ collapsed: true }));
    expect(queryByText("Filters")).toBeNull();
  });
});

describe("Drawer swipeable", () => {
  const swipeable = (visible: boolean, props = {}) => (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1024, height: 768 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <Drawer variant="swipeable" visible={visible} testID="nav" {...props}>
          {items}
        </Drawer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
  const scrim = (get: (id: string, o: object) => unknown) =>
    get("nav-scrim", { includeHiddenElements: true }) as never;

  it("renders nothing closed and closes from the scrim open", async () => {
    const onClose = jest.fn();
    const { queryByText, getByTestId, rerender } = await render(
      swipeable(false, { onClose }),
    );
    expect(queryByText("Inbox")).toBeNull();

    await rerender(swipeable(true, { onClose }));
    expect(queryByText("Inbox")).toBeTruthy();
    await fireEvent.press(scrim(getByTestId));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("names the scrim for assistive tech", async () => {
    const { getByTestId } = await render(swipeable(true));
    expect(
      (scrim(getByTestId) as { props: { accessibilityLabel: string } }).props
        .accessibilityLabel,
    ).toBe("Close drawer");
  });

  it("closes on Escape while open (web): registers onClose with the key hook", async () => {
    const hook = useEscapeKey as jest.Mock;
    hook.mockClear();
    const onClose = jest.fn();
    await render(swipeable(true, { onClose }));
    const [active, handler] = hook.mock.calls.at(-1);
    expect(active).toBe(true);
    handler();
    expect(onClose).toHaveBeenCalledTimes(1);

    hook.mockClear();
    await render(swipeable(false, { onClose }));
    expect(hook.mock.calls.at(-1)[0]).toBe(false);
  });

  it("a static drawer listens for no key", async () => {
    const hook = useEscapeKey as jest.Mock;
    hook.mockClear();
    await draw(<Drawer onClose={() => {}}>{items}</Drawer>);
    expect(hook).not.toHaveBeenCalled();
  });

  it.each([
    ["left", { left: 0 }],
    ["right", { right: 0 }],
    ["top", { top: 0, left: 0, right: 0 }],
    ["bottom", { bottom: 0, left: 0, right: 0 }],
  ] as const)(
    "position %s attaches the panel to that edge",
    async (position, edges) => {
      const { getByTestId } = await render(swipeable(true, { position }));
      expect(style(getByTestId("nav-panel"))).toMatchObject(edges);
    },
  );

  it("left and right panels are `width` wide and as tall as the window", async () => {
    const { getByTestId } = await render(
      swipeable(true, { position: "right", width: 300 }),
    );
    expect(style(getByTestId("nav-panel"))).toMatchObject({
      width: 300,
      top: 0,
      bottom: 0,
    });
  });

  it("caps a wide panel at the window width", async () => {
    const { getByTestId } = await render(
      <ViewportProvider width={320}>{swipeable(true)}</ViewportProvider>,
    );
    expect(style(getByTestId("nav-panel")).width).toBe(320);
  });

  it("top and bottom panels size to their content up to `height`", async () => {
    const { getByTestId } = await render(
      swipeable(true, { position: "bottom", height: 240 }),
    );
    const panel = style(getByTestId("nav-panel"));
    expect(panel.maxHeight).toBe(240);
    expect(panel.width).toBeUndefined();
    expect(panel.height).toBeUndefined();
  });

  it("rounds the corners that face the content", async () => {
    const { getByTestId, rerender } = await render(swipeable(true));
    expect(style(getByTestId("nav-panel"))).toMatchObject({
      borderTopRightRadius: expect.any(Number),
      borderBottomRightRadius: expect.any(Number),
    });
    await rerender(swipeable(true, { position: "bottom" }));
    expect(style(getByTestId("nav-panel"))).toMatchObject({
      borderTopLeftRadius: expect.any(Number),
      borderTopRightRadius: expect.any(Number),
    });
  });

  describe("dragging toward the edge", () => {
    type Config = {
      onMoveShouldSetPanResponder: (e: unknown, g: object) => boolean;
      onPanResponderGrant: (e: unknown, g: object) => void;
      onPanResponderMove: (e: unknown, g: object) => void;
      onPanResponderRelease: (e: unknown, g: object) => void;
      onPanResponderTerminate: (e: unknown, g: object) => void;
    };
    let create: jest.SpyInstance;
    beforeEach(() => {
      create = jest.spyOn(PanResponder, "create");
    });
    afterEach(() => create.mockRestore());
    const config = () => create.mock.calls.at(-1)[0] as Config;
    const gesture = (dx: number, dy: number, vx = 0, vy = 0) => ({
      dx,
      dy,
      vx,
      vy,
    });

    // Where each position's edge is: a drag that way is a closing one.
    const toward = {
      left: (n: number) => gesture(-n, 0),
      right: (n: number) => gesture(n, 0),
      top: (n: number) => gesture(0, -n),
      bottom: (n: number) => gesture(0, n),
    } as const;

    it.each(["left", "right", "top", "bottom"] as const)(
      "%s: only a clear drag toward the edge claims the gesture",
      async (position) => {
        await render(swipeable(true, { position }));
        const { onMoveShouldSetPanResponder: claims } = config();
        expect(claims({}, toward[position](20))).toBe(true);
        // too small to tell from a tap
        expect(claims({}, toward[position](4))).toBe(false);
        // away from the edge
        expect(claims({}, toward[position](-20))).toBe(false);
        // across the axis: a scroll, which the content keeps
        const across =
          position === "left" || position === "right"
            ? gesture(toward[position](20).dx, 40)
            : gesture(40, toward[position](20).dy);
        expect(claims({}, across)).toBe(false);
      },
    );

    it.each(["left", "right", "top", "bottom"] as const)(
      "%s: a drag past the threshold closes it through onClose",
      async (position) => {
        const onClose = jest.fn();
        await render(swipeable(true, { position, onClose }));
        const cfg = config();
        await act(async () => {
          cfg.onPanResponderGrant({}, gesture(0, 0));
          cfg.onPanResponderMove({}, toward[position](200));
          cfg.onPanResponderRelease({}, toward[position](200));
        });
        expect(onClose).toHaveBeenCalledTimes(1);
      },
    );

    it("a short, slow drag springs back and does not close", async () => {
      const onClose = jest.fn();
      await render(swipeable(true, { onClose }));
      const cfg = config();
      await act(async () => {
        cfg.onPanResponderGrant({}, gesture(0, 0));
        cfg.onPanResponderMove({}, toward.left(40));
        cfg.onPanResponderRelease({}, toward.left(40));
      });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("a short flick toward the edge closes it", async () => {
      const onClose = jest.fn();
      await render(swipeable(true, { onClose }));
      await act(async () => {
        config().onPanResponderRelease({}, gesture(-30, 0, -0.8, 0));
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("a drag the system takes over does not close it", async () => {
      const onClose = jest.fn();
      await render(swipeable(true, { onClose }));
      await act(async () => {
        config().onPanResponderTerminate({}, toward.left(300));
      });
      expect(onClose).not.toHaveBeenCalled();
    });

    // The host props of an Animated view are not flushed on their own in a
    // test, so what the drag does to the open fraction is read off the calls.
    const opened = (spy: jest.SpyInstance, toValue: number) =>
      spy.mock.calls.filter(([, c]) => c.toValue === toValue);

    it("scrubs the panel with the finger: the open fraction follows the drag", async () => {
      const setValue = jest.spyOn(Animated.Value.prototype, "setValue");
      await render(swipeable(true));
      const cfg = config();
      setValue.mockClear();
      await act(async () => {
        cfg.onPanResponderGrant({}, gesture(0, 0));
        cfg.onPanResponderMove({}, toward.left(180));
      });
      // 180 of the 360 wide panel
      expect(setValue).toHaveBeenLastCalledWith(0.5);
      await act(async () => {
        cfg.onPanResponderMove({}, toward.left(900));
      });
      // never further than the panel itself
      expect(setValue).toHaveBeenLastCalledWith(0);
      await act(async () => {
        cfg.onPanResponderMove({}, toward.left(-50));
      });
      // and never past fully open
      expect(setValue).toHaveBeenLastCalledWith(1);
      setValue.mockRestore();
    });

    it("a drawer that ignores onClose springs back instead of staying half open", async () => {
      await render(swipeable(true));
      const timing = jest.spyOn(Animated, "timing");
      await act(async () => {
        config().onPanResponderRelease({}, toward.left(300));
      });
      expect(opened(timing, 1)).toHaveLength(1);
      timing.mockRestore();
    });

    it("a drawer whose parent closes it slides out, unmounts and does not spring back", async () => {
      const Controlled = () => {
        const [open, setOpen] = React.useState(true);
        return (
          <Drawer
            variant="swipeable"
            visible={open}
            onClose={() => setOpen(false)}
            testID="nav"
          >
            {items}
          </Drawer>
        );
      };
      const { queryByText } = await draw(<Controlled />);
      expect(queryByText("Inbox")).toBeTruthy();
      const timing = jest.spyOn(Animated, "timing");
      await act(async () => {
        config().onPanResponderRelease({}, toward.left(300));
      });
      await waitFor(() => expect(queryByText("Inbox")).toBeNull());
      expect(opened(timing, 0).length).toBeGreaterThan(0);
      expect(opened(timing, 1)).toHaveLength(0);
      timing.mockRestore();
    });

    it("left and right drag by the whole panel, top and bottom by a handle", async () => {
      const { getByTestId, queryByTestId, rerender } = await render(
        swipeable(true),
      );
      expect(
        getByTestId("nav-panel").props.onMoveShouldSetResponder,
      ).toBeDefined();
      expect(queryByTestId("nav-handle")).toBeNull();

      await rerender(swipeable(true, { position: "bottom" }));
      expect(
        getByTestId("nav-panel").props.onMoveShouldSetResponder,
      ).toBeUndefined();
      expect(
        getByTestId("nav-handle").props.onMoveShouldSetResponder,
      ).toBeDefined();
    });
  });
});
