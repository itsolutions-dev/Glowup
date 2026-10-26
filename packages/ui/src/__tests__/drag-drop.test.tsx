import React from "react";
import { Text, View } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import {
  DragDropProvider,
  Draggable,
  Droppable,
  PortalHost,
  ThemeProvider,
  type DragEndEvent,
} from "..";

// The test renderer cannot measure: each view's window rect comes from its testID.
// A list zone at 0..300 × 0..136 holds three 40-high rows with an 8 gap; a
// bin sits to its right; a nested zone lives inside row "c"; two nested
// draggables sit below.
const RECTS: Record<string, [number, number, number, number]> = {
  list: [0, 0, 300, 136],
  a: [0, 0, 300, 40],
  b: [0, 48, 300, 40],
  c: [0, 96, 300, 40],
  inner: [10, 100, 100, 30],
  bin: [400, 0, 100, 100],
  outer: [0, 180, 300, 60],
  nested: [0, 190, 300, 40],
};

beforeEach(() => {
  jest.useFakeTimers();
  jest
    .spyOn(View.prototype as any, "measureInWindow")
    .mockImplementation(function (this: any, cb: any) {
      cb(...(RECTS[this.props?.testID] ?? [0, 0, 0, 0]));
    });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const at = (x: number, y: number) => ({ nativeEvent: { pageX: x, pageY: y } });

const setup = async (
  props: {
    acceptInner?: boolean;
    onPress?: () => void;
    feedback?: jest.Mock;
  } = {},
) => {
  const onDragEnd = jest.fn<void, [DragEndEvent]>();
  const onDragCancel = jest.fn();
  // A PortalHost as in an app: the preview is drawn there, outside the provider.
  const view = await render(
    <ThemeProvider onInteractionFeedback={props.feedback}>
      <PortalHost>
        <DragDropProvider onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
          <Droppable id="list" testID="list">
            {["a", "b", "c"].map((id) => (
              <Draggable
                key={id}
                id={id}
                testID={id}
                data={{ label: id }}
                onPress={props.onPress}
              >
                <Text>{id}</Text>
                {id === "c" && (
                  <Droppable
                    id="inner"
                    testID="inner"
                    accept={() => props.acceptInner ?? true}
                  />
                )}
              </Draggable>
            ))}
          </Droppable>
          <Droppable id="bin" testID="bin" />
          <Draggable id="outer" testID="outer">
            <Draggable id="nested" testID="nested">
              <Text>nested</Text>
            </Draggable>
          </Draggable>
        </DragDropProvider>
      </PortalHost>
    </ThemeProvider>,
  );
  return { view, onDragEnd, onDragCancel };
};

/** A touch that rests to lift the item, moves through `path`, then lets go. */
type Host = ReturnType<
  Awaited<ReturnType<typeof setup>>["view"]["getByTestId"]
>;

/** The responder system's first pass: every ancestor sees the press, outermost first. */
const press = (point: [number, number], ...path: Host[]) =>
  path.map((view) => view.props.onStartShouldSetResponderCapture(at(...point)));

const drag = async (
  item: Host,
  from: [number, number],
  ...path: [number, number][]
) => {
  press(from, item);
  expect(item.props.onStartShouldSetResponder(at(...from))).toBe(true);
  await fireEvent(item, "responderGrant", at(...from));
  await act(async () => {
    jest.advanceTimersByTime(250);
  });
  for (const point of path)
    await fireEvent(item, "responderMove", at(...point));
};

describe("Drag and drop", () => {
  it("reorders: the index leaves the dragged item out", async () => {
    const { view, onDragEnd } = await setup();
    const b = view.getByTestId("b");
    await drag(b, [20, 60], [20, 5]);
    await fireEvent(b, "responderRelease", at(20, 5));
    expect(onDragEnd).toHaveBeenCalledWith({
      active: { id: "b", data: { label: "b" } },
      over: { id: "list", data: undefined, index: 0 },
    });
  });

  it("moves to another zone, and reports null outside every zone", async () => {
    const { view, onDragEnd } = await setup();
    const a = view.getByTestId("a");
    await drag(a, [20, 20], [450, 50]);
    await fireEvent(a, "responderRelease", at(450, 50));
    expect(onDragEnd.mock.calls[0][0].over).toMatchObject({
      id: "bin",
      index: 0,
    });

    await drag(a, [20, 20], [900, 900]);
    await fireEvent(a, "responderRelease", at(900, 900));
    expect(onDragEnd.mock.calls[1][0].over).toBeNull();
  });

  it("drops into the innermost zone, which never takes its own draggable", async () => {
    const { view, onDragEnd } = await setup();
    const a = view.getByTestId("a");
    await drag(a, [20, 20], [50, 110]);
    await fireEvent(a, "responderRelease", at(50, 110));
    expect(onDragEnd.mock.calls[0][0].over?.id).toBe("inner");

    // "inner" sits inside "c": dragging "c" over it lands in the list.
    const c = view.getByTestId("c");
    await drag(c, [20, 110], [50, 110]);
    await fireEvent(c, "responderRelease", at(50, 110));
    expect(onDragEnd.mock.calls[1][0].over?.id).toBe("list");
  });

  it("drags an item that holds a zone, and leaves that zone working", async () => {
    const { view, onDragEnd } = await setup();
    // The preview draws "c" again, its "inner" zone included: that copy
    // neither needs the provider nor replaces the real zone.
    const c = view.getByTestId("c");
    await drag(c, [20, 110], [20, 5]);
    expect(view.getAllByText("c")).toHaveLength(2);
    await fireEvent(c, "responderRelease", at(20, 5));
    expect(view.getAllByText("c")).toHaveLength(1);

    const a = view.getByTestId("a");
    await drag(a, [20, 20], [50, 110]);
    await fireEvent(a, "responderRelease", at(50, 110));
    expect(onDragEnd.mock.calls[1][0].over?.id).toBe("inner");
  });

  it("falls through a zone that does not accept the item", async () => {
    const { view, onDragEnd } = await setup({ acceptInner: false });
    const a = view.getByTestId("a");
    await drag(a, [20, 20], [50, 110]);
    await fireEvent(a, "responderRelease", at(50, 110));
    expect(onDragEnd.mock.calls[0][0].over?.id).toBe("list");
  });

  it("draws the insertion line while over a zone", async () => {
    const { view } = await setup();
    const a = view.getByTestId("a");
    await drag(a, [20, 20], [20, 130]);
    // Over the list after "b" and "c" ("a" left out): the line under "c".
    const list = view.getByTestId("list");
    const line = list.children[list.children.length - 1] as any;
    expect(line.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ top: 135, height: 2, width: 300 }),
      ]),
    );
  });

  it("takes the press over from a pressable child once it rests", async () => {
    const { view, onDragEnd } = await setup();
    const a = view.getByTestId("a");
    // A child (a Card, a row) took the press: the draggable only watched it.
    press([20, 20], a);
    expect(a.props.onMoveShouldSetResponderCapture(at(21, 20))).toBe(false);
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(a.props.onMoveShouldSetResponderCapture(at(22, 20))).toBe(true);
    await fireEvent(a, "responderGrant", at(22, 20));
    await act(async () => {});
    await fireEvent(a, "responderMove", at(450, 50));
    await fireEvent(a, "responderRelease", at(450, 50));
    expect(onDragEnd.mock.calls[0][0]).toMatchObject({
      active: { id: "a" },
      over: { id: "bin" },
    });
  });

  it("leaves a quick swipe over a pressable child alone", async () => {
    const { view } = await setup();
    const a = view.getByTestId("a");
    press([20, 20], a);
    expect(a.props.onMoveShouldSetResponderCapture(at(20, 60))).toBe(false);
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(a.props.onMoveShouldSetResponderCapture(at(20, 61))).toBe(false);
  });

  it("lifts only the innermost draggable under the press", async () => {
    const { view } = await setup();
    const outer = view.getByTestId("outer");
    const nested = view.getByTestId("nested");
    press([20, 200], outer, nested);
    expect(outer.props.onStartShouldSetResponder(at(20, 200))).toBe(false);
    expect(nested.props.onStartShouldSetResponder(at(20, 200))).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(outer.props.onMoveShouldSetResponderCapture(at(30, 200))).toBe(
      false,
    );
  });

  it("a swipe scrolls instead of lifting, a tap presses", async () => {
    const onPress = jest.fn();
    const { view, onDragEnd } = await setup({ onPress });
    const a = view.getByTestId("a");

    press([20, 20], a);
    await fireEvent(a, "responderGrant", at(20, 20));
    await fireEvent(a, "responderMove", at(20, 60));
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    await fireEvent(a, "responderRelease", at(20, 60));
    expect(onDragEnd).not.toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();

    press([20, 20], a);
    await fireEvent(a, "responderGrant", at(20, 20));
    await fireEvent(a, "responderRelease", at(20, 20));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it("cancels when the system takes the touch, and keeps a lifted one", async () => {
    const { view, onDragEnd, onDragCancel } = await setup();
    const a = view.getByTestId("a");
    expect(a.props.onResponderTerminationRequest()).toBe(true);
    await drag(a, [20, 20]);
    expect(a.props.onResponderTerminationRequest()).toBe(false);
    await fireEvent(a, "responderTerminate");
    expect(onDragCancel).toHaveBeenCalledWith({
      active: { id: "a", data: { label: "a" } },
    });
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it("reports a touch lift as a long press", async () => {
    const feedback = jest.fn();
    const { view } = await setup({ feedback });
    await drag(view.getByTestId("a"), [20, 20]);
    expect(feedback).toHaveBeenCalledWith("longPress");
  });

  it("needs a provider", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(async () =>
      render(
        <ThemeProvider>
          <Draggable id="x">
            <Text>x</Text>
          </Draggable>
        </ThemeProvider>,
      ),
    ).rejects.toThrow("Draggable must be inside a DragDropProvider.");
  });
});
