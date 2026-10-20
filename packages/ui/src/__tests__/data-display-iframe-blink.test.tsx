import React from "react";
import { Animated, Platform, Text } from "react-native";
import { act, render } from "@testing-library/react-native";
import { Blink, IFrame, ThemeProvider } from "..";

let mockReduceMotion = false;
jest.mock("../components/internal/useReduceMotion", () => ({
  useReduceMotion: () => mockReduceMotion,
}));

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

interface HostNode {
  type: string;
  props: Record<string, any>;
  children: (HostNode | string)[] | null;
}

/** The host nodes of a rendered tree that have this type, in order. */
const hostsOf = (tree: unknown, type: string): HostNode[] => {
  const walk = (node: HostNode | string | null): HostNode[] =>
    !node || typeof node === "string"
      ? []
      : [
          ...(node.type === type ? [node] : []),
          ...(node.children ?? []).flatMap(walk),
        ];
  return ([] as HostNode[]).concat(tree as HostNode).flatMap(walk);
};

afterEach(() => {
  mockReduceMotion = false;
  jest.restoreAllMocks();
});

describe("IFrame", () => {
  it("draws a notice instead of the page on native, and does not crash", async () => {
    const { getByText, getByLabelText, toJSON } = await draw(
      <IFrame src="https://example.com" title="Report" testID="frame" />,
    );
    expect(getByText("Embedded pages are not available here")).toBeTruthy();
    // Still named, so a screen reader says what is missing.
    expect(getByLabelText("Report")).toBeTruthy();
    expect(hostsOf(toJSON(), "iframe")).toHaveLength(0);
  });

  it("draws the fallback it is given on native", async () => {
    const { getByTestId, queryByText } = await draw(
      <IFrame
        src="https://example.com"
        title="Report"
        fallback={<Text testID="mine">Open it in the browser</Text>}
      />,
    );
    expect(getByTestId("mine")).toBeTruthy();
    expect(queryByText("Embedded pages are not available here")).toBeNull();
  });

  it("takes width, height and style on native too", async () => {
    const { toJSON } = await draw(
      <IFrame
        src="https://example.com"
        title="Report"
        width={320}
        height={180}
        style={{ margin: 3 }}
      />,
    );
    const out = JSON.stringify(toJSON());
    expect(out).toContain('"width":320');
    expect(out).toContain('"height":180');
    expect(out).toContain('"margin":3');
  });

  describe("on web", () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, "OS", "web");
    });

    const frameOf = (tree: unknown) => hostsOf(tree, "iframe")[0];

    it("renders a real iframe with its attributes", async () => {
      // Nothing here may need a DOM to render: a server has none.
      expect(typeof document).toBe("undefined");
      const { toJSON, queryByText } = await draw(
        <IFrame
          src="https://example.com/report"
          title="Quarterly report"
          allow="fullscreen"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
        />,
      );
      const frame = frameOf(toJSON());
      expect(frame.props).toMatchObject({
        src: "https://example.com/report",
        title: "Quarterly report",
        allow: "fullscreen",
        sandbox: "allow-scripts",
        referrerPolicy: "no-referrer",
        loading: "lazy",
      });
      expect(queryByText("Embedded pages are not available here")).toBeNull();
    });

    it("loads eagerly on request, and gives the frame the size of its box", async () => {
      const { toJSON } = await draw(
        <IFrame
          src="https://example.com"
          title="Report"
          loading="eager"
          width={400}
          height="50%"
        />,
      );
      expect(frameOf(toJSON()).props.loading).toBe("eager");
      const out = JSON.stringify(toJSON());
      expect(out).toContain('"width":400');
      expect(out).toContain('"height":"50%"');
    });

    it("reports load and error", async () => {
      const onLoad = jest.fn();
      const onError = jest.fn();
      const { toJSON } = await draw(
        <IFrame
          src="https://example.com"
          title="Report"
          onLoad={onLoad}
          onError={onError}
        />,
      );
      const frame = frameOf(toJSON());
      await act(async () => {
        frame.props.onLoad();
        frame.props.onError();
      });
      expect(onLoad).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});

describe("Blink", () => {
  const spyOnLoops = () => {
    const real = Animated.loop;
    const loops: { stop: jest.Mock }[] = [];
    jest.spyOn(Animated, "loop").mockImplementation((animation, config) => {
      const loop = real(animation, config);
      const stop = jest.fn(loop.stop);
      loop.stop = stop;
      loops.push({ stop });
      return loop;
    });
    return loops;
  };

  it("draws its children inside a wrapper at full opacity to start", async () => {
    const { getByText, toJSON } = await draw(
      <Blink>
        <Text>Live</Text>
      </Blink>,
    );
    expect(getByText("Live")).toBeTruthy();
    expect(JSON.stringify(toJSON())).toContain('"opacity":1');
  });

  it("fades between 1 and minOpacity on a loop, a half-cycle per interval", async () => {
    const timing = jest.spyOn(Animated, "timing");
    const loops = spyOnLoops();
    await draw(
      <Blink interval={250} minOpacity={0.5}>
        <Text>Live</Text>
      </Blink>,
    );
    expect(loops).toHaveLength(1);
    expect(timing).toHaveBeenCalledTimes(2);
    expect(timing.mock.calls.map(([, config]) => config.toValue)).toEqual([
      0.5, 1,
    ]);
    expect(timing.mock.calls.every(([, c]) => c.duration === 250)).toBe(true);
    expect(timing.mock.calls.every(([, c]) => c.useNativeDriver)).toBe(true);
  });

  it("defaults to a 600 ms half-cycle down to 0.2", async () => {
    const timing = jest.spyOn(Animated, "timing");
    await draw(
      <Blink>
        <Text>Live</Text>
      </Blink>,
    );
    expect(timing.mock.calls.map(([, c]) => [c.toValue, c.duration])).toEqual([
      [0.2, 600],
      [1, 600],
    ]);
  });

  it("does not animate while inactive, and starts when it becomes active", async () => {
    const timing = jest.spyOn(Animated, "timing");
    const tree = (active: boolean) => (
      <ThemeProvider>
        <Blink active={active}>
          <Text>Live</Text>
        </Blink>
      </ThemeProvider>
    );
    const { rerender } = await render(tree(false));
    expect(timing).not.toHaveBeenCalled();
    await rerender(tree(true));
    expect(timing).toHaveBeenCalledTimes(2);
  });

  it("stays static when the OS asks for reduced motion", async () => {
    mockReduceMotion = true;
    const timing = jest.spyOn(Animated, "timing");
    const { getByText, toJSON } = await draw(
      <Blink>
        <Text>Live</Text>
      </Blink>,
    );
    expect(timing).not.toHaveBeenCalled();
    expect(getByText("Live")).toBeTruthy();
    expect(JSON.stringify(toJSON())).toContain('"opacity":1');
  });

  it("stops its animation when it unmounts", async () => {
    const loops = spyOnLoops();
    const { unmount } = await draw(
      <Blink>
        <Text>Live</Text>
      </Blink>,
    );
    expect(loops[0].stop).not.toHaveBeenCalled();
    await unmount();
    expect(loops[0].stop).toHaveBeenCalled();
  });

  it("takes a style and a testID, and adds nothing else to the layout", async () => {
    const { getByTestId } = await draw(
      <Blink testID="blink" style={{ margin: 5 }}>
        <Text>Live</Text>
      </Blink>,
    );
    const style = JSON.stringify(getByTestId("blink").props.style);
    expect(style).toContain('"margin":5');
    expect(style).not.toContain("flex");
    expect(style).not.toContain("position");
  });
});
