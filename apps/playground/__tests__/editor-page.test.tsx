import React from "react";
import { ScrollView, View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";
import { router } from "expo-router";

import LayoutEditorPage from "../app/templates/editor";
import Templates from "../app/templates";
import detail from "../editor/starters/detail.json";
import { checkDocument } from "../editor/check";
import type { LayoutDocument } from "../editor/document";

// No navigator is mounted in a test: the router is a spy and Link renders what it wraps.
jest.mock("expo-router", () => {
  const { Fragment } = jest.requireActual("react");
  return {
    router: { push: jest.fn() },
    Link: ({ children }: { children: React.ReactNode }) => (
      <Fragment>{children}</Fragment>
    ),
  };
});

let mockHydrated = true;
jest.mock("../site/useHydrated", () => ({
  __esModule: true,
  useHydrated: () => mockHydrated,
  default: () => mockHydrated,
}));

const at = (x: number, y: number) => ({ nativeEvent: { pageX: x, pageY: y } });

beforeEach(() => {
  mockHydrated = true;
  for (const component of [View, ScrollView]) {
    jest
      .spyOn(component.prototype as any, "measureInWindow")
      .mockImplementation((cb: any) => cb(0, 0, 0, 0));
  }
});
afterEach(() => jest.restoreAllMocks());

const draw = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1280, height: 900 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );

/** A tap on an edit box: the press the responder system hands it, let go at once. */
const tap = async (testID: string) => {
  const id = testID.replace(/^box-/, "");
  // The Draggable watches the press; the box's tap view takes it.
  screen
    .getByTestId("box-" + id)
    .props.onStartShouldSetResponderCapture(at(10, 10));
  const view = screen.getByTestId("tap-" + id);
  expect(view.props.onStartShouldSetResponder(at(10, 10))).toBe(true);
  await fireEvent(view, "responderGrant", at(10, 10));
  await fireEvent(view, "responderRelease", at(10, 10));
};

describe("the layout editor page", () => {
  it("opens the starter on the canvas", async () => {
    await draw(<LayoutEditorPage />);
    expect(screen.getByText("Pagina di dettaglio")).toBeTruthy();
    expect(screen.getByText("RSSMRA80A01H501U")).toBeTruthy();
    expect(screen.getByTestId("zone-page")).toBeTruthy();
  });

  it("renders nothing editable before hydration", async () => {
    mockHydrated = false;
    await draw(<LayoutEditorPage />);
    expect(screen.queryByTestId("zone-page")).toBeNull();
  });

  it("undoes and redoes from the toolbar", async () => {
    await draw(<LayoutEditorPage />);
    await tap("box-n1");
    await fireEvent.press(screen.getByLabelText("Delete"));
    expect(screen.queryByTestId("frame-n1")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Undo"));
    expect(screen.getByTestId("frame-n1")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Redo"));
    expect(screen.queryByTestId("frame-n1")).toBeNull();
  });

  it("starts with nothing to undo or redo", async () => {
    await draw(<LayoutEditorPage />);
    expect(
      screen.getByLabelText("Undo").props.accessibilityState?.disabled,
    ).toBe(true);
    expect(
      screen.getByLabelText("Redo").props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it("opens a sound starter", () => {
    expect(checkDocument(detail as LayoutDocument)).toEqual([]);
  });

  it("is linked from the templates gallery", async () => {
    await draw(<Templates />);
    await fireEvent.press(screen.getByText("New layout"));
    expect(router.push).toHaveBeenCalledWith("/templates/editor");
  });
});
