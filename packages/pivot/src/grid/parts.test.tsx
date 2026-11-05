import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  ToggleArrow,
  cellLabel,
  messageText,
  rowColors,
  type ThemeColors,
} from "./parts";

const colors = {
  primaryContainer: "#pc",
  onPrimaryContainer: "#opc",
  surface: "#s",
  onSurface: "#os",
} as unknown as ThemeColors;

describe("rowColors", () => {
  test("a total row takes the container colours, any other the surface ones", () => {
    expect(rowColors({ isTotal: true }, colors)).toEqual({
      background: "#pc",
      color: "#opc",
    });
    expect(rowColors({ isTotal: false }, colors)).toEqual({
      background: "#s",
      color: "#os",
    });
  });
});

describe("cellLabel", () => {
  test("names the error, in the dictionary's words when it has them", () => {
    expect(cellLabel({ error: "boom" }, {})).toBe("Formula error: boom");
    expect(cellLabel({ error: "boom" }, { formulaError: "Err" })).toBe(
      "Err: boom",
    );
  });

  test("a cell without error has no label", () => {
    expect(cellLabel({ error: null }, {})).toBeUndefined();
  });
});

describe("messageText", () => {
  test("loading, empty, and the dictionary's words", () => {
    expect(messageText(true, {})).toBe("Processing…");
    expect(messageText(false, {})).toBe("No data to display");
    expect(messageText(false, { empty: "Vuoto" })).toBe("Vuoto");
    expect(messageText(true, { loading: "Attendere" })).toBe("Attendere");
  });
});

/**
 * A finger down at y 116 on an arrow drawn at y 100, a 2 pt move, then up: the responder events
 * Pressability listens to, with the arrow's measured zone at `measuredY`.
 */
const touchWithAMove = async (
  arrow: Parameters<typeof fireEvent>[0],
  measuredY: number,
) => {
  const target = {
    measure: (
      done: (
        x: number,
        y: number,
        w: number,
        h: number,
        pageX: number,
        pageY: number,
      ) => void,
    ) => done(0, 0, 28, 32, 0, measuredY),
  };
  const touch = (pageY: number) => ({
    currentTarget: target,
    persist: () => {},
    nativeEvent: {
      touches: [],
      changedTouches: [],
      pageX: 14,
      pageY,
      timestamp: 0,
    },
  });
  await fireEvent(arrow, "responderGrant", touch(116));
  await fireEvent(arrow, "responderMove", touch(118));
  await fireEvent(arrow, "responderRelease", touch(118));
};

describe("ToggleArrow", () => {
  const props = {
    size: 28,
    color: "#000",
    collapse: "Collapse",
    expand: "Expand",
  };

  test("a node that cannot toggle draws nothing", async () => {
    const view = await render(
      <ToggleArrow
        {...props}
        item={{ canToggle: false, isExpanded: true, nodeKey: "k" }}
        onToggle={() => {}}
      />,
    );
    expect(view.toJSON()).toBeNull();
  });

  test("an open node offers to collapse, a closed one to expand, and a press toggles it by its key", async () => {
    const onToggle = jest.fn();
    await render(
      <ToggleArrow
        {...props}
        item={{ canToggle: true, isExpanded: true, nodeKey: "k" }}
        onToggle={onToggle}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Collapse"));
    expect(onToggle).toHaveBeenCalledWith("k");
    await render(
      <ToggleArrow
        {...props}
        item={{ canToggle: true, isExpanded: false, nodeKey: "j" }}
        onToggle={onToggle}
      />,
    );
    expect(screen.getByLabelText("Expand")).toBeTruthy();
  });

  test("a press still counts when the arrow was measured far from the finger and the finger moves a little", async () => {
    // On the phone the native animation moves the arrows without telling the JavaScript side, so the
    // zone Pressability measures at the touch is where the arrow was before the scroll: hundreds of
    // points from the finger. With the default 20 pt margin, the first move event (a real finger
    // always moves a little) counted as leaving the arrow and the press was dropped.
    const onToggle = jest.fn();
    await render(
      <ToggleArrow
        {...props}
        item={{ canToggle: true, isExpanded: true, nodeKey: "k" }}
        onToggle={onToggle}
      />,
    );
    const arrow = screen.getByLabelText("Collapse");
    // The arrow is drawn at y 100 but measured at y 600, as after a 500 pt scroll.
    await touchWithAMove(arrow, 600);
    expect(onToggle).toHaveBeenCalledWith("k");
  });

  test("the same touch on an arrow measured where it is drawn counts (the control of the test above)", async () => {
    const onToggle = jest.fn();
    await render(
      <ToggleArrow
        {...props}
        item={{ canToggle: true, isExpanded: true, nodeKey: "k" }}
        onToggle={onToggle}
      />,
    );
    await touchWithAMove(screen.getByLabelText("Collapse"), 100);
    expect(onToggle).toHaveBeenCalledWith("k");
  });
});
