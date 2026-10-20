import React from "react";
import { StyleSheet, Text } from "react-native";
import { render } from "@testing-library/react-native";
import {
  CircularProgress,
  LinearProgress,
  ThemeProvider,
  type LinearProgressLabelPosition,
} from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const json = async (ui: React.ReactElement) =>
  JSON.stringify((await draw(ui)).toJSON());

const circles = (out: string) =>
  out.match(/"type":"RNSVGCircle"/g)?.length ?? 0;

describe("CircularProgress label", () => {
  it("draws the label inside the ring by default, and nothing extra without one", async () => {
    const inside = await json(<CircularProgress progress={0.5} label="50%" />);
    expect(inside).toContain("50%");
    // Over the ring, not beside it: a layer that fills the ring's box.
    expect(inside).toContain('"pointerEvents":"none"');
    const bare = await json(<CircularProgress progress={0.5} />);
    expect(bare).not.toContain('"pointerEvents":"none"');
    expect(bare).not.toContain('"type":"Text"');
  });

  it("draws a node label as given, and a number as text", async () => {
    const { getByTestId, getByText } = await draw(
      <>
        <CircularProgress progress={0.2} label={42} />
        <CircularProgress
          progress={0.2}
          label={<Marker />}
          labelPosition="bottom"
        />
      </>,
    );
    expect(getByText("42")).toBeTruthy();
    expect(getByTestId("marker")).toBeTruthy();
  });

  it.each([
    ["top", "column", true],
    ["bottom", "column", false],
    ["left", "row", true],
    ["right", "row", false],
  ] as const)(
    "puts the label at %s of the ring",
    async (labelPosition, direction, before) => {
      const out = await json(
        <CircularProgress
          progress={0.5}
          label="Upload"
          labelPosition={labelPosition}
        />,
      );
      expect(out).toContain(`"flexDirection":"${direction}"`);
      const label = out.indexOf("Upload");
      const ring = out.indexOf('"progressbar"');
      expect(label).toBeGreaterThan(-1);
      expect(label < ring).toBe(before);
    },
  );

  it("puts a spinner's label to its right unless told otherwise", async () => {
    const out = await json(<CircularProgress label="Loading data" size={20} />);
    expect(out).toContain('"flexDirection":"row"');
    expect(out.indexOf('"progressbar"')).toBeLessThan(
      out.indexOf("Loading data"),
    );
    const inside = await json(
      <CircularProgress label="Wait" labelPosition="center" size={20} />,
    );
    expect(inside).toContain('"pointerEvents":"none"');
  });
});

describe("CircularProgress trackColor", () => {
  it("keeps a ring's usual track and a spinner's none when left out", async () => {
    expect(circles(await json(<CircularProgress progress={0.3} />))).toBe(2);
    expect(circles(await json(<CircularProgress />))).toBe(1);
  });

  it("draws none for false, even on a ring", async () => {
    expect(
      circles(
        await json(<CircularProgress progress={0.3} trackColor={false} />),
      ),
    ).toBe(1);
  });

  it("true draws the track in the indicator's colour at a low opacity", async () => {
    const out = await json(
      <CircularProgress progress={0.3} trackColor color="#B00020" />,
    );
    expect(circles(out)).toBe(2);
    expect(out).toContain('"strokeOpacity":0.24');
    // A spinner gets a track too, under its arc.
    const spinner = await json(<CircularProgress trackColor />);
    expect(circles(spinner)).toBe(2);
    expect(spinner).toContain('"strokeOpacity":0.24');
  });

  it("a string draws the track in that colour, fully opaque", async () => {
    const withTrack = await json(
      <CircularProgress progress={0.3} trackColor="#00FF00" />,
    );
    const without = await json(<CircularProgress progress={0.3} />);
    expect(withTrack).not.toContain('"strokeOpacity":0.24');
    expect(withTrack).not.toBe(without);
    expect(circles(withTrack)).toBe(2);
  });
});

const Marker = () => <Text testID="marker">node</Text>;

describe("LinearProgress label and width", () => {
  // The bar's fill runs on timers; none of them should fire between tests.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const positions: LinearProgressLabelPosition[] = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
    "left",
    "right",
  ];

  it.each(positions)("puts the label at %s of the bar", async (position) => {
    const out = await json(
      <LinearProgress progress={0.4} label="40%" labelPosition={position} />,
    );
    const label = out.indexOf("40%");
    const bar = out.indexOf('"progressbar"');
    expect(label).toBeGreaterThan(-1);
    const before = position === "left" || position.startsWith("top");
    expect(label < bar).toBe(before);
    const side = position === "left" || position === "right";
    expect(out).toContain(side ? '"flexDirection":"row"' : '"gap":4');
    if (position.endsWith("center"))
      expect(out).toContain('"alignSelf":"center"');
    if (position.endsWith("-right"))
      expect(out).toContain('"alignSelf":"flex-end"');
    if (position.endsWith("-left")) expect(out).not.toContain('"alignSelf"');
  });

  it("defaults the label to the right", async () => {
    const out = await json(<LinearProgress progress={0.4} label="40%" />);
    expect(out.indexOf('"progressbar"')).toBeLessThan(out.indexOf("40%"));
    expect(out).toContain('"flexDirection":"row"');
  });

  it("draws a label inside the bar twice, once per background, on a taller bar", async () => {
    const { getAllByText, toJSON } = await draw(
      <LinearProgress progress={0.4} label="40%" labelPosition="inside" />,
    );
    // One copy over the track, one clipped to the filled part.
    expect(getAllByText("40%")).toHaveLength(2);
    expect(JSON.stringify(toJSON())).toContain('"height":20');
    const colours = getAllByText("40%").map(
      (node) => StyleSheet.flatten(node.props.style).color,
    );
    expect(colours[0]).not.toBe(colours[1]);
  });

  it("keeps an explicit height for an inside label, and draws a node label once", async () => {
    const out = await json(
      <LinearProgress
        progress={0.4}
        label="40%"
        labelPosition="inside"
        height={32}
      />,
    );
    expect(out).toContain('"height":32');
    expect(out).not.toContain('"height":20');
    const node = await draw(
      <LinearProgress
        progress={0.4}
        label={<Marker />}
        labelPosition="inside"
      />,
    );
    expect(node.getAllByTestId("marker")).toHaveLength(1);
  });

  it("an indeterminate bar draws its inside text once", async () => {
    const { getAllByText } = await draw(
      <LinearProgress indeterminate label="Loading" labelPosition="inside" />,
    );
    expect(getAllByText("Loading")).toHaveLength(1);
  });

  it("takes a width, and by default fills the parent", async () => {
    expect(await json(<LinearProgress progress={0.4} width={240} />)).toContain(
      '"width":240',
    );
    expect(await json(<LinearProgress progress={0.4} />)).toContain(
      '"width":"100%"',
    );
    // With a label the width is the whole component's, label included.
    const out = await json(
      <LinearProgress progress={0.4} label="40%" width="50%" />,
    );
    expect(out).toContain('"width":"50%"');
  });

  it("is still a progressbar with its value, labelled or not", async () => {
    const { getByRole } = await draw(
      <LinearProgress progress={0.4} label="40%" labelPosition="top-left" />,
    );
    expect(getByRole("progressbar").props.accessibilityLabel).toBe(
      "Progress: 40%",
    );
  });
});
