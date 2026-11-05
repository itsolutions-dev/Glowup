import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
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
    // The canvas's own Delete (the Properties column has one too).
    await fireEvent.press(
      within(screen.getByTestId("edit-layer")).getByLabelText("Delete"),
    );
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

  it("switches the canvas width from the toolbar", async () => {
    await draw(<LayoutEditorPage />);
    await fireEvent.press(screen.getByText("360"));
    expect(
      StyleSheet.flatten(screen.getByTestId("canvas-frame").props.style).width,
    ).toBe(360);
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

describe("the export", () => {
  const openExport = async (tab?: string) => {
    await draw(<LayoutEditorPage />);
    await fireEvent.press(screen.getByText("Export"));
    if (tab) await fireEvent.press(screen.getByText(tab));
  };
  const paste = async (text: string) => {
    await fireEvent.changeText(
      screen.getByLabelText("Paste a layout's JSON"),
      text,
    );
    await fireEvent.press(screen.getByText("Import"));
  };

  it("exports the layout's code", async () => {
    await openExport();
    expect(
      screen.getAllByText(/export default function PaginaDiDettaglio()/).length,
    ).toBeGreaterThan(0);
  });

  it("previews the exported code", async () => {
    await openExport("Preview");
    expect(
      within(screen.getByTestId("export-preview")).getByText(
        "RSSMRA80A01H501U",
      ),
    ).toBeTruthy();
  });

  it("previews at the toolbar's width", async () => {
    await draw(<LayoutEditorPage />);
    await fireEvent.press(screen.getByText("360"));
    await fireEvent.press(screen.getByText("Export"));
    await fireEvent.press(screen.getByText("Preview"));
    expect(
      StyleSheet.flatten(screen.getByTestId("export-preview-stage").props.style)
        .width,
    ).toBe(360);
  });

  it("imports a pasted layout as one undo step", async () => {
    await openExport("JSON");
    await paste(
      JSON.stringify({
        format: "glowup-layout",
        version: 1,
        name: "One",
        grid: { columns: 12, rowHeight: 48, gap: 16 },
        items: [
          {
            id: "n1",
            type: "Typography",
            props: {},
            text: "Imported",
            layout: { x: 0, y: 0, w: 6, h: 1 },
          },
        ],
      }),
    );
    expect(
      within(screen.getByTestId("frame-n1")).getByText("Imported"),
    ).toBeTruthy();
    expect(screen.queryByText("RSSMRA80A01H501U")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Undo"));
    expect(screen.getAllByText("RSSMRA80A01H501U").length).toBeGreaterThan(0);
  });

  it("refuses a file that is not a layout", async () => {
    await openExport("JSON");
    await paste("{}");
    expect(screen.getByText("Not a Glowup layout")).toBeTruthy();
    expect(screen.getAllByText("RSSMRA80A01H501U").length).toBeGreaterThan(0);
    expect(
      screen.getByLabelText("Undo").props.accessibilityState?.disabled,
    ).toBe(true);
  });
});

describe("the panels", () => {
  it("shows the layers and selects from them", async () => {
    await draw(<LayoutEditorPage />);
    await fireEvent.press(screen.getByText("Layers"));
    expect(screen.getByText("Typography · Anagrafica")).toBeTruthy();
    expect(screen.getByText("TabbedPanel")).toBeTruthy();
    await fireEvent.press(screen.getByText("Button · Modifica"));
    expect(
      within(screen.getByTestId("properties")).getByText("Button · n23"),
    ).toBeTruthy();
  });

  it("moves a node into another container from the layers", async () => {
    await draw(<LayoutEditorPage />);
    await fireEvent.press(screen.getByText("Layers"));
    await fireEvent.press(screen.getByText("Typography · Telefono"));
    await fireEvent.press(screen.getByLabelText("Move into VStack (n22)"));
    expect(
      within(screen.getByTestId("frame-n22")).getByText("Telefono"),
    ).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Undo"));
    expect(
      within(screen.getByTestId("frame-n1")).getByText("Telefono"),
    ).toBeTruthy();
  });

  it("edits the selection in the Properties column", async () => {
    await draw(<LayoutEditorPage />);
    await fireEvent.press(screen.getByText("Layers"));
    await fireEvent.press(screen.getByText("Typography · Telefono"));
    await fireEvent.changeText(screen.getByLabelText("Text"), "Cellulare");
    expect(
      within(screen.getByTestId("frame-n7")).getByText("Cellulare"),
    ).toBeTruthy();
  });
});
