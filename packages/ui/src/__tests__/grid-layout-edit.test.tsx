import React from "react";
import { ScrollView, Text, View } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import {
  DragDropProvider,
  Draggable,
  GridLayout,
  PortalHost,
  ThemeProvider,
  ViewportProvider,
  gridFreeRow,
  resizeGridItem,
  type GridLayoutItem,
} from "..";

// The test renderer cannot measure: each view's window rect comes from its
// testID. Twelve columns over 1190 dp with a 10 dp gap make a 100 dp column
// pitch; 40 dp rows make a 50 dp row pitch.
const RECTS: Record<string, [number, number, number, number]> = {
  grid: [0, 0, 1190, 400],
  "grid-a": [0, 0, 390, 90],
  "grid-b": [600, 0, 390, 90],
  palette: [1300, 0, 100, 40],
};

beforeEach(() => {
  jest.useFakeTimers();
  for (const component of [View, ScrollView]) {
    jest
      .spyOn(component.prototype as any, "measureInWindow")
      .mockImplementation(function (this: any, cb: any) {
        cb(...(RECTS[this.props?.testID] ?? [0, 0, 0, 0]));
      });
  }
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const LAYOUT: GridLayoutItem[] = [
  { id: "a", x: 0, y: 0, w: 4, h: 2 },
  { id: "b", x: 6, y: 0, w: 4, h: 2 },
];

const at = (x: number, y: number) => ({ nativeEvent: { pageX: x, pageY: y } });

const setup = async (withPalette = false) => {
  const onLayoutChange = jest.fn();
  const onDrop = jest.fn();
  const onDragEnd = jest.fn();
  const grid = (
    <GridLayout
      editable
      testID="grid"
      layout={LAYOUT}
      gap={10}
      rowHeight={40}
      onLayoutChange={onLayoutChange}
      dropSize={(item) => (item.id === "palette" ? { w: 4, h: 2 } : null)}
      onDrop={onDrop}
    >
      <Text key="a">A</Text>
      <Text key="b">B</Text>
    </GridLayout>
  );
  const view = await render(
    <ThemeProvider>
      <ViewportProvider width={1280}>
        <PortalHost>
          {withPalette ? (
            <DragDropProvider onDragEnd={onDragEnd}>
              {grid}
              <Draggable id="palette" testID="palette" data={{ widget: "x" }}>
                <Text>new</Text>
              </Draggable>
            </DragDropProvider>
          ) : (
            grid
          )}
        </PortalHost>
      </ViewportProvider>
    </ThemeProvider>,
  );
  return { view, onLayoutChange, onDrop, onDragEnd };
};

type Host = ReturnType<
  Awaited<ReturnType<typeof setup>>["view"]["getByTestId"]
>;

const drag = async (
  item: Host,
  from: [number, number],
  to: [number, number],
) => {
  item.props.onStartShouldSetResponderCapture(at(...from));
  item.props.onStartShouldSetResponder(at(...from));
  await fireEvent(item, "responderGrant", at(...from));
  await act(async () => {
    jest.advanceTimersByTime(250);
  });
  await fireEvent(item, "responderMove", at(...to));
  await fireEvent(item, "responderRelease", at(...to));
};

describe("GridLayout editable", () => {
  it("moves an item to the cell it is let go on, with a provider of its own", async () => {
    const { view, onLayoutChange } = await setup();
    await drag(view.getByTestId("grid-a"), [10, 10], [10, 160]);
    expect(onLayoutChange).toHaveBeenCalledWith([
      { id: "a", x: 0, y: 3, w: 4, h: 2 },
      LAYOUT[1],
    ]);
  });

  it("refuses a move onto another item: nothing is pushed", async () => {
    const { view, onLayoutChange } = await setup();
    await drag(view.getByTestId("grid-a"), [10, 10], [560, 10]);
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it("places a palette drop on the first free row, and the app's provider still hears it", async () => {
    const { view, onDrop, onDragEnd, onLayoutChange } = await setup(true);
    await drag(view.getByTestId("palette"), [1310, 10], [610, 10]);
    expect(onDrop).toHaveBeenCalledWith(
      { id: "palette", data: { widget: "x" } },
      { x: 6, y: 2, w: 4, h: 2 },
    );
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it("resizes the selected item by its handles, never onto a neighbour", async () => {
    const { view, onLayoutChange } = await setup();
    await fireEvent(view.getByTestId("grid-space"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 1190, height: 400 } },
    });
    const b = view.getByTestId("grid-b");
    expect(view.queryByLabelText("Resize e")).toBeNull();
    b.props.onStartShouldSetResponderCapture(at(700, 10));
    await fireEvent(b, "responderGrant", at(700, 10));
    await fireEvent(b, "responderRelease", at(700, 10));

    const east = view.getByLabelText("Resize e");
    await fireEvent(east, "responderGrant", at(990, 45));
    await fireEvent(east, "responderMove", at(1090, 45));
    await fireEvent(east, "responderRelease", at(1090, 45));
    expect(onLayoutChange).toHaveBeenLastCalledWith([
      LAYOUT[0],
      { id: "b", x: 6, y: 0, w: 5, h: 2 },
    ]);

    // Westward over "a" (which ends at column 4) stops short of it.
    onLayoutChange.mockClear();
    const west = view.getByLabelText("Resize w");
    await fireEvent(west, "responderGrant", at(600, 45));
    await fireEvent(west, "responderMove", at(400, 45));
    await fireEvent(west, "responderMove", at(200, 45));
    await fireEvent(west, "responderRelease", at(200, 45));
    expect(onLayoutChange).toHaveBeenLastCalledWith([
      LAYOUT[0],
      { id: "b", x: 4, y: 0, w: 6, h: 2 },
    ]);
  });
});

describe("grid editing geometry", () => {
  it("resizes from any edge, keeping the opposite one and one cell at least", () => {
    const start = { id: "i", x: 2, y: 2, w: 3, h: 3 };
    const pitch = { x: 100, y: 50 };
    expect(resizeGridItem(start, "se", 200, 100, pitch, 12)).toEqual({
      id: "i",
      x: 2,
      y: 2,
      w: 5,
      h: 5,
    });
    expect(resizeGridItem(start, "nw", 900, 900, pitch, 12)).toEqual({
      id: "i",
      x: 4,
      y: 4,
      w: 1,
      h: 1,
    });
    expect(resizeGridItem(start, "e", 5000, 0, pitch, 12).w).toBe(10);
  });

  it("finds the first free row at or below the one asked", () => {
    expect(gridFreeRow(LAYOUT, { id: "n", x: 2, y: 0, w: 4, h: 1 })).toBe(2);
    expect(gridFreeRow(LAYOUT, { id: "n", x: 4, y: 0, w: 2, h: 1 })).toBe(0);
  });
});
