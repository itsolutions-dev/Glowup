# Layout editor, plan 1: library foundations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `@its/glowup-ui` what the layout editor and its exported code need: drag and drop that reports _where_ an item is over a zone, keeps zones current while things move or scroll, and scrolls by itself near an edge; and a `GridLayout` component that places children on a grid of cells from layout data.

**Architecture:** Extend the existing drag and drop manager (`components/DragDrop.tsx`, an external store with `useSyncExternalStore`) with a preview rect in `over`, a public selector hook, a coalesced re-measure, and registered scrollers. `GridLayout` is a pure placement over percentages and dp margins (no measured width), with its geometry in a pure module tested on its own. Both are documented on the site.

**Tech Stack:** React Native 0.86 + react-native-web, Expo 57, TypeScript, jest-expo + @testing-library/react-native 14. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-26-layout-editor-design.md` (§9 drag and drop, §10 `GridLayout`, §19 phases 0–1). This is plan 1 of 3: plan 2 (the editor's pure core: document, manifest, engine, history) and plan 3 (the editor page) are written once this one has landed, against the interfaces it produces.

## Global Constraints

- No new dependency (no gesture-handler, no reanimated, no grid or formatting library).
- Anything added under `packages/ui/src/components` is exported from `packages/ui/src/index.ts`.
- Styles from the theme: colours from `theme.colors`, spacing in `{4, 8, 16, 24, 32}`, radii from `theme.shape`.
- `useId()` never reaches native output.
- Grid defaults, verbatim from the spec: **12 columns, row height 48 dp, gap 16 dp**; `stackBelow` defaults to the size class **`"medium"`**.
- An item on a grid is **as tall as its rows; taller content scrolls inside it**; stacked (below `stackBelow`) an item takes **its content's height** and items follow in **reading order (`y`, then `x`)**.
- Library tests live in `packages/ui/src/__tests__` (jest-expo). After touching a component's props, an example or a gallery: `npm run docgen -w @its/glowup-playground`, `npm run examples -w @its/glowup-playground` (CI fails on a diff).
- Formatting: `npx prettier --write <files>`; `npm run lint` must not gain errors (one pre-existing error in `packages/ui/src/components/internal/FieldShell.tsx:108` is not ours).
- A user-visible library change carries a changeset in `.changeset/`.
- Commits only if the user has asked for them in the session; otherwise skip every "Commit" step and leave the work in the tree.
- Verifying in the browser: `CI=1 npx expo start --web --port 8099` in `apps/playground` does **not** watch files — restart it after each edit.
- The day's handoff is `docs/handoff/<today>.md` (one per day, Italian, a section per person).

## Review Focus

1. **A list scrolled while an item is held** (mouse wheel, or auto-scroll): the drop must land under the pointer, not where the zone was when the drag began. → Task 3, test "keeps zones current while it scrolls".
2. **A zone that unmounts during a drag** (a list re-rendered mid-drag): no crash, and the zone is no longer a target. → Task 2, test "forgets a zone that unmounts during the drag".
3. **Layout data out of range** (`x + w` past the columns, `w` or `h` of 0, negative `x`/`y`, fractions): rendered inside the grid, never overflowing it. → Task 4, test "clamps an item into the grid".
4. **Children and layout that disagree** (a child with no layout entry, an entry with no child): nothing rendered for either, no crash. → Task 5, test "leaves out a child with no place, and a place with no child".
5. **Auto-scroll at the end of the content**: it stops at the last offset instead of calling `scrollTo` forever. → Task 3, test "scrolls near the bottom edge and stops at the end".

---

### Task 1: Where the item is over a zone, and a selector over the drag

**Files:**

- Modify: `packages/ui/src/components/DragDrop.tsx` (types `DropTarget`, new `DragRect`, `DragSnapshot`; `locate`/`move` in `createManager`; new `useDragState`)
- Test: `packages/ui/src/__tests__/drag-drop.test.tsx`

**Interfaces:**

- Consumes: the existing manager (`start`, `move`, `targets`, `grab`, `state.rect`), `useDragSlice`, `zoneAt`, `insertionIndex`.
- Produces:
  - `export interface DragRect { x: number; y: number; width: number; height: number }`
  - `DropTarget` gains `rect: DragRect` — the dragged item's preview, relative to the zone's top-left — and `zone: { width: number; height: number }`.
  - `export interface DragSnapshot { active: DragItem | null; over: DropTarget | null }`
  - `export const useDragState = <T,>(select: (state: DragSnapshot) => T): T` — re-renders its caller only when `select`'s result changes (`Object.is`). JSDoc: the selector must return a primitive, or the same object while nothing changed.

- [ ] **Step 1: Write the failing tests** — in `drag-drop.test.tsx`, give `setup` an `extra?: React.ReactNode` prop rendered as the last child of `DragDropProvider`, then add:

```tsx
it("reports where the item's preview is in the zone", async () => {
  const { view, onDragEnd } = await setup();
  const b = view.getByTestId("b"); // window rect 0,48 300×40
  await drag(b, [20, 60], [420, 30]); // moved by +400, -30
  await fireEvent(b, "responderRelease", at(420, 30));
  expect(onDragEnd.mock.calls[0][0].over).toMatchObject({
    id: "bin", // window rect 400,0 100×100
    rect: { x: 0, y: 18, width: 300, height: 40 },
    zone: { width: 100, height: 100 },
  });
});

it("re-renders a selector only when its value changes", async () => {
  let renders = 0;
  const Probe = () => {
    renders++;
    const over = useDragState((s) => s.over?.id ?? "none");
    return <Text testID="probe">{over}</Text>;
  };
  const { view } = await setup({ extra: <Probe /> });
  const a = view.getByTestId("a");
  await drag(a, [20, 20], [20, 22]);
  expect(view.getByTestId("probe").props.children).toBe("list");
  const inList = renders;
  await fireEvent(a, "responderMove", at(21, 24));
  await fireEvent(a, "responderMove", at(22, 26));
  expect(renders).toBe(inList);
  await fireEvent(a, "responderMove", at(450, 50));
  expect(view.getByTestId("probe").props.children).toBe("bin");
  expect(renders).toBe(inList + 1);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd packages/ui && npx jest src/__tests__/drag-drop.test.tsx -t "preview is in the zone|selector only"`
Expected: FAIL — `rect` missing from `over`; `useDragState` is not exported.

- [ ] **Step 3: Implement** in `DragDrop.tsx`:
  - `locate(point)`: once the zone is found, `rect` is the measured active rect (`state.rect`) moved by `point - grab`, minus the zone's `rect.x`/`rect.y`; `zone` is the zone's measured width and height. With no measured active rect there are no targets, so nothing changes there.
  - `move(point)`: set `over` on every move while it is non-null (its `rect` changes with the pointer); keep the existing "only when changed" rule for `null`.
  - `useDragState`: `useDragSlice(useManager("useDragState"), (s) => select({ active: s.active, over: s.over }))`.
  - Export `DragRect`, `DragSnapshot`, `useDragState` (the barrel's `export *` already covers the module).

- [ ] **Step 4: Run the whole drag and drop suite**

Run: `cd packages/ui && npx jest src/__tests__/drag-drop`
Expected: PASS, the existing 24 tests included.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/DragDrop.tsx packages/ui/src/__tests__/drag-drop.test.tsx
git commit -m "feat(ui): drop position and useDragState"
```

---

### Task 2: Measure again when something moves during a drag

**Files:**

- Modify: `packages/ui/src/components/DragDrop.tsx` (`createManager`: extract the measuring of `start` into `measureAll`, add `relayout`; `onLayout` on the `Draggable` and `Droppable` views)
- Test: `packages/ui/src/__tests__/drag-drop.test.tsx`

**Interfaces:**

- Consumes: Task 1's `locate`/`move`.
- Produces (internal to the module, used by Task 3): `manager.relayout(): void` — while a drag is active, measures every zone and item again and recomputes `over` at the last pointer position; calls that arrive while a measure is in flight coalesce into one more pass after it. The active item's own preview rect (`state.rect`) is **not** re-measured: the preview keeps following the pointer from where it was grabbed.

- [ ] **Step 1: Write the failing tests** (restore `RECTS` after each test: `const ORIGINAL = { ...RECTS }` at the top, `Object.assign(RECTS, ORIGINAL)` in `afterEach`):

```tsx
it("measures again when a zone moves during the drag", async () => {
  const { view, onDragEnd } = await setup();
  const a = view.getByTestId("a");
  await drag(a, [20, 20], [450, 50]);
  RECTS.bin = [400, 600, 100, 100]; // pushed down by something that grew
  await fireEvent(view.getByTestId("bin"), "layout", {
    nativeEvent: { layout: { x: 400, y: 600, width: 100, height: 100 } },
  });
  await act(async () => {});
  await fireEvent(a, "responderMove", at(450, 650));
  await fireEvent(a, "responderRelease", at(450, 650));
  expect(onDragEnd.mock.calls[0][0].over?.id).toBe("bin");
});

it("forgets a zone that unmounts during the drag", async () => {
  const onDragEnd = jest.fn();
  const Board = ({ withBin }: { withBin: boolean }) => (
    <ThemeProvider>
      <PortalHost>
        <DragDropProvider onDragEnd={onDragEnd}>
          <Droppable id="list" testID="list">
            <Draggable id="a" testID="a">
              <Text>a</Text>
            </Draggable>
          </Droppable>
          {withBin && <Droppable id="bin" testID="bin" />}
        </DragDropProvider>
      </PortalHost>
    </ThemeProvider>
  );
  const view = await render(<Board withBin />);
  const a = view.getByTestId("a");
  await drag(a, [20, 20], [450, 50]);
  await view.rerender(<Board withBin={false} />);
  await fireEvent(view.getByTestId("list"), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 136 } },
  });
  await act(async () => {});
  await fireEvent(a, "responderMove", at(451, 50));
  await fireEvent(a, "responderRelease", at(451, 50));
  expect(onDragEnd.mock.calls[0][0].over).toBeNull();
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd packages/ui && npx jest src/__tests__/drag-drop.test.tsx -t "measures again|unmounts during"`
Expected: FAIL — the first drops on the bin's old place (`over` null); the second still reports `bin`.

- [ ] **Step 3: Implement** `measureAll(item: DragItem): Promise<void>` (the body `start` has today, minus setting `state.rect` — `start` keeps that) and `relayout()` in `createManager`; a zone or item whose ref is gone (`measure` resolves `null`) is skipped. `Draggable` and `Droppable` pass `onLayout={manager.relayout}` to their view (a no-op outside a drag).

- [ ] **Step 4: Run the suite**

Run: `cd packages/ui && npx jest src/__tests__/drag-drop`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/DragDrop.tsx packages/ui/src/__tests__/drag-drop.test.tsx
git commit -m "feat(ui): re-measure drop zones that move during a drag"
```

---

### Task 3: `useDragScroll` — scroll lock, auto-scroll, current zones while scrolling

**Files:**

- Modify: `packages/ui/src/components/internal/dragDrop.ts` (add `autoScrollStep`, `AUTO_SCROLL_EDGE`, `AUTO_SCROLL_MAX`)
- Modify: `packages/ui/src/components/DragDrop.tsx` (scrollers in `createManager`, the hook)
- Test: `packages/ui/src/__tests__/drag-drop-geometry.test.ts`, `packages/ui/src/__tests__/drag-drop.test.tsx`

**Interfaces:**

- Consumes: Task 2's `relayout`; the module's `measure(view)`.
- Produces:
  - `export const AUTO_SCROLL_EDGE = 48; export const AUTO_SCROLL_MAX = 16;` (dp; dp per 16 ms tick)
  - `export const autoScrollStep = (point: Point, rect: Rect): number` — 0 when `point.x` is outside `rect`'s columns; otherwise negative near or above the top, positive near or below the bottom, 0 in between; magnitude `Math.round(AUTO_SCROLL_MAX * (1 - clamp(distanceToEdge, 0, AUTO_SCROLL_EDGE) / AUTO_SCROLL_EDGE))` inside the band, `AUTO_SCROLL_MAX` beyond it.
  - `export interface DragScrollProps { ref: React.RefObject<ScrollView | null>; onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void; scrollEnabled: boolean }`
  - `export const useDragScroll = (): DragScrollProps` — spread on the `ScrollView` or library `ScrollArea` that holds drop zones (`<ScrollArea {...scroll}>`; a plain `ScrollView` also needs `scrollEventThrottle={16}`). Vertical only.

- [ ] **Step 1: Write the failing geometry test** (in `drag-drop-geometry.test.ts`):

```ts
describe("autoScrollStep", () => {
  const rect = { x: 0, y: 100, width: 300, height: 400 }; // edges at 100 and 500
  it.each([
    [{ x: 10, y: 300 }, 0], // middle
    [{ x: 10, y: 100 }, -16], // on the top edge
    [{ x: 10, y: 124 }, -8], // half way into the top band
    [{ x: 10, y: 40 }, -16], // above the area
    [{ x: 10, y: 476 }, 8], // half way into the bottom band
    [{ x: 10, y: 560 }, 16], // below the area
    [{ x: 400, y: 490 }, 0], // beside the area
  ])("at %o scrolls %d", (point, step) => {
    expect(autoScrollStep(point, rect)).toBe(step);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd packages/ui && npx jest src/__tests__/drag-drop-geometry.test.ts -t autoScrollStep`
Expected: FAIL — `autoScrollStep` is not exported.

- [ ] **Step 3: Implement `autoScrollStep`** in `internal/dragDrop.ts` with the constants above.

- [ ] **Step 4: Run it**

Run: `cd packages/ui && npx jest src/__tests__/drag-drop-geometry.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing hook tests** (in `drag-drop.test.tsx`; add `scroller: [0, 0, 300, 200]` to `RECTS`, import `ScrollView` and `useDragScroll`):

```tsx
const Scroller = () => {
  const scroll = useDragScroll();
  return <ScrollView testID="scroller" scrollEventThrottle={16} {...scroll} />;
};
const scrolled = (y: number) => ({
  nativeEvent: {
    contentOffset: { x: 0, y },
    contentSize: { width: 300, height: 400 },
    layoutMeasurement: { width: 300, height: 200 },
  },
});

it("locks its scroll view while an item is held", async () => {
  const { view } = await setup({ extra: <Scroller /> });
  const a = view.getByTestId("a");
  expect(view.getByTestId("scroller").props.scrollEnabled).toBe(true);
  await drag(a, [20, 20], [20, 22]);
  expect(view.getByTestId("scroller").props.scrollEnabled).toBe(false);
  await fireEvent(a, "responderRelease", at(20, 22));
  expect(view.getByTestId("scroller").props.scrollEnabled).toBe(true);
});

it("scrolls near the bottom edge and stops at the end", async () => {
  const scrollTo = jest.spyOn(ScrollView.prototype as any, "scrollTo");
  const { view } = await setup({ extra: <Scroller /> });
  await fireEvent(view.getByTestId("scroller"), "scroll", scrolled(0));
  const a = view.getByTestId("a");
  await drag(a, [20, 20], [20, 195]); // 5 dp from the bottom: 14 per tick
  await act(async () => jest.advanceTimersByTime(16 * 3));
  expect(scrollTo.mock.calls.map(([to]: any) => to.y)).toEqual([14, 28, 42]);
  await fireEvent(view.getByTestId("scroller"), "scroll", scrolled(195));
  scrollTo.mockClear();
  await act(async () => jest.advanceTimersByTime(16 * 3));
  expect(scrollTo.mock.calls.map(([to]: any) => to.y)).toEqual([200]); // content 400 − viewport 200
});

it("keeps zones current while it scrolls", async () => {
  const { view, onDragEnd } = await setup({ extra: <Scroller /> });
  const a = view.getByTestId("a");
  await drag(a, [20, 20], [450, 50]);
  RECTS.bin = [400, 300, 100, 100]; // the content scrolled
  await fireEvent(view.getByTestId("scroller"), "scroll", scrolled(60));
  await act(async () => {});
  await fireEvent(a, "responderMove", at(450, 350));
  await fireEvent(a, "responderRelease", at(450, 350));
  expect(onDragEnd.mock.calls[0][0].over?.id).toBe("bin");
});
```

- [ ] **Step 6: Run them to see them fail**

Run: `cd packages/ui && npx jest src/__tests__/drag-drop.test.tsx -t "locks its scroll|bottom edge|while it scrolls"`
Expected: FAIL — `useDragScroll` is not exported.

- [ ] **Step 7: Implement** in `DragDrop.tsx`:
  - The manager keeps a `Set` of scrollers `{ ref, offset, content, viewport, rect }`; `measureAll` measures each scroller's `ref.current` into `rect`.
  - `useDragScroll` registers one scroller on mount (removes it on unmount); `onScroll` stores `contentOffset.y`, `contentSize.height`, `layoutMeasurement.height` and calls `relayout()` while a drag is active; `scrollEnabled` is `!dragging` (`useDragSlice(manager, (s) => s.active !== null)`).
  - In `move(point)`: the first scroller whose `autoScrollStep(point, rect)` is non-zero runs a `setInterval` of 16 ms; each tick scrolls it to `clamp(offset + step, 0, content - viewport)` with `scrollTo({ y, animated: false })`, updates `offset` to that value, and stops (clears the interval) when the value equals the current offset. A move with step 0, the end and the cancel of the drag clear it.

- [ ] **Step 8: Run the suites**

Run: `cd packages/ui && npx jest src/__tests__/drag-drop`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/ui/src/components/internal/dragDrop.ts packages/ui/src/components/DragDrop.tsx packages/ui/src/__tests__/drag-drop.test.tsx packages/ui/src/__tests__/drag-drop-geometry.test.ts
git commit -m "feat(ui): useDragScroll, auto-scroll and scroll lock while dragging"
```

---

### Task 4: `GridLayout` geometry

**Files:**

- Create: `packages/ui/src/components/internal/gridLayout.ts`
- Test: `packages/ui/src/__tests__/grid-layout-geometry.test.ts`

**Interfaces:**

- Produces (Task 5 re-exports the first four publicly):
  - `export interface GridLayoutItem { id: string; x: number; y: number; w: number; h: number }`
  - `export const clampGridItem = (item: GridLayoutItem, columns: number): GridLayoutItem` — rounds every field; `w` to `[1, columns]`, `x` to `[0, columns - w]`, `h` ≥ 1, `y` ≥ 0.
  - `export const gridLayoutHeight = (layout: GridLayoutItem[], rowHeight: number, gap: number): number` — the bottom of the lowest item (clamped), 0 for none.
  - `export const gridReadingOrder = (layout: GridLayoutItem[]): GridLayoutItem[]` — sorted by `y`, then `x`; a new array.
  - `export const itemPlacement = (item: GridLayoutItem, columns: number, rowHeight: number, gap: number)` → `{ left: \`${number}%\`; marginLeft: number; right: \`${number}%\`; marginRight: number; top: number; height: number }` on the clamped item. Width-free on purpose (prerender at width 0, reflow without measuring):

```
left  = (x / columns) * 100 %          marginLeft  = x * gap / columns
right = ((columns - x - w) / columns) * 100 %   marginRight = (columns - x - w) * gap / columns
top   = y * (rowHeight + gap)           height = h * rowHeight + (h - 1) * gap
```

- [ ] **Step 1: Write the failing tests**

```ts
import {
  clampGridItem,
  gridLayoutHeight,
  gridReadingOrder,
  itemPlacement,
} from "../components/internal/gridLayout";

const item = (id: string, x: number, y: number, w: number, h: number) => ({
  id,
  x,
  y,
  w,
  h,
});

describe("itemPlacement", () => {
  it("places an item from its cells, without a width", () => {
    expect(itemPlacement(item("a", 3, 2, 6, 3), 12, 48, 16)).toEqual({
      left: "25%",
      marginLeft: 4,
      right: "25%",
      marginRight: 4,
      top: 128,
      height: 176,
    });
  });
  it("spans the whole width", () => {
    expect(itemPlacement(item("a", 0, 0, 12, 1), 12, 48, 16)).toMatchObject({
      left: "0%",
      marginLeft: 0,
      right: "0%",
      marginRight: 0,
      height: 48,
    });
  });
});

describe("clampGridItem", () => {
  it("clamps an item into the grid", () => {
    expect(clampGridItem(item("a", 10, -1, 6, 0), 12)).toEqual(
      item("a", 6, 0, 6, 1),
    );
    expect(clampGridItem(item("a", -2, 1.4, 0, 2.6), 12)).toEqual(
      item("a", 0, 1, 1, 3),
    );
    expect(clampGridItem(item("a", 0, 0, 20, 1), 12)).toEqual(
      item("a", 0, 0, 12, 1),
    );
  });
});

describe("gridLayoutHeight", () => {
  it("is the bottom of the lowest item", () => {
    expect(gridLayoutHeight([], 48, 16)).toBe(0);
    expect(
      gridLayoutHeight([item("a", 0, 0, 1, 1), item("b", 0, 2, 1, 3)], 48, 16),
    ).toBe(304);
  });
});

describe("gridReadingOrder", () => {
  it("reads rows top to bottom, then left to right", () => {
    const order = gridReadingOrder([
      item("b", 6, 0, 1, 1),
      item("c", 0, 2, 1, 1),
      item("a", 0, 0, 1, 1),
    ]);
    expect(order.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd packages/ui && npx jest src/__tests__/grid-layout-geometry.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** `internal/gridLayout.ts` with the signatures and formulas above (`itemPlacement` and `gridLayoutHeight` clamp first; columns ≥ 1).

- [ ] **Step 4: Run them**

Run: `cd packages/ui && npx jest src/__tests__/grid-layout-geometry.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/internal/gridLayout.ts packages/ui/src/__tests__/grid-layout-geometry.test.ts
git commit -m "feat(ui): grid layout geometry"
```

---

### Task 5: The `GridLayout` component

**Files:**

- Create: `packages/ui/src/components/Layout/GridLayout.tsx`
- Modify: `packages/ui/src/index.ts` (after the `Grid` exports: `export { default as GridLayout } from "./components/Layout/GridLayout"; export * from "./components/Layout/GridLayout";`)
- Test: `packages/ui/src/__tests__/grid-layout.test.tsx`

**Interfaces:**

- Consumes: Task 4's module; `useBreakpoint` (`atLeast(sizeClass)`) and `SizeClass` from `hooks/useBreakpoint`.
- Produces:

```ts
export interface GridLayoutProps {
  /** Where each child sits, matched to the child by `key` = `id`. */
  layout: GridLayoutItem[];
  /** Defaults to 12. */
  columns?: number;
  /** Height of one row, in dp. Defaults to 48. */
  rowHeight?: number;
  /** Space between columns and between rows, in dp. Defaults to 16. */
  gap?: number;
  /** Below this window size class the children stack in reading order. Defaults to "medium". */
  stackBelow?: SizeClass;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Also gives each item's wrapper `${testID}-${id}`. */
  testID?: string;
}
export type { GridLayoutItem } from "../internal/gridLayout";
export {
  clampGridItem,
  gridLayoutHeight,
  gridReadingOrder,
} from "../internal/gridLayout";
```

Behaviour: children are matched by their original `key` (`React.Children.forEach`, not `toArray`, which rewrites keys). Wide: a `View` of height `gridLayoutHeight` holding, per layout entry with a child, an absolutely positioned `View` with `itemPlacement(...)`, containing a `ScrollView` (`nestedScrollEnabled`, `contentContainerStyle={{ flexGrow: 1 }}`) around the child, so the child fills its cells and taller content scrolls. Stacked (`!atLeast(stackBelow)`): a column with `gap`, entries in `gridReadingOrder`, each child in a plain `View` at its content's height. A child with no entry, or an entry with no child, renders nothing.

- [ ] **Step 1: Write the failing tests**

```tsx
import React from "react";
import { StyleSheet, Text } from "react-native";
import { render } from "@testing-library/react-native";
import { GridLayout, ThemeProvider, ViewportProvider } from "..";

const LAYOUT = [
  { id: "b", x: 6, y: 0, w: 6, h: 4 },
  { id: "a", x: 0, y: 0, w: 6, h: 2 },
  { id: "c", x: 0, y: 2, w: 3, h: 1 },
  { id: "y", x: 3, y: 2, w: 3, h: 1 }, // no child
];
const draw = (width: number) =>
  render(
    <ThemeProvider>
      <ViewportProvider width={width}>
        <GridLayout testID="grid" layout={LAYOUT}>
          <Text key="a">A</Text>
          <Text key="b">B</Text>
          <Text key="c">C</Text>
          <Text key="z">Z</Text>
        </GridLayout>
      </ViewportProvider>
    </ThemeProvider>,
  );
const flat = (node: any) => StyleSheet.flatten(node.props.style);

describe("GridLayout", () => {
  it("places each child at its cells", async () => {
    const view = await draw(1280);
    expect(flat(view.getByTestId("grid"))).toMatchObject({ height: 240 }); // 4 rows
    expect(flat(view.getByTestId("grid-a"))).toMatchObject({
      position: "absolute",
      left: "0%",
      marginLeft: 0,
      right: "50%",
      marginRight: 8,
      top: 0,
      height: 112,
    });
    expect(flat(view.getByTestId("grid-c"))).toMatchObject({
      top: 128,
      height: 48,
    });
  });

  it("leaves out a child with no place, and a place with no child", async () => {
    const view = await draw(1280);
    expect(view.queryByText("Z")).toBeNull();
    expect(view.queryByTestId("grid-y")).toBeNull();
  });

  it("stacks in reading order on a phone", async () => {
    const view = await draw(360);
    expect(view.getAllByText(/^[ABC]$/).map((n) => n.props.children)).toEqual([
      "A",
      "B",
      "C",
    ]);
    expect(flat(view.getByTestId("grid-a")).position).toBeUndefined();
  });

  it("nests", async () => {
    const view = await render(
      <ThemeProvider>
        <ViewportProvider width={1280}>
          <GridLayout layout={[{ id: "outer", x: 0, y: 0, w: 6, h: 3 }]}>
            <GridLayout
              key="outer"
              testID="inner"
              columns={6}
              layout={[{ id: "n", x: 0, y: 1, w: 6, h: 1 }]}
            >
              <Text key="n">N</Text>
            </GridLayout>
          </GridLayout>
        </ViewportProvider>
      </ThemeProvider>,
    );
    expect(view.getByText("N")).toBeTruthy();
    expect(flat(view.getByTestId("inner-n"))).toMatchObject({
      top: 64,
      left: "0%",
      right: "0%",
    });
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd packages/ui && npx jest src/__tests__/grid-layout.test.tsx`
Expected: FAIL — `GridLayout` is not exported.

- [ ] **Step 3: Implement** `Layout/GridLayout.tsx` (default export plus the named exports above; JSDoc on the component describing the two modes, as the other Layout components do) and the barrel lines.

- [ ] **Step 4: Run the library's suite and the type-check**

Run: `npm test -w @its/glowup-ui && npm run type-check -w @its/glowup-ui`
Expected: PASS; no type errors.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Layout/GridLayout.tsx packages/ui/src/index.ts packages/ui/src/__tests__/grid-layout.test.tsx
git commit -m "feat(ui): GridLayout"
```

---

### Task 6: `GridLayout` in the documentation

**Files:**

- Modify: `apps/playground/catalogue/registry/layout.ts` (entry after `Grid`), `apps/playground/catalogue/categories.ts` (`"GridLayout"` after `"Grid"` in Layout), `apps/playground/catalogue/descriptions.ts`, `apps/playground/__tests__/playground-catalogue.test.tsx` (`"GridLayout"` after `"Grid"` in `CATALOGUE`), `apps/playground/catalogue/variants/manual/index.ts`
- Create: `apps/playground/catalogue/examples/GridLayout.tsx`, `apps/playground/catalogue/variants/manual/GridLayout.tsx`
- Modify: `packages/ui/README.md` (a `GridLayout` section in the Layout part), `packages/ui/src/components/components.md` (§8 Layout Primitives section and the Layout line of §9 Component Index)
- Regenerate: `apps/playground/docgen/props.generated.json`, `apps/playground/catalogue/examples/examples.generated.ts`
- Create: `.changeset/grid-layout.md` (`"@its/glowup-ui": minor`)

**Interfaces:**

- Consumes: Task 5's `GridLayout`, `GridLayoutProps`.
- Produces: the `/components/GridLayout` page.

- [ ] **Step 1: Add the catalogue entries.** Registry controls — real props with the component's defaults (the registry-defaults test checks them):

```ts
GridLayout: {
  name: "GridLayout",
  Component: GridLayout,
  props: {
    columns: { type: "number", default: 12, label: "Columns" },
    rowHeight: { type: "number", default: 48, label: "Row Height" },
    gap: { type: "number", default: 16, label: "Gap" },
    stackBelow: {
      type: "select", default: "medium", label: "Stack Below",
      options: ["compact", "medium", "expanded", "large", "extraLarge"].map((v) => ({ label: v, value: v })),
    },
  },
},
```

Description: `"Places its children on a grid of cells from layout data, with gaps, and stacks them on phones."`

- [ ] **Step 2: Write the example** `catalogue/examples/GridLayout.tsx`, modelled on `catalogue/examples/Button.tsx`: a customer detail page like the CRM screenshot — a `Paper` of identity fields (`w: 6, h: 4`), a `Paper` "Ultimo contatto" (`x: 6, w: 6, h: 2`), an action card (`x: 6, y: 2, w: 6, h: 2`) and a full-width notes panel lower down with an empty row above it (the gap). `const props: Partial<GridLayoutProps> = { gap: 16 };` spread on the outer `GridLayout`; the layout array is the example's own data, kept in the code.

- [ ] **Step 3: Write the gallery** `variants/manual/GridLayout.tsx` exporting `variants: Variant[]` with two entries: `"Gaps"` (three cards, one row left empty between them — "Items stay where they are placed; empty rows and cells stay empty") and `"Nested"` (a `Paper` spanning 6 columns holding a `GridLayout` of `columns={6}` — "A grid inside a card, with as many columns as the card spans, so its cells line up with the page's"). Register it in `variants/manual/index.ts` as `GridLayout`.

- [ ] **Step 4: Write the docs sections.** README: what it does, the props table, the two modes (cells on wide screens, reading order below `stackBelow`), "taller content scrolls inside its item", and the three helpers (`clampGridItem`, `gridLayoutHeight`, `gridReadingOrder`). `components.md`: the same in the spec's shape. Changeset: one paragraph naming `GridLayout`, its props and defaults, and the helpers.

- [ ] **Step 5: Regenerate and run the playground's tests**

Run: `npm run docgen -w @its/glowup-playground && npm run examples -w @its/glowup-playground && npm test -w @its/glowup-playground`
Expected: `docgen: N/N components documented`; all suites PASS (catalogue, examples — compiled render equals the real one —, registry defaults).

- [ ] **Step 6: Format, lint, commit**

Run: `npx prettier --write <the files above> && npm run lint`
Expected: no new lint errors.

```bash
git add apps/playground packages/ui/README.md packages/ui/src/components/components.md .changeset/grid-layout.md
git commit -m "docs: GridLayout page, example and gallery"
```

---

### Task 7: The drag and drop page and docs for the new API

**Files:**

- Modify: `apps/playground/app/drag-and-drop.tsx` (two sections after "Nested zones"), `apps/playground/__tests__/drag-and-drop-page.test.tsx` (the two titles)
- Modify: `packages/ui/README.md` and `packages/ui/src/components/components.md` (drag and drop sections), `.changeset/drag-and-drop.md` (not released yet: extend its paragraph)

**Interfaces:**

- Consumes: Task 1's `over.rect`/`over.zone` and `useDragState`, Task 3's `useDragScroll`, Task 5's `GridLayout`.
- Produces: nothing new; this is the phase-0 demo the spec asks for, and a first run of the editor's core loop.

- [ ] **Step 1: Update the page test first** — add `"Drop anywhere on a grid"` and `"Scroll while dragging"` to the section titles it expects, and run it to see it fail:

Run: `cd apps/playground && npx jest __tests__/drag-and-drop-page.test.tsx`
Expected: FAIL — the two titles are missing.

- [ ] **Step 2: Write "Drop anywhere on a grid"**: a `Droppable` `id="board"` around a 12-column `GridLayout` holding four notes (`Draggable`s, `Paper` with a title). While a note is over the board, `useDragState` selects the snapped cell as a string key (`"x,y"`), computed from `over.rect` and `over.zone.width`:

```
pitchX = (zone.width + gap) / columns      col = clamp(round(rect.x / pitchX), 0, columns - w)
pitchY = rowHeight + gap                    row = max(0, round(rect.y / pitchY))
```

The board then draws the empty cells (rounded `surfaceContainerHigh`, `shape.small`, as extra `GridLayout` items under the notes) and a landing placeholder at the snapped cell (`primaryContainer`, 2 dp dashed `primary` border). A drop onto cells another note occupies is refused (the placeholder turns `errorContainer` and `onDragEnd` ignores it); the editor's push-down comes in plan 2.

- [ ] **Step 3: Write "Scroll while dragging"**: a `ScrollArea` of `height={320}` spread with `useDragScroll()`, holding a `Droppable` list of 30 numbered rows to reorder; the description says the list scrolls by itself when the held row nears its top or bottom edge.

- [ ] **Step 4: Update the docs.** README and `components.md`: `over.rect`/`over.zone`, `useDragState` (and the "primitive or same object" rule), `useDragScroll` replacing the "pass `scrollEnabled={!active}`" advice. Extend `.changeset/drag-and-drop.md` with the three additions.

- [ ] **Step 5: Run the page test and the playground suite**

Run: `npm test -w @its/glowup-playground && npm run type-check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/playground/app/drag-and-drop.tsx apps/playground/__tests__/drag-and-drop-page.test.tsx packages/ui/README.md packages/ui/src/components/components.md .changeset/drag-and-drop.md
git commit -m "docs(drag-and-drop): grid placement and auto-scroll demos"
```

---

### Task 8: Verify on the real page and hand off

**Files:**

- Modify: `docs/handoff/<today>.md` (a section for this work), `docs/superpowers/specs/2026-10-26-layout-editor-design.md` (§19: phases 0 and 1 marked done with the date)

- [ ] **Step 1: Run everything**

Run: `npm run type-check && npm test && npm run lint`
Expected: type-check clean; every suite PASS; lint shows only the pre-existing `FieldShell.tsx:108` error.

- [ ] **Step 2: Check in the browser** (`cd apps/playground && CI=1 BROWSER=none npx expo start --web --port 8099`, Playwright, wait for hydration before dragging):
  - 1280 × 900, mouse: on `/drag-and-drop`, a note dropped on the board lands on the cell under the placeholder; the cells and placeholder appear only while dragging; a drop on an occupied cell is refused. In "Scroll while dragging", holding row 1 near the area's bottom edge scrolls the list to its end and stops; the row lands where released.
  - 390 × 844, touch (CDP `Input.dispatchTouchEvent`, long press 400 ms): the same two checks.
  - `/components/GridLayout`: the example at Full, 720 and 360 (stacked in reading order at 360); no console errors.
- [ ] **Step 3: Record what could not be checked here** — iOS and Android (that Yoga applies the dp margins on absolutely positioned items with `left`/`right` in percent; auto-scroll and scroll lock in a native `ScrollView`) — in the handoff as "Non verificato", with the two demo sections as the device checklist.
- [ ] **Step 4: Write the handoff section and mark phases 0–1 done in the spec's §19.**
- [ ] **Step 5: Commit**

```bash
git add docs/handoff docs/superpowers/specs/2026-10-26-layout-editor-design.md
git commit -m "docs: handoff for the layout editor foundations"
```
