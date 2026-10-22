import React, { createRef, useEffect } from "react";
import { Animated, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import ScrollArea from "../components/ScrollArea";
import { Theme, ThemeProvider, useTheme } from "../providers/ThemeProvider";

let mockReduceMotion = false;
jest.mock("../components/internal/useReduceMotion", () => ({
  useReduceMotion: () => mockReduceMotion,
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
    <ThemeProvider>
      <Probe />
      {ui}
    </ThemeProvider>,
  );

type Node = Parameters<typeof fireEvent>[0];
type Screen = Awaited<ReturnType<typeof render>>;

const style = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as never) as Record<string, any>;

const hidden = { includeHiddenElements: true };

/** The parts of a `<ScrollArea testID="sa">`, scrollbars included although they hide from queries. */
const parts = (screen: Screen) => {
  const by = (id: string) => screen.queryByTestId(id, hidden);
  return {
    root: () => screen.getByTestId("sa", hidden),
    viewport: () => screen.getByTestId("sa-viewport", hidden),
    viewportX: () => screen.getByTestId("sa-viewport-x", hidden),
    bar: (axis: "vertical" | "horizontal" = "vertical") =>
      by(`sa-scrollbar-${axis}`),
    thumb: (axis: "vertical" | "horizontal" = "vertical") =>
      by(`sa-thumb-${axis}`),
  };
};

/** Gives a scroll view a size and a content size, as the platform would. */
const layOut = async (
  view: Node,
  size: { width?: number; height?: number },
  content: { width?: number; height?: number },
) => {
  await fireEvent(view, "layout", {
    nativeEvent: {
      layout: { x: 0, y: 0, width: size.width ?? 0, height: size.height ?? 0 },
    },
  });
  await fireEvent(
    view,
    "contentSizeChange",
    content.width ?? 0,
    content.height ?? 0,
  );
};

const scrollTo = (view: Node, x: number, y: number) =>
  fireEvent.scroll(view, { nativeEvent: { contentOffset: { x, y } } });

/** 400 dp window on 1600 dp of content: a 100 dp thumb with 300 dp of travel. */
const overflowVertically = async (screen: Screen) => {
  await layOut(
    parts(screen).viewport(),
    { width: 300, height: 400 },
    { width: 300, height: 1600 },
  );
};

/** Swaps in a `scrollTo` spy on a scroll view the area owns. */
const spyOnScrollTo = (ref: React.RefObject<ScrollView | null>) => {
  const spy = jest.fn();
  (ref.current as unknown as { scrollTo: jest.Mock }).scrollTo = spy;
  return spy;
};

const Rows = () => (
  <>
    {Array.from({ length: 3 }, (_, i) => (
      <Text key={i}>{`Row ${i}`}</Text>
    ))}
  </>
);

afterEach(() => {
  mockReduceMotion = false;
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("ScrollArea", () => {
  describe("structure", () => {
    it("wraps its children in a scroll view with the native indicators hidden", async () => {
      const screen = await draw(
        <ScrollArea testID="sa">
          <Rows />
        </ScrollArea>,
      );
      expect(screen.getByText("Row 0")).toBeTruthy();
      const viewport = parts(screen).viewport();
      expect(viewport.props.showsVerticalScrollIndicator).toBe(false);
      expect(viewport.props.showsHorizontalScrollIndicator).toBe(false);
      expect(viewport.props.horizontal).toBeFalsy();
    });

    it("scrolls horizontally with orientation=horizontal", async () => {
      const screen = await draw(
        <ScrollArea testID="sa" orientation="horizontal">
          <Rows />
        </ScrollArea>,
      );
      expect(parts(screen).viewport().props.horizontal).toBe(true);
    });

    it("nests a horizontal scroll view in a vertical one for orientation=both", async () => {
      const screen = await draw(
        <ScrollArea testID="sa" orientation="both">
          <Rows />
        </ScrollArea>,
      );
      const { viewport, viewportX } = parts(screen);
      expect(viewport().props.horizontal).toBeFalsy();
      expect(viewportX().props.horizontal).toBe(true);
      expect(screen.getByText("Row 0")).toBeTruthy();
    });

    it("sizes the outer view from width, height, maxHeight and style", async () => {
      const screen = await draw(
        <ScrollArea
          testID="sa"
          width={200}
          height={120}
          maxHeight={300}
          style={{ borderRadius: 4 }}
        />,
      );
      expect(style(parts(screen).root())).toMatchObject({
        width: 200,
        height: 120,
        maxHeight: 300,
        borderRadius: 4,
      });
    });

    it("gives the content container the contentContainerStyle", async () => {
      const screen = await draw(
        <ScrollArea testID="sa" contentContainerStyle={{ padding: 7 }} />,
      );
      expect(parts(screen).viewport().props.contentContainerStyle).toEqual({
        padding: 7,
      });
    });

    it("passes other ScrollView props on to the scroll view", async () => {
      const screen = await draw(
        <ScrollArea
          testID="sa"
          keyboardShouldPersistTaps="handled"
          bounces={false}
        />,
      );
      const viewport = parts(screen).viewport();
      expect(viewport.props.keyboardShouldPersistTaps).toBe("handled");
      expect(viewport.props.bounces).toBe(false);
    });

    it("reports a throttled scroll so the thumb can follow", async () => {
      const screen = await draw(<ScrollArea testID="sa" />);
      expect(parts(screen).viewport().props.scrollEventThrottle).toBe(16);
    });

    it("hands the scroll view out through ref", async () => {
      const ref = createRef<ScrollView>();
      await draw(<ScrollArea ref={ref} testID="sa" />);
      expect(ref.current).toBeTruthy();
      expect(typeof ref.current?.scrollTo).toBe("function");
    });

    it("accepts a callback ref, called with the node and then with null", async () => {
      const ref = jest.fn();
      const screen = await draw(<ScrollArea ref={ref} testID="sa" />);
      expect(ref).toHaveBeenCalledWith(expect.anything());
      await screen.unmount();
      expect(ref).toHaveBeenLastCalledWith(null);
    });

    it("points the ref at the horizontal view for orientation=horizontal, the vertical one for both", async () => {
      const horizontal = createRef<ScrollView>();
      const both = createRef<ScrollView>();
      await draw(
        <>
          <ScrollArea ref={horizontal} orientation="horizontal" />
          <ScrollArea ref={both} orientation="both" />
        </>,
      );
      expect(horizontal.current).toBeTruthy();
      expect(both.current).toBeTruthy();
      expect(horizontal.current).not.toBe(both.current);
    });

    it("forwards onLayout and onContentSizeChange", async () => {
      const onLayout = jest.fn();
      const onContentSizeChange = jest.fn();
      const screen = await draw(
        <ScrollArea
          testID="sa"
          onLayout={onLayout}
          onContentSizeChange={onContentSizeChange}
        />,
      );
      await layOut(
        parts(screen).viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 900 },
      );
      expect(onLayout).toHaveBeenCalledTimes(1);
      expect(onContentSizeChange).toHaveBeenCalledWith(300, 900);
    });

    it("forwards onScroll with the platform's own event", async () => {
      const onScroll = jest.fn();
      const screen = await draw(<ScrollArea testID="sa" onScroll={onScroll} />);
      const event = { nativeEvent: { contentOffset: { x: 0, y: 25 } } };
      await fireEvent.scroll(parts(screen).viewport(), event);
      expect(onScroll).toHaveBeenCalledTimes(1);
      const received = onScroll.mock.calls[0][0];
      expect(received.nativeEvent.contentOffset).toEqual({ x: 0, y: 25 });
      // The platform's event itself, not one made up.
      expect(typeof received.persist).toBe("function");
    });
  });

  describe("the thumb", () => {
    it("is sized by the visible share of the content and placed by the offset", async () => {
      const screen = await draw(<ScrollArea testID="sa" />);
      const { viewport, thumb } = parts(screen);
      await overflowVertically(screen);
      expect(style(thumb()!)).toMatchObject({
        height: 100,
        transform: [{ translateY: 0 }],
      });

      await scrollTo(viewport(), 0, 600);
      expect(style(thumb()!).transform).toEqual([{ translateY: 150 }]);

      await scrollTo(viewport(), 0, 1200);
      expect(style(thumb()!).transform).toEqual([{ translateY: 300 }]);
    });

    it("stays on the track when the scroll overshoots", async () => {
      const screen = await draw(<ScrollArea testID="sa" />);
      await overflowVertically(screen);
      await scrollTo(parts(screen).viewport(), 0, -60);
      expect(style(parts(screen).thumb()!).transform).toEqual([
        { translateY: 0 },
      ]);
      await scrollTo(parts(screen).viewport(), 0, 1400);
      expect(style(parts(screen).thumb()!).transform).toEqual([
        { translateY: 300 },
      ]);
    });

    it("follows the content as it grows", async () => {
      const screen = await draw(<ScrollArea testID="sa" />);
      await overflowVertically(screen);
      await layOut(
        parts(screen).viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 800 },
      );
      expect(style(parts(screen).thumb()!).height).toBe(200);
    });

    it("keeps a thumb you can grab on very long content", async () => {
      const screen = await draw(<ScrollArea testID="sa" />);
      await layOut(
        parts(screen).viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 400_000 },
      );
      expect(style(parts(screen).thumb()!).height).toBe(24);
    });

    it("is round, themed and as thick as the scrollbar less its inset", async () => {
      const screen = await draw(<ScrollArea testID="sa" />);
      await overflowVertically(screen);
      expect(style(parts(screen).thumb()!)).toMatchObject({
        width: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.outline,
      });
      expect(style(parts(screen).bar()!)).toMatchObject({ width: 10 });
    });

    it("takes its thickness from scrollbarSize", async () => {
      const screen = await draw(<ScrollArea testID="sa" scrollbarSize={16} />);
      await overflowVertically(screen);
      expect(style(parts(screen).bar()!).width).toBe(16);
      expect(style(parts(screen).thumb()!)).toMatchObject({
        width: 12,
        borderRadius: 6,
      });
    });

    it("merges slotStyles over its own", async () => {
      const screen = await draw(
        <ScrollArea
          testID="sa"
          slotStyles={{
            track: { backgroundColor: "#111111" },
            thumb: { backgroundColor: "#ff0000" },
          }}
        />,
      );
      await overflowVertically(screen);
      expect(style(parts(screen).bar()!).backgroundColor).toBe("#111111");
      expect(style(parts(screen).thumb()!).backgroundColor).toBe("#ff0000");
    });

    it("runs along the bottom for a horizontal area", async () => {
      const screen = await draw(
        <ScrollArea testID="sa" orientation="horizontal" />,
      );
      await layOut(
        parts(screen).viewport(),
        { width: 400, height: 100 },
        { width: 1600, height: 100 },
      );
      expect(parts(screen).bar("vertical")).toBeNull();
      expect(style(parts(screen).bar("horizontal")!)).toMatchObject({
        left: 0,
        bottom: 0,
        right: 0,
        height: 10,
      });
      expect(style(parts(screen).thumb("horizontal")!)).toMatchObject({
        width: 100,
        height: 6,
        transform: [{ translateX: 0 }],
      });
      await scrollTo(parts(screen).viewport(), 600, 0);
      expect(style(parts(screen).thumb("horizontal")!).transform).toEqual([
        { translateX: 150 },
      ]);
    });
  });

  describe("type", () => {
    const visible = (screen: Screen) =>
      style(parts(screen).bar()!).pointerEvents === "auto";

    it("auto: no scrollbar until the content overflows, then one that stays", async () => {
      const screen = await draw(<ScrollArea testID="sa" />);
      expect(parts(screen).bar()).toBeNull();
      await layOut(
        parts(screen).viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 300 },
      );
      expect(parts(screen).bar()).toBeNull();
      await overflowVertically(screen);
      expect(visible(screen)).toBe(true);
      await scrollTo(parts(screen).viewport(), 0, 100);
      expect(visible(screen)).toBe(true);
    });

    it("auto: a 1dp rounding difference is not overflow", async () => {
      const screen = await draw(<ScrollArea testID="sa" />);
      await layOut(
        parts(screen).viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 401 },
      );
      expect(parts(screen).bar()).toBeNull();
    });

    it("auto: the scrollbar goes when the content shrinks to fit", async () => {
      const screen = await draw(<ScrollArea testID="sa" />);
      await overflowVertically(screen);
      expect(parts(screen).bar()).not.toBeNull();
      await layOut(
        parts(screen).viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 200 },
      );
      expect(parts(screen).bar()).toBeNull();
    });

    it("always: shown even with nothing to scroll, the thumb filling the track", async () => {
      const screen = await draw(<ScrollArea testID="sa" type="always" />);
      await layOut(
        parts(screen).viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 200 },
      );
      expect(visible(screen)).toBe(true);
      expect(style(parts(screen).thumb()!).height).toBe(400);
    });

    it("always: dragging a thumb with nothing to scroll does nothing", async () => {
      const ref = createRef<ScrollView>();
      const screen = await draw(
        <ScrollArea ref={ref} testID="sa" type="always" />,
      );
      const scroll = spyOnScrollTo(ref);
      await layOut(
        parts(screen).viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 200 },
      );
      const thumb = parts(screen).thumb()!;
      await fireEvent(thumb, "responderGrant", { nativeEvent: { pageY: 10 } });
      await fireEvent(thumb, "responderMove", { nativeEvent: { pageY: 90 } });
      expect(scroll).toHaveBeenLastCalledWith({ y: 0, animated: false });
    });

    describe("scroll", () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      it("is hidden at rest, shows while scrolling and hides scrollHideDelay after", async () => {
        const screen = await draw(
          <ScrollArea testID="sa" type="scroll" scrollHideDelay={500} />,
        );
        await overflowVertically(screen);
        expect(visible(screen)).toBe(false);

        await scrollTo(parts(screen).viewport(), 0, 50);
        expect(visible(screen)).toBe(true);

        await act(async () => {
          jest.advanceTimersByTime(499);
        });
        expect(visible(screen)).toBe(true);
        await act(async () => {
          jest.advanceTimersByTime(2);
        });
        expect(visible(screen)).toBe(false);
      });

      it("restarts the delay on every scroll", async () => {
        const screen = await draw(
          <ScrollArea testID="sa" type="scroll" scrollHideDelay={500} />,
        );
        await overflowVertically(screen);
        await scrollTo(parts(screen).viewport(), 0, 50);
        await act(async () => {
          jest.advanceTimersByTime(400);
        });
        await scrollTo(parts(screen).viewport(), 0, 80);
        await act(async () => {
          jest.advanceTimersByTime(400);
        });
        expect(visible(screen)).toBe(true);
        await act(async () => {
          jest.advanceTimersByTime(200);
        });
        expect(visible(screen)).toBe(false);
      });

      it("defaults to a 600 ms delay", async () => {
        const screen = await draw(<ScrollArea testID="sa" type="scroll" />);
        await overflowVertically(screen);
        await scrollTo(parts(screen).viewport(), 0, 50);
        await act(async () => {
          jest.advanceTimersByTime(599);
        });
        expect(visible(screen)).toBe(true);
        await act(async () => {
          jest.advanceTimersByTime(2);
        });
        expect(visible(screen)).toBe(false);
      });

      it("never shows without overflow", async () => {
        const screen = await draw(<ScrollArea testID="sa" type="scroll" />);
        await layOut(
          parts(screen).viewport(),
          { width: 300, height: 400 },
          { width: 300, height: 300 },
        );
        await scrollTo(parts(screen).viewport(), 0, 10);
        expect(parts(screen).bar()).toBeNull();
      });

      it("stays while the thumb is being dragged, and for the delay after", async () => {
        const screen = await draw(
          <ScrollArea testID="sa" type="scroll" scrollHideDelay={500} />,
        );
        await overflowVertically(screen);
        const thumb = parts(screen).thumb()!;
        await fireEvent(thumb, "responderGrant", {
          nativeEvent: { pageY: 10 },
        });
        await act(async () => {
          jest.advanceTimersByTime(5000);
        });
        expect(visible(screen)).toBe(true);
        await fireEvent(thumb, "responderRelease");
        await act(async () => {
          jest.advanceTimersByTime(501);
        });
        expect(visible(screen)).toBe(false);
      });

      it("does not hold the scrollbar open when it is unmounted mid-drag", async () => {
        const screen = await draw(
          <ScrollArea testID="sa" type="scroll" scrollHideDelay={500} />,
        );
        await overflowVertically(screen);
        await fireEvent(parts(screen).thumb()!, "responderGrant", {
          nativeEvent: { pageY: 10 },
        });
        // The content shrinks to fit: the scrollbar unmounts with the drag open.
        await layOut(
          parts(screen).viewport(),
          { width: 300, height: 400 },
          { width: 300, height: 200 },
        );
        expect(parts(screen).bar()).toBeNull();
        await act(async () => {
          jest.advanceTimersByTime(600);
        });
        await overflowVertically(screen);
        expect(visible(screen)).toBe(false);
      });
    });

    describe("hover", () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      it("on web shows while the pointer is over the area, and hides after the delay", async () => {
        jest.replaceProperty(Platform, "OS", "web");
        const screen = await draw(
          <ScrollArea testID="sa" type="hover" scrollHideDelay={300} />,
        );
        await overflowVertically(screen);
        expect(visible(screen)).toBe(false);

        await fireEvent(parts(screen).root(), "pointerEnter");
        expect(visible(screen)).toBe(true);
        await act(async () => {
          jest.advanceTimersByTime(10_000);
        });
        expect(visible(screen)).toBe(true);

        await fireEvent(parts(screen).root(), "pointerLeave");
        await act(async () => {
          jest.advanceTimersByTime(299);
        });
        expect(visible(screen)).toBe(true);
        await act(async () => {
          jest.advanceTimersByTime(2);
        });
        expect(visible(screen)).toBe(false);
      });

      it("on web also shows while scrolling, with the pointer elsewhere", async () => {
        jest.replaceProperty(Platform, "OS", "web");
        const screen = await draw(
          <ScrollArea testID="sa" type="hover" scrollHideDelay={300} />,
        );
        await overflowVertically(screen);
        await scrollTo(parts(screen).viewport(), 0, 20);
        expect(visible(screen)).toBe(true);
        await act(async () => {
          jest.advanceTimersByTime(301);
        });
        expect(visible(screen)).toBe(false);
      });

      it("on native has no hover: it behaves like scroll", async () => {
        const screen = await draw(
          <ScrollArea testID="sa" type="hover" scrollHideDelay={300} />,
        );
        expect(parts(screen).root().props.onPointerEnter).toBeUndefined();
        await overflowVertically(screen);
        expect(visible(screen)).toBe(false);
        await scrollTo(parts(screen).viewport(), 0, 20);
        expect(visible(screen)).toBe(true);
        await act(async () => {
          jest.advanceTimersByTime(301);
        });
        expect(visible(screen)).toBe(false);
      });

      it("only hover listens to the pointer over the area", async () => {
        jest.replaceProperty(Platform, "OS", "web");
        const screen = await draw(<ScrollArea testID="sa" type="scroll" />);
        expect(parts(screen).root().props.onPointerEnter).toBeUndefined();
      });
    });

    it("a visible scrollbar stays while the pointer is on it (web)", async () => {
      jest.useFakeTimers();
      jest.replaceProperty(Platform, "OS", "web");
      const screen = await draw(
        <ScrollArea testID="sa" type="scroll" scrollHideDelay={300} />,
      );
      await overflowVertically(screen);
      await scrollTo(parts(screen).viewport(), 0, 20);
      await fireEvent(parts(screen).bar()!, "pointerEnter");
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      expect(visible(screen)).toBe(true);
      await fireEvent(parts(screen).bar()!, "pointerLeave");
      await act(async () => {
        jest.advanceTimersByTime(301);
      });
      expect(visible(screen)).toBe(false);
    });

    it("lights the track and thumb under the pointer (web)", async () => {
      jest.replaceProperty(Platform, "OS", "web");
      const screen = await draw(<ScrollArea testID="sa" />);
      await overflowVertically(screen);
      expect(style(parts(screen).bar()!).backgroundColor).toBe("transparent");
      await fireEvent(parts(screen).bar()!, "pointerEnter");
      expect(style(parts(screen).bar()!).backgroundColor).toBe(
        theme.colors.surfaceContainerHigh,
      );
      expect(style(parts(screen).thumb()!).backgroundColor).toBe(
        theme.colors.onSurfaceVariant,
      );
      await fireEvent(parts(screen).bar()!, "pointerLeave");
      expect(style(parts(screen).thumb()!).backgroundColor).toBe(
        theme.colors.outline,
      );
    });
  });

  describe("fading", () => {
    const fades = (timing: jest.SpyInstance) =>
      timing.mock.calls.map(([, c]) => [c.toValue, c.duration]);

    it("fades in over 120ms and out over 240ms", async () => {
      jest.useFakeTimers();
      const timing = jest.spyOn(Animated, "timing");
      const screen = await draw(
        <ScrollArea testID="sa" type="scroll" scrollHideDelay={100} />,
      );
      await overflowVertically(screen);
      // Mounted hidden: the first animation holds it at 0.
      expect(fades(timing).at(-1)).toEqual([0, 240]);
      await scrollTo(parts(screen).viewport(), 0, 20);
      expect(fades(timing).at(-1)).toEqual([1, 120]);
      await act(async () => {
        jest.advanceTimersByTime(101);
      });
      expect(fades(timing).at(-1)).toEqual([0, 240]);
    });

    it("starts at full opacity when it mounts visible", async () => {
      const screen = await draw(<ScrollArea testID="sa" type="always" />);
      expect(style(parts(screen).bar()!).opacity).toBe(1);
    });

    it("does not animate with reduced motion", async () => {
      mockReduceMotion = true;
      const timing = jest.spyOn(Animated, "timing");
      const screen = await draw(<ScrollArea testID="sa" type="scroll" />);
      await overflowVertically(screen);
      await scrollTo(parts(screen).viewport(), 0, 20);
      expect(timing).toHaveBeenCalled();
      expect(timing.mock.calls.every(([, c]) => c.duration === 0)).toBe(true);
    });

    it("never takes presses while hidden", async () => {
      const screen = await draw(<ScrollArea testID="sa" type="scroll" />);
      await overflowVertically(screen);
      expect(style(parts(screen).bar()!).pointerEvents).toBe("none");
    });
  });

  describe("accessibility", () => {
    it("hides the drawn scrollbar from assistive technology: the scroll view is the control", async () => {
      const screen = await draw(<ScrollArea testID="sa" />);
      await overflowVertically(screen);
      const bar = parts(screen).bar()!;
      expect(bar.props["aria-hidden"]).toBe(true);
      expect(screen.queryByTestId("sa-scrollbar-vertical")).toBeNull();
      expect(bar.props.accessibilityRole).toBeUndefined();
      expect(bar.props.role).toBeUndefined();
    });

    it("leaves the content reachable", async () => {
      const screen = await draw(
        <ScrollArea testID="sa">
          <Text>Reachable</Text>
        </ScrollArea>,
      );
      await overflowVertically(screen);
      expect(screen.getByText("Reachable")).toBeTruthy();
    });
  });

  describe("dragging the thumb on touch", () => {
    const setup = async (
      props: Partial<React.ComponentProps<typeof ScrollArea>> = {},
    ) => {
      const ref = createRef<ScrollView>();
      const screen = await draw(
        <ScrollArea ref={ref} testID="sa" {...props} />,
      );
      const scroll = spyOnScrollTo(ref);
      await overflowVertically(screen);
      return { screen, scroll, thumb: () => parts(screen).thumb()! };
    };
    const at = (pageY: number) => ({ nativeEvent: { pageY } });

    it("scrolls four dp of content per dp of thumb travel, instantly", async () => {
      const { scroll, thumb } = await setup();
      await fireEvent(thumb(), "responderGrant", at(100));
      await fireEvent(thumb(), "responderMove", at(140));
      expect(scroll).toHaveBeenLastCalledWith({ y: 160, animated: false });
      await fireEvent(thumb(), "responderMove", at(175));
      expect(scroll).toHaveBeenLastCalledWith({ y: 300, animated: false });
    });

    it("counts from the offset the drag began at", async () => {
      const { screen, scroll, thumb } = await setup();
      await scrollTo(parts(screen).viewport(), 0, 600);
      await fireEvent(thumb(), "responderGrant", at(200));
      await fireEvent(thumb(), "responderMove", at(230));
      expect(scroll).toHaveBeenLastCalledWith({ y: 720, animated: false });
    });

    it("clamps at both ends of the content", async () => {
      const { scroll, thumb } = await setup();
      await fireEvent(thumb(), "responderGrant", at(100));
      await fireEvent(thumb(), "responderMove", at(-500));
      expect(scroll).toHaveBeenLastCalledWith({ y: 0, animated: false });
      await fireEvent(thumb(), "responderMove", at(5000));
      expect(scroll).toHaveBeenLastCalledWith({ y: 1200, animated: false });
    });

    it("follows the content growing under the drag", async () => {
      const { screen, scroll, thumb } = await setup();
      await fireEvent(thumb(), "responderGrant", at(100));
      // 3200 dp of content: a 50 dp thumb, 350 dp of travel, eight dp per dp.
      await layOut(
        parts(screen).viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 3200 },
      );
      await fireEvent(thumb(), "responderMove", at(110));
      expect(scroll).toHaveBeenLastCalledWith({ y: 80, animated: false });
    });

    it("stops scrolling when released or terminated", async () => {
      const { scroll, thumb } = await setup();
      await fireEvent(thumb(), "responderGrant", at(100));
      await fireEvent(thumb(), "responderRelease", at(100));
      scroll.mockClear();
      await fireEvent(thumb(), "responderMove", at(150));
      expect(scroll).not.toHaveBeenCalled();

      await fireEvent(thumb(), "responderGrant", at(100));
      await fireEvent(thumb(), "responderTerminate", at(100));
      await fireEvent(thumb(), "responderMove", at(150));
      expect(scroll).not.toHaveBeenCalled();
    });

    it("ignores a move that has no grant", async () => {
      const { scroll, thumb } = await setup();
      await fireEvent(thumb(), "responderMove", at(150));
      expect(scroll).not.toHaveBeenCalled();
    });

    it("does not give the gesture up to another responder", async () => {
      const { thumb } = await setup();
      expect(thumb().props.onStartShouldSetResponder()).toBe(true);
      expect(thumb().props.onResponderTerminationRequest()).toBe(false);
    });

    it("lights the thumb while it is dragged", async () => {
      const { thumb } = await setup();
      await fireEvent(thumb(), "responderGrant", at(100));
      expect(style(thumb()).backgroundColor).toBe(
        theme.colors.onSurfaceVariant,
      );
      await fireEvent(thumb(), "responderRelease");
      expect(style(thumb()).backgroundColor).toBe(theme.colors.outline);
    });

    it("drags the horizontal thumb along x", async () => {
      const ref = createRef<ScrollView>();
      const screen = await draw(
        <ScrollArea ref={ref} testID="sa" orientation="horizontal" />,
      );
      const scroll = spyOnScrollTo(ref);
      await layOut(
        parts(screen).viewport(),
        { width: 400, height: 100 },
        { width: 1600, height: 100 },
      );
      const thumb = parts(screen).thumb("horizontal")!;
      await fireEvent(thumb, "responderGrant", { nativeEvent: { pageX: 50 } });
      await fireEvent(thumb, "responderMove", { nativeEvent: { pageX: 75 } });
      expect(scroll).toHaveBeenLastCalledWith({ x: 100, animated: false });
    });
  });

  describe("pressing the track", () => {
    const setup = async (reduce = false) => {
      mockReduceMotion = reduce;
      const ref = createRef<ScrollView>();
      const screen = await draw(<ScrollArea ref={ref} testID="sa" />);
      const scroll = spyOnScrollTo(ref);
      await overflowVertically(screen);
      return { screen, scroll, bar: () => parts(screen).bar()! };
    };
    const press = (locationY: number) => ({ nativeEvent: { locationY } });

    it("pages forward from a press after the thumb", async () => {
      const { scroll, bar } = await setup();
      await fireEvent(bar(), "responderGrant", press(300));
      expect(scroll).toHaveBeenCalledWith({ y: 350, animated: true });
    });

    it("pages back from a press before the thumb", async () => {
      const { screen, scroll, bar } = await setup();
      await scrollTo(parts(screen).viewport(), 0, 600);
      await fireEvent(bar(), "responderGrant", press(10));
      expect(scroll).toHaveBeenCalledWith({ y: 250, animated: true });
    });

    it("does nothing for a press on the thumb", async () => {
      const { screen, scroll, bar } = await setup();
      await scrollTo(parts(screen).viewport(), 0, 600);
      await fireEvent(bar(), "responderGrant", press(200));
      expect(scroll).not.toHaveBeenCalled();
    });

    it("does nothing past the end of the content", async () => {
      const { screen, scroll, bar } = await setup();
      await scrollTo(parts(screen).viewport(), 0, 1200);
      await fireEvent(bar(), "responderGrant", press(399));
      expect(scroll).not.toHaveBeenCalled();
    });

    it("jumps without animation under reduced motion", async () => {
      const { scroll, bar } = await setup(true);
      await fireEvent(bar(), "responderGrant", press(300));
      expect(scroll).toHaveBeenCalledWith({ y: 350, animated: false });
    });

    it("claims the touch", async () => {
      const { bar } = await setup();
      expect(bar().props.onStartShouldSetResponder()).toBe(true);
    });
  });

  describe("on web", () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, "OS", "web");
    });

    const setup = async (
      props: Partial<React.ComponentProps<typeof ScrollArea>> = {},
    ) => {
      const ref = createRef<ScrollView>();
      const screen = await draw(
        <ScrollArea ref={ref} testID="sa" {...props} />,
      );
      const scroll = spyOnScrollTo(ref);
      await overflowVertically(screen);
      return {
        screen,
        scroll,
        thumb: () => parts(screen).thumb()!,
        bar: () => parts(screen).bar()!,
      };
    };
    const pointer = (clientY: number, extra: Record<string, unknown> = {}) => ({
      nativeEvent: { clientY, pointerId: 7, button: 0, ...extra },
      stopPropagation: jest.fn(),
      currentTarget: { setPointerCapture: jest.fn() },
    });

    it("turns the browser's own scrollbar off, inline", async () => {
      const screen = await draw(<ScrollArea testID="sa" orientation="both" />);
      const { viewport, viewportX } = parts(screen);
      expect(style(viewport()).scrollbarWidth).toBe("none");
      expect(style(viewportX()).scrollbarWidth).toBe("none");
      expect(viewport().props.showsVerticalScrollIndicator).toBe(false);
    });

    it("does not touch the browser's scrollbar on native", async () => {
      jest.restoreAllMocks();
      const screen = await draw(<ScrollArea testID="sa" />);
      expect(style(parts(screen).viewport()) ?? {}).not.toHaveProperty(
        "scrollbarWidth",
      );
    });

    it("stops text selection and touch panning on the scrollbar", async () => {
      const { bar, thumb } = await setup();
      expect(style(bar())).toMatchObject({
        userSelect: "none",
        touchAction: "none",
      });
      expect(style(thumb())).toMatchObject({
        userSelect: "none",
        touchAction: "none",
      });
    });

    it("drags the thumb with pointer events, capturing the pointer", async () => {
      const { scroll, thumb } = await setup();
      const down = pointer(100);
      await fireEvent(thumb(), "pointerDown", down);
      expect(down.currentTarget.setPointerCapture).toHaveBeenCalledWith(7);
      await fireEvent(thumb(), "pointerMove", pointer(140));
      expect(scroll).toHaveBeenLastCalledWith({ y: 160, animated: false });
      await fireEvent(thumb(), "pointerMove", pointer(120));
      expect(scroll).toHaveBeenLastCalledWith({ y: 80, animated: false });
    });

    it("keeps the press from reaching the track, which would page", async () => {
      const { thumb } = await setup();
      const down = pointer(100);
      await fireEvent(thumb(), "pointerDown", down);
      expect(down.stopPropagation).toHaveBeenCalled();
    });

    it("ends the drag on pointer up, cancel and lost capture", async () => {
      for (const ending of [
        "pointerUp",
        "pointerCancel",
        "lostPointerCapture",
      ]) {
        const { scroll, thumb } = await setup();
        await fireEvent(thumb(), "pointerDown", pointer(100));
        await fireEvent(thumb(), ending, pointer(100));
        scroll.mockClear();
        await fireEvent(thumb(), "pointerMove", pointer(150));
        expect(scroll).not.toHaveBeenCalled();
      }
    });

    it("ignores a hover over the thumb that is not a drag", async () => {
      const { scroll, thumb } = await setup();
      await fireEvent(thumb(), "pointerMove", pointer(150));
      expect(scroll).not.toHaveBeenCalled();
    });

    it("ignores the secondary buttons, without paging either", async () => {
      const { scroll, thumb } = await setup();
      const down = pointer(100, { button: 2 });
      await fireEvent(thumb(), "pointerDown", down);
      expect(down.currentTarget.setPointerCapture).not.toHaveBeenCalled();
      expect(down.stopPropagation).toHaveBeenCalled();
      await fireEvent(thumb(), "pointerMove", pointer(150));
      expect(scroll).not.toHaveBeenCalled();
    });

    it("pages on a press of the track, forward and back", async () => {
      const { screen, scroll, bar } = await setup();
      await fireEvent(bar(), "pointerDown", {
        nativeEvent: { offsetY: 300, button: 0 },
      });
      expect(scroll).toHaveBeenLastCalledWith({ y: 350, animated: true });
      await scrollTo(parts(screen).viewport(), 0, 600);
      await fireEvent(bar(), "pointerDown", {
        nativeEvent: { offsetY: 10, button: 0 },
      });
      expect(scroll).toHaveBeenLastCalledWith({ y: 250, animated: true });
    });

    it("scrolls the area when the wheel turns over the track, which lies over it", async () => {
      const { screen, scroll, bar } = await setup();
      await fireEvent(bar(), "wheel", { nativeEvent: { deltaY: 100 } });
      expect(scroll).toHaveBeenLastCalledWith({ y: 100, animated: false });
      await scrollTo(parts(screen).viewport(), 0, 100);
      // A Firefox mouse wheel reports lines, not pixels.
      await fireEvent(bar(), "wheel", {
        nativeEvent: { deltaY: 3, deltaMode: 1 },
      });
      expect(scroll).toHaveBeenLastCalledWith({ y: 148, animated: false });
      await fireEvent(bar(), "wheel", { nativeEvent: { deltaY: -9999 } });
      expect(scroll).toHaveBeenLastCalledWith({ y: 0, animated: false });
    });

    it("turns a wheel over a horizontal track into a horizontal scroll", async () => {
      const ref = createRef<ScrollView>();
      const screen = await draw(
        <ScrollArea ref={ref} testID="sa" orientation="horizontal" />,
      );
      const scroll = spyOnScrollTo(ref);
      await layOut(
        parts(screen).viewport(),
        { width: 400, height: 100 },
        { width: 1600, height: 100 },
      );
      const bar = parts(screen).bar("horizontal")!;
      await fireEvent(bar, "wheel", { nativeEvent: { deltaX: 40 } });
      expect(scroll).toHaveBeenLastCalledWith({ x: 40, animated: false });
      await fireEvent(bar, "wheel", { nativeEvent: { deltaY: 25 } });
      expect(scroll).toHaveBeenLastCalledWith({ x: 25, animated: false });
    });

    it("does not page on a secondary button", async () => {
      const { scroll, bar } = await setup();
      await fireEvent(bar(), "pointerDown", {
        nativeEvent: { offsetY: 300, button: 2 },
      });
      expect(scroll).not.toHaveBeenCalled();
    });

    it("drags a horizontal thumb along clientX and pages along offsetX", async () => {
      const ref = createRef<ScrollView>();
      const screen = await draw(
        <ScrollArea ref={ref} testID="sa" orientation="horizontal" />,
      );
      const scroll = spyOnScrollTo(ref);
      await layOut(
        parts(screen).viewport(),
        { width: 400, height: 100 },
        { width: 1600, height: 100 },
      );
      const thumb = parts(screen).thumb("horizontal")!;
      await fireEvent(thumb, "pointerDown", {
        nativeEvent: { clientX: 20, pointerId: 1, button: 0 },
        stopPropagation: jest.fn(),
        currentTarget: {},
      });
      await fireEvent(thumb, "pointerMove", { nativeEvent: { clientX: 45 } });
      expect(scroll).toHaveBeenLastCalledWith({ x: 100, animated: false });
      await fireEvent(parts(screen).bar("horizontal")!, "pointerDown", {
        nativeEvent: { offsetX: 350, button: 0 },
      });
      expect(scroll).toHaveBeenLastCalledWith({ x: 350, animated: true });
    });

    it("does not need pointer capture to be there", async () => {
      const { scroll, thumb } = await setup();
      await fireEvent(thumb(), "pointerDown", {
        nativeEvent: { clientY: 100, button: 0 },
        stopPropagation: jest.fn(),
        currentTarget: {},
      });
      await fireEvent(thumb(), "pointerMove", pointer(110));
      expect(scroll).toHaveBeenLastCalledWith({ y: 40, animated: false });
    });

    it("uses no responder events on web", async () => {
      const { bar, thumb } = await setup();
      expect(bar().props.onStartShouldSetResponder).toBeUndefined();
      expect(thumb().props.onResponderGrant).toBeUndefined();
    });

    it("uses no pointer events on native", async () => {
      jest.restoreAllMocks();
      const screen = await draw(<ScrollArea testID="sa" />);
      await overflowVertically(screen);
      expect(parts(screen).thumb()!.props.onPointerDown).toBeUndefined();
      expect(parts(screen).bar()!.props.onPointerEnter).toBeUndefined();
    });
  });

  describe("both orientations", () => {
    const setup = async (
      props: Partial<React.ComponentProps<typeof ScrollArea>> = {},
    ) => {
      const screen = await draw(
        <ScrollArea testID="sa" orientation="both" {...props} />,
      );
      const { viewport, viewportX } = parts(screen);
      await layOut(
        viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 1600 },
      );
      await layOut(
        viewportX(),
        { width: 300, height: 1600 },
        { width: 1200, height: 1600 },
      );
      return screen;
    };

    it("draws both scrollbars, each along its own axis", async () => {
      const screen = await setup();
      const { thumb } = parts(screen);
      // Each track leaves a 10 dp corner for the other: 390 and 290.
      expect(style(thumb("vertical")!).height).toBeCloseTo((400 / 1600) * 390);
      expect(style(thumb("horizontal")!).width).toBeCloseTo((300 / 1200) * 290);
    });

    it("leaves the corner free where the scrollbars meet", async () => {
      const screen = await setup();
      expect(style(parts(screen).bar("vertical")!)).toMatchObject({
        bottom: 10,
        right: 0,
      });
      expect(style(parts(screen).bar("horizontal")!)).toMatchObject({
        right: 10,
        bottom: 0,
      });
    });

    it("gives a lone scrollbar the whole edge", async () => {
      const screen = await draw(<ScrollArea testID="sa" orientation="both" />);
      const { viewport, viewportX, bar } = parts(screen);
      await layOut(
        viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 1600 },
      );
      await layOut(
        viewportX(),
        { width: 300, height: 1600 },
        { width: 300, height: 1600 },
      );
      expect(bar("horizontal")).toBeNull();
      expect(style(bar("vertical")!).bottom).toBe(0);
    });

    it("follows each scroll view's own offset", async () => {
      const screen = await setup();
      const { viewport, viewportX, thumb } = parts(screen);
      await scrollTo(viewport(), 0, 600);
      expect(style(thumb("vertical")!).transform[0].translateY).toBeGreaterThan(
        0,
      );
      expect(style(thumb("horizontal")!).transform[0].translateX).toBe(0);
      await scrollTo(viewportX(), 450, 0);
      expect(
        style(thumb("horizontal")!).transform[0].translateX,
      ).toBeGreaterThan(0);
    });

    it("scrolls each axis through its own scroll view", async () => {
      const vertical = createRef<ScrollView>();
      const screen = await draw(
        <ScrollArea ref={vertical} testID="sa" orientation="both" />,
      );
      const scrollY = spyOnScrollTo(vertical);
      const { viewport, viewportX } = parts(screen);
      await layOut(
        viewport(),
        { width: 300, height: 400 },
        { width: 300, height: 1600 },
      );
      await layOut(
        viewportX(),
        { width: 300, height: 1600 },
        { width: 1200, height: 1600 },
      );
      await fireEvent(parts(screen).thumb("vertical")!, "responderGrant", {
        nativeEvent: { pageY: 0 },
      });
      await fireEvent(parts(screen).thumb("vertical")!, "responderMove", {
        nativeEvent: { pageY: 10 },
      });
      expect(scrollY).toHaveBeenCalledWith(
        expect.objectContaining({ y: expect.any(Number), animated: false }),
      );
      expect(scrollY).not.toHaveBeenCalledWith(
        expect.objectContaining({ x: expect.anything() }),
      );
    });

    it("reports both axes in one onScroll event", async () => {
      const onScroll = jest.fn();
      const screen = await setup({ onScroll });
      const { viewport, viewportX } = parts(screen);
      await scrollTo(viewport(), 0, 600);
      await scrollTo(viewportX(), 450, 0);
      const { nativeEvent } = onScroll.mock.calls.at(-1)![0];
      expect(nativeEvent.contentOffset).toEqual({ x: 450, y: 600 });
      expect(nativeEvent.contentSize).toEqual({ width: 1200, height: 1600 });
      expect(nativeEvent.layoutMeasurement).toEqual({
        width: 300,
        height: 400,
      });
    });

    it("hands contentContainerStyle to the view that holds the children", async () => {
      const screen = await setup({ contentContainerStyle: { padding: 5 } });
      expect(parts(screen).viewportX().props.contentContainerStyle).toEqual({
        padding: 5,
      });
      expect(
        parts(screen).viewport().props.contentContainerStyle,
      ).toBeUndefined();
    });
  });
});
