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
});
