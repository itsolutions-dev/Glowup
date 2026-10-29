# Layout editor, plan 3: the canvas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/templates/editor` page whose canvas renders a layout document with the real library components and lets you select, delete, duplicate, move (with a drawn grid and a landing preview) and resize its nodes, nested grids included — phase 3 of the spec.

**Architecture:** Two stacked trees over the same document (spec §11.1). The **render tree** draws the real components on `GridLayout`s, inert (`pointerEvents="none"`), and measures what cannot be computed: where a grid container's inner grid sits inside it, where a flow child sits inside its container, and how tall each container's content is. The **edit layer** mirrors the document with the same `GridLayout` placements (deterministic, so no measuring) plus those measured offsets, and carries the editing: `Draggable` boxes, `Droppable` grid zones, the selection chrome and resize handles. While something is dragged or resized, both trees draw a **draft** document computed by the plan-2 operations, so pushed items, the dimmed item at its landing cells and the cells themselves show live; release commits the draft as one history step.

**Tech Stack:** TypeScript, React Native + react-native-web, Expo Router, `@its/glowup-ui` (`DragDropProvider`/`Draggable`/`Droppable`/`useDragState`/`useDragScroll`, `GridLayout`, `ScrollArea`), jest-expo + RNTL 14.

**Spec:** `docs/superpowers/specs/2026-10-26-layout-editor-design.md` (§2, §6, §11.1–11.6, §14 history, §17–§18, §19 phase 3). Built on plans 1 and 2 (`docs/superpowers/plans/2026-10-27-layout-editor-1-foundations.md`, `2026-10-28-layout-editor-2-core.md`); the model is in `apps/playground/editor/`.

## Global Constraints

- The playground imports the library **only by package name** (`@its/glowup-ui`); no new dependencies (spec §5: "New dependencies for drag, resize, grid or code formatting").
- `apps/playground/editor/*.ts` stays the pure model (no React, React Native or `@its/glowup-ui` import, `apps/playground/CLAUDE.md`). The views of this plan live in **`apps/playground/editor/canvas/`** (ruling: the spec's §6 file list predates that rule; a subfolder keeps both).
- The canvas renders **the real library components, inert**: the render tree's root has `pointerEvents="none"` (§11.1). No editor-only copies of components (§5).
- Visuals from theme tokens (§11.2–11.4): selected node a **2 dp `primary` outline**, its type as a small label above the top-left corner, Delete and Duplicate buttons above the top-right corner; hover (web) **1 dp `outlineVariant`**; empty cells **`surfaceContainerHigh`, `shape.small`**; landing cells **`primaryContainer` with a 2 dp dashed `primary` border**; resize handles visible **12 dp** (diamonds on edges, squares on corners) with `hitSlop` to **24 dp**.
- While a node is dragged over a grid, that grid's cells are drawn; on the page **four rows below the lowest item** are added so there is room to drop below (§11.3.1).
- Collisions push down, nothing moves up (§11.3.4): use `moveNode`/`placeNode`, never re-implement placement.
- **One undo step** per drop, resize, delete or duplicate; a container growing to fit its content **amends** the present step (plan 2 ruling) instead of adding one.
- Drags start the drag and drop system's way (rest 250 ms on touch, move 4 px with a mouse); the canvas scroll view uses `useDragScroll()`.
- The page renders after hydration only (`useHydrated`, §14).
- Prettier (`trailingComma: "all"`, LF) and ESLint clean; every new test file in `apps/playground/__tests__/` (jest runs every `.ts`/`.tsx` there, so helpers stay inside the test file).
- **Do not commit**: the user commits. Each task ends with a checkpoint line in the ledger.

## Review Focus

1. **A drop outside every zone** (pointer released over the toolbar or past the canvas): the document is unchanged and history gains no step — test in Task 4.
2. **Three grid containers nested in each other**: each inner grid's measured offset is relative to its own container, so the edit boxes sit on the rendered nodes at every depth (spec §21 risk) — test in Task 2.
3. **The selected node disappears** (deleted, or its insert undone): the selection clears and no chrome is left floating — test in Task 3.
4. **A drop that makes a container grow**: one undo restores both the move and the growth — test in Task 4.
5. **A resize handle dragged past the grid's left edge or below `minSize`**: the size clamps (the opposite edge stays put) instead of inverting — test in Task 5.

---

### Task 1: Pure canvas maths, `amend`, exported `slotKey`

**Files:**

- Modify: `apps/playground/editor/history.ts` (add `amend`)
- Modify: `apps/playground/editor/operations.ts` (export the existing private `slotKey`)
- Create: `apps/playground/editor/canvasMath.ts`
- Test: `apps/playground/__tests__/editor-history.test.ts`, `apps/playground/__tests__/editor-canvas-math.test.ts`

**Interfaces:**

- Consumes: `snapCell`, `extent` (`engine.ts`); `slotColumns`, `canPlace`, `Destination` (`operations.ts`); `findNode` (`document.ts`); `entryFor` (`manifest.ts`); types `DragItem`, `DropTarget` from `@its/glowup-ui` — **type-only** imports keep the file pure.
- Produces:
  - `amend(history: History, doc: LayoutDocument): History` — replaces `present`, keeps `past`, `future` and `lastKey`; the same object when `doc === history.present`.
  - `slotKey(slot: Slot): string` (now exported, unchanged).
  - `type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"`
  - `interface NodeDragData { kind: "node"; type: string }` and `interface GridZoneData { kind: "grid"; slot: Slot }`
  - `dropTarget(doc: LayoutDocument, active: DragItem, over: DropTarget | null): { id: NodeId; dest: { slot: Slot; cell: { x: number; y: number } } } | null`
  - `targetKey(target: ReturnType<typeof dropTarget>): string | null` — `` `${id}@${slotKey(slot)}:${x},${y}` `` or `null`.
  - `cellPitch(zoneWidth: number, columns: number, grid: GridSettings): { x: number; y: number }` — `{ x: (zoneWidth + gap) / columns, y: rowHeight + gap }`.
  - `resizePlacement(start: GridPlacement, handle: Handle, dx: number, dy: number, pitch: { x: number; y: number }): GridPlacement` — raw, unclamped; `placeNode` clamps and anchors.
  - `pageRows(doc: LayoutDocument, dragging: boolean): number` — `extent(page layouts).rows + (dragging ? 4 : 0)`, at least 4.

- [ ] **Step 1: Write the failing tests**

In `editor-history.test.ts`, `describe("amend")`:

- `amend(h, doc2)` after `commit(h, doc1)`: `present` is `doc2`, `past` has the same length as before, `undo` returns the document from before `doc1`.
- `amend(h, h.present)` returns `h` itself (`toBe`).

In `editor-canvas-math.test.ts` (fixture: `__tests__/__fixtures__/editor-document.json`, deep-frozen as in the other editor tests):

- `dropTarget(doc, { id: "n5", data: { kind: "node", type: "VStack" } }, over)` with `over = { id: "page", data: { kind: "grid", slot: { kind: "page" } }, index: 0, rect: { x: 400, y: 256, width: 384, height: 176 }, zone: { width: 1184, height: 704 } }` → `{ id: "n5", dest: { slot: { kind: "page" }, cell: { x: 4, y: 4 } } }` (pitch 100 × 64).
- Same with `rect.x: 1100` → `cell.x` clamped to `8` (12 − 4).
- `over: null` → `null`; `over.data: { kind: "list" }` → `null`; a slot whose `canPlace` refuses (`n1` into `{ kind: "children", parent: "n2" }`, a Typography) → `null`; an unknown `active.id` → `null`.
- `targetKey` of the first result is `"n5@page:4,4"`; of `null` is `null`.
- `cellPitch(1184, 12, doc.grid)` → `{ x: 100, y: 64 }`.
- `resizePlacement({ x: 2, y: 1, w: 4, h: 3 }, h, dx, dy, { x: 100, y: 64 })` for: `"e", 210, 0` → `{ x: 2, y: 1, w: 6, h: 3 }`; `"w", -100, 0` → `{ x: 1, y: 1, w: 5, h: 3 }`; `"s", 0, 130` → `{ x: 2, y: 1, w: 4, h: 5 }`; `"n", 0, -64` → `{ x: 2, y: 0, w: 4, h: 4 }`; `"se", 100, 64` → `{ x: 2, y: 1, w: 5, h: 4 }`; `"nw", 100, 64` → `{ x: 3, y: 2, w: 3, h: 2 }`; `"e", 40, 0` (under half a cell) → unchanged.
- `pageRows(doc, false)` → `7` (n5 ends at row 7); `pageRows(doc, true)` → `11`; `pageRows(emptyDocument("x"), false)` → `4`.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && npx jest __tests__/editor-history __tests__/editor-canvas-math`
Expected: FAIL — `amend` is not exported, `../editor/canvasMath` not found.

- [ ] **Step 3: Implement**

`dropTarget`: `null` unless `over?.data` is a `GridZoneData`, the node exists and `canPlace(doc, node.type, slot, id)`; the size is `node.layout ?? entryFor(type).defaultSize` with `w` cut to the slot's columns; the cell is `snapCell(over.rect, over.zone.width, { ...doc.grid, columns }, size)`. `resizePlacement`: `dc = Math.round(dx / pitch.x)`, `dr = Math.round(dy / pitch.y)`; a handle containing `e` adds `dc` to `w`, `w` adds `dc` to `x` and subtracts it from `w`, `s` adds `dr` to `h`, `n` adds `dr` to `y` and subtracts it from `h`.

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && npx jest __tests__/editor-`
Expected: PASS, every editor suite.

- [ ] **Step 5: Checkpoint** — ledger line; no commit.

---

### Task 2: Measured rects and the render tree

**Files:**

- Create: `apps/playground/editor/canvas/rects.ts`
- Create: `apps/playground/editor/canvas/RenderTree.tsx`
- Test: `apps/playground/__tests__/editor-render-tree.test.tsx`

**Interfaces:**

- Consumes: `LayoutDocument`, `LayoutNode` (`document.ts`); `entryFor` (`manifest.ts`); library `GridLayout`, `Form`, `Tabs`, `Typography`; `import * as GlowupUI from "@its/glowup-ui"` to resolve a node's `type` (as `site/liveCode.ts` does).
- Produces:
  - `interface Rect { x: number; y: number; width: number; height: number }`
  - `createRects(): Rects` with `set(key: string, rect: Rect): void` (notifies only when the rect changed), `get(key: string): Rect | undefined`, `subscribe(listener: () => void): () => void`; `RectsProvider` (`value: Rects`) and `useRect(key: string): Rect | undefined` (`useSyncExternalStore`). Keys: `inner:<id>` — a grid container's (or the shown tab panel's) inner grid, relative to that node's frame; `child:<id>` — a flow child, relative to its container's frame.
  - `RenderTree({ doc, dimmed, onContentHeight }: { doc: LayoutDocument; dimmed?: NodeId | null; onContentHeight?: (id: NodeId, height: number) => void })` — root `testID="canvas-render"`, `pointerEvents="none"`; page `GridLayout` with the document's `columns`, `rowHeight`, `gap`, `stackBelow="compact"` (the canvas never stacks in phase 3; the Phone width is phase 8).
  - Every node drawn inside a frame `View testID={"frame-" + id}` with `flexGrow: 1` (it fills its grid item and grows past it when its content is taller); a grid container's children inside `View testID={"inner-" + id}` around its own `GridLayout` (`columns` = the node's, `stackBelow="compact"`).
  - `dimmed` draws that node's frame at opacity 0.5 (the dragged original at its landing cells, §11.3.3).
  - Rendering rules: `props` spread; a `text` node gets its `text` as children; a `controlled` entry outside a Form gets `[value]: initial` and a no-op `[onChange]` unless props set them; a `Form` node is the library `Form` with a no-op `onSubmit`; a flow container renders its children in order; a `TabbedPanel` renders `Tabs` with its labels and `activeTab={0}` above its first panel's grid (switching tabs is phase 4); an empty container shows a dashed "Drop components here" placeholder (§11.5). Renderers are `React.memo` by node object, so an untouched subtree does not re-render (§18).

- [ ] **Step 1: Write the failing tests**

Mock `measureInWindow` on `View` by `testID` from a `RECTS` table, as `packages/ui/src/__tests__/drag-drop.test.tsx` does, and render inside `ThemeProvider` + `SafeAreaProvider` + `RectsProvider`. Tests:

- `"draws every node of the fixture with the real components"`: `getByText("Hi")` (Typography), `getByText("Save")` (Button), `getByLabelText("Name")` (the Input), `getByText("A")` and `getByText("B")` (the tab labels); `frame-n1`…`frame-n6` all present.
- `"is inert"`: the `canvas-render` root has `pointerEvents: "none"`.
- `"measures where an inner grid sits in its container"`: with `frame-n1` at `[0, 0, 584, 240]` and `inner-n1` at `[16, 16, 552, 208]`, after `fireEvent(getByTestId("inner-n1"), "layout", …)` `rects.get("inner:n1")` is `{ x: 16, y: 16, width: 552, height: 208 }`.
- `"measures a flow child inside its container"`: `frame-n5` at `[0, 256, 384, 176]`, `frame-n6` at `[0, 256, 384, 40]` → `rects.get("child:n6")` is `{ x: 0, y: 0, width: 384, height: 40 }`.
- **Review Focus 2** `"measures nested grids relative to their own container"`: a document with Paper `p1` ⊃ Paper `p2` ⊃ Paper `p3` ⊃ Typography; with window rects `frame-p1 [0,0,600,400]`, `inner-p1 [16,16,568,368]`, `frame-p2 [16,16,400,300]`, `inner-p2 [32,32,368,268]`, `frame-p3 [32,32,300,200]`, `inner-p3 [48,48,268,168]` → `inner:p1` at `(16,16)`, `inner:p2` at `(16,16)`, `inner:p3` at `(16,16)`.
- `"reports a container's content height"`: `onContentHeight` is called with `("n1", 300)` when `frame-n1`'s layout event reports height 300.
- `"dims the node being placed"`: `dimmed="n1"` → `frame-n1` has opacity 0.5.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && npx jest __tests__/editor-render-tree`
Expected: FAIL — `../editor/canvas/RenderTree` not found.

- [ ] **Step 3: Implement `rects.ts` and `RenderTree.tsx`**

Offsets: on the inner wrapper's (or flow child's) `onLayout`, `measureInWindow` both it and the container's frame and store the difference, so the value holds at any depth and any scroll position.

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && npx jest __tests__/editor-render-tree`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 3: Editor state, edit layer, selection, delete and duplicate, growth

**Files:**

- Create: `apps/playground/editor/canvas/useEditor.ts`
- Create: `apps/playground/editor/canvas/EditLayer.tsx`
- Create: `apps/playground/editor/canvas/Canvas.tsx`
- Test: `apps/playground/__tests__/editor-canvas.test.tsx`

**Interfaces:**

- Consumes: Task 1 (`amend`, `slotKey`, `NodeDragData`, `GridZoneData`), Task 2 (`RenderTree`, `createRects`, `RectsProvider`, `useRect`); `createHistory`, `commit`, `undo`, `redo` (`history.ts`); `removeNode`, `duplicateNode`, `growToFit` (`operations.ts`); library `DragDropProvider`, `Draggable`, `Droppable`, `GridLayout`, `IconButton`, `ScrollArea`, `useDragScroll`.
- Produces:
  - `useEditor(initial: LayoutDocument): Editor` with `interface Editor { doc: LayoutDocument; selected: NodeId | null; select(id: NodeId | null): void; apply(next: LayoutDocument, key?: string): void; amend(next: LayoutDocument): void; undo(): void; redo(): void; canUndo: boolean; canRedo: boolean }` — `apply` commits only when `next !== doc`; `selected` reads `null` whenever that id is no longer in `doc`.
  - `EditLayer({ doc, editor, draft })` — mirrors `doc` (the draft while one exists): the page zone `Droppable id="page" testID="zone-page" data={{ kind: "grid", slot: { kind: "page" } }} indicator={false}`, its `GridLayout` of boxes with the same placements as the render tree; each box a `Draggable id={node.id} testID={"box-" + id} data={{ kind: "node", type }} preview={<rendered node>} onPress={() => select(id)}`; a grid container's box holds, at `useRect("inner:" + id)`, the zone `Droppable id={id} testID={"zone-" + id} data={{ kind: "grid", slot: { kind: "children", parent: id } }} indicator={false}` with its own `GridLayout` of boxes; a flow child's box sits at `useRect("child:" + id)` (flow containers are not drop zones until phase 4). A tap on the page zone's empty area clears the selection.
  - Selection chrome on the selected box: outline, the type label, `IconButton accessibilityLabel="Delete"` → `apply(removeNode(doc, id))`, `IconButton accessibilityLabel="Duplicate"` → `apply(duplicateNode(doc, id).doc)` and select the copy.
  - `Canvas({ editor }: { editor: Editor })` — `RectsProvider` + `DragDropProvider` (moving is Task 4) around a `ScrollArea` spread with `useDragScroll()`, holding the render tree with the edit layer absolutely over it (`StyleSheet.absoluteFill`); the content's minimum height is `pageRows(doc, dragging) × rowHeight + (rows − 1) × gap`. Growth: `RenderTree`'s `onContentHeight` for a node whose manifest kind is `grid`, `flow` or `tabs` calls `editor.amend(growToFit(editor.doc, id, height))`, ignored while a draft exists.

- [ ] **Step 1: Write the failing tests**

Render `Canvas` with a small harness component calling `useEditor(fixture)` and exposing the editor through a ref; same `measureInWindow` mock as Task 2.

- `"selects a node on tap, the innermost under the pointer"`: `fireEvent.press(getByTestId("box-n2"))` → `editor.selected === "n2"`; the label `"Typography"` and the `Delete`/`Duplicate` buttons are shown.
- `"clears the selection on the empty canvas"`: select `n2`, press `zone-page` → `selected` is `null`, no `Delete` button.
- `"deletes and undoes"`: select `n1`, press `Delete` → `frame-n1` and `frame-n2` are gone; `editor.undo()` → both are back.
- `"duplicates below the original and selects the copy"`: select `n5`, press `Duplicate` → the copy (`n7`) has layout `{ x: 0, y: 7, w: 4, h: 3 }` (the first free cell from the row under the original) and is selected.
- **Review Focus 3** `"forgets a selection whose node is gone"`: select `n6`, `editor.apply(removeNode(editor.doc, "n6"))` → `selected` is `null`, no `Delete` button; `editor.undo()` → `n6` is back and still not selected.
- `"grows a container to its content, in the same undo step"`: drop-free case — `editor.apply(setProps(doc, "n2", { variant: "headlineLarge" }))`, then the layout event of `frame-n1` with height 400 → `n1.layout.h` is `7` (`rowsFor(400, 48, 16)`); one `editor.undo()` restores both the prop and `h: 4`.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && npx jest __tests__/editor-canvas.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `useEditor.ts`, `EditLayer.tsx`, `Canvas.tsx`**

`useEditor` keeps a `History` and the selected id in one `useReducer`; `amend` goes through `history.ts`'s `amend`.

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && npx jest __tests__/editor-`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 4: Moving on a grid, with the drawn cells and the landing preview

**Files:**

- Modify: `apps/playground/editor/canvas/Canvas.tsx`, `apps/playground/editor/canvas/EditLayer.tsx`
- Create: `apps/playground/editor/canvas/GridCells.tsx`
- Test: `apps/playground/__tests__/editor-canvas.test.tsx` (new `describe("moving")`)

**Interfaces:**

- Consumes: `dropTarget`, `targetKey`, `cellPitch`, `pageRows` (Task 1); `moveNode` (`operations.ts`); library `useDragState`.
- Produces:
  - `GridCells({ columns, rows, gap, rowHeight, taken, landing }: { columns: number; rows: number; gap: number; rowHeight: number; taken: GridPlacement[]; landing: GridPlacement | null })` — an absolutely filled layer drawing every cell not covered by `taken` (`testID="cell-<x>-<y>"`) and the landing rect (`testID="landing"`), with the Global Constraints' tokens.
  - In `Canvas`: `useDragState((s) => targetKey(dropTarget(doc, s.active, s.over)))` (a re-render per cell crossed, not per pixel, §18); the draft is `moveNode(doc, id, dest)` for that target; `RenderTree` and `EditLayer` draw the draft with `dimmed` = the dragged id; only the zone whose slot is the target's draws `GridCells` (with `rows = pageRows(draft, true)` on the page, the container's own rows inside it). `onDragEnd({ active, over })` → `editor.apply(moveNode(doc, id, dest))` when `dropTarget` is not `null`; `onDragCancel` and a drop outside every zone change nothing.

- [ ] **Step 1: Write the failing tests**

Copy the responder `drag` helper and the `at` point builder from `packages/ui/src/__tests__/drag-drop.test.tsx` (fake timers, 250 ms rest). Window rects: `zone-page [0, 0, 1184, 704]` (pitch 100 × 64), `box-n1 [0, 0, 584, 240]`, `box-n3 [600, 0, 584, 240]`, `box-n5 [0, 256, 384, 176]`; boxes inside containers from their parents' measured offsets.

- `"moves a node to the cell under its preview"`: drag `box-n5` from `[20, 270]` to `[420, 270]`, release → `n5.layout` is `{ x: 4, y: 4, w: 4, h: 3 }`; `editor.canUndo` and one undo puts it back at `x: 0`.
- `"pushes down what it lands on, nothing else moves"`: drag `box-n5` from `[20, 270]` to `[20, 142]` (row 2), release → `n5.layout.y` is `2` and `n1.layout.y` is `5`; `n3` is unchanged.
- `"draws the grid it is over and where the node will land"`: mid-drag (before release) at `[420, 270]` → `getByTestId("landing")` exists, `cell-0-0` does not (n1 covers it), `cell-0-10` exists (four rows below the lowest item); `frame-n5` has opacity 0.5.
- **Review Focus 1** `"leaves the document alone when dropped outside every zone"`: drag `box-n5` to `[2000, 2000]`, release → `editor.doc` is the same object as before and `editor.canUndo` is `false`.
- `"lands in a container's grid"`: add a Typography `t1` to the fixture's page at `{ x: 0, y: 7, w: 4, h: 1 }` (box rect `[0, 448, 384, 48]`); drag it from `[20, 460]` to `[60, 40]`, inside `n1`'s zone (`zone-n1` at `[16, 16, 552, 208]`, 6 columns, pitch ≈ 94.7 × 64) → `t1` is a child of `n1` at `{ x: 0, y: 0, w: 4, h: 1 }`, and `n2` (which it lands on) is pushed to `y: 1`.
- **Review Focus 4** `"one undo restores a move and the growth it caused"`: after the previous drop, fire `frame-n1`'s layout with height 400 → `n1.layout.h` grows; one `editor.undo()` returns `t1` to the page and `n1.layout.h` to `4`.
- `"cancels with the drag"`: start a drag and call the provider's cancel (Escape on the web is the library's; here `fireEvent(box, "responderTerminate")`) → document unchanged, no `landing`.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && npx jest __tests__/editor-canvas.test.tsx -t moving`
Expected: FAIL — no `landing`, layouts unchanged.

- [ ] **Step 3: Implement the draft, `GridCells` and the drop**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && npx jest __tests__/editor-`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 5: Resize handles

**Files:**

- Create: `apps/playground/editor/canvas/ResizeHandles.tsx`
- Modify: `apps/playground/editor/canvas/EditLayer.tsx`, `apps/playground/editor/canvas/Canvas.tsx`
- Test: `apps/playground/__tests__/editor-canvas.test.tsx` (new `describe("resizing")`)

**Interfaces:**

- Consumes: `resizePlacement`, `cellPitch`, `Handle` (Task 1); `placeNode` (`operations.ts`).
- Produces: `ResizeHandles({ pitch, onResize }: { pitch: { x: number; y: number }; onResize: (handle: Handle, dx: number, dy: number, done: boolean) => void })` — eight handles, `testID="handle-<handle>"`, accessibility labels `"Resize <handle>"`, each a responder pan (grant, move with `pageX`/`pageY` deltas from the grant, release/terminate) shown only on a selected node that has a `layout`. `Canvas` turns a pan into the draft `placeNode(doc, id, resizePlacement(start, handle, dx, dy, pitch))` (drawn like a move's draft, with the cells of that grid), commits it on `done`, drops it on terminate. The pitch uses the node's slot width: the page zone's, or the container's `inner:` rect width.

- [ ] **Step 1: Write the failing tests**

Select `n5` (VStack, `{ x: 0, y: 4, w: 4, h: 3 }`, manifest `minSize`), then drive a handle with `fireEvent(handle, "responderGrant", at(x, y))`, `responderMove`, `responderRelease`:

- `"widens to whole cells from the right edge"`: `handle-e` by `dx = 210` → `{ x: 0, y: 4, w: 6, h: 3 }`; one undo → `w: 4`.
- `"grows downwards from the bottom edge, pushing down"`: put Typography `t1` at `{ x: 0, y: 7, w: 4, h: 1 }`; `handle-s` by `dy = 130` → `n5.h` is `5`, `t1.y` is `9`.
- **Review Focus 5** `"clamps at the grid's edge and at the minimum size"`: `handle-w` by `dx = -500` → `{ x: 0, y: 4, w: 4, h: 3 }` (the right edge stays at 4); `handle-e` by `dx = -2000` → `w` is `n5`'s `minSize.w`.
- `"shows the size live and lets go on cancel"`: after a `responderMove` without release the render tree's `frame-n5` grid item already spans the new width; `responderTerminate` → layout back to `w: 4`, no history step.
- `"has no handles on a flow child"`: select `n6` → no `handle-e`.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && npx jest __tests__/editor-canvas.test.tsx -t resizing`
Expected: FAIL — no `handle-e`.

- [ ] **Step 3: Implement `ResizeHandles.tsx` and wire it**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && npx jest __tests__/editor-`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 6: The `/templates/editor` page, its starter and toolbar; docs; browser pass

**Files:**

- Create: `apps/playground/app/templates/editor.tsx`
- Create: `apps/playground/editor/canvas/Toolbar.tsx`
- Create: `apps/playground/editor/starters/detail.json` — "Pagina di dettaglio" (§12): two Papers of label/value Typography pairs on a 12-column page, a Card holding a VStack of Buttons, a TabbedPanel ("Prodotto", "Dati aggiuntivi") with Inputs in its first panel; it must pass `checkDocument` with no message.
- Modify: `apps/playground/app/templates/index.tsx` (a "New layout" link to `/templates/editor`)
- Modify: `apps/playground/CLAUDE.md` ("The layout editor's core": `editor/canvas/` holds the views; the two trees; drafts)
- Modify: `docs/superpowers/specs/2026-10-26-layout-editor-design.md` §19 (phase 3 **Done**, with the date)
- Test: `apps/playground/__tests__/editor-page.test.tsx`

**Interfaces:**

- Consumes: `Canvas`, `useEditor` (Task 3); `useHydrated` (`site/useHydrated.ts`); `checkDocument` (`check.ts`).
- Produces: the route; `Toolbar({ editor })` with the layout's name and `IconButton`s `accessibilityLabel="Undo"` / `"Redo"`, disabled when `canUndo` / `canRedo` is false.

- [ ] **Step 1: Write the failing tests**

- `"opens the starter on the canvas"`: render the route inside `ThemeProvider` + `SafeAreaProvider` (1280 × 900) → after hydration, a node of the starter is on screen (one of its Typography texts) and the name "Pagina di dettaglio" is in the toolbar.
- `"renders nothing editable before hydration"`: with `useHydrated` mocked to `false`, no `zone-page` (the prerendered HTML holds no editor state, §14).
- `"undoes and redoes from the toolbar"`: select a node, press `Delete`, press `Undo` → the node is back and `Redo` is enabled; press `Redo` → gone again.
- `"the starter is a sound document"`: `checkDocument(detail)` is `[]`.
- `"the gallery links to the editor"`: `app/templates/index.tsx` renders a link whose `href` is `/templates/editor`.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && npx jest __tests__/editor-page`
Expected: FAIL — route not found.

- [ ] **Step 3: Implement the route, toolbar, starter and link; update `CLAUDE.md` and §19**

- [ ] **Step 4: Run the editor tests, then everything**

Run: `cd apps/playground && npx jest __tests__/editor-`
Expected: PASS.
Run: `cd ../.. && npm run type-check && npm run lint && npm test -w @its/glowup-playground -- --maxWorkers=2`
Expected: all green (the full playground run can time out under load: rerun with `--maxWorkers=2`).

- [ ] **Step 5: Browser pass** (spec §19: "desktop mouse and phone-sideways touch")

`CI=1 npx expo start --web --port 8099` (no file watching: restart after edits), Playwright screenshots under `c:/dev/Glowup/.playwright-mcp` (delete the folder afterwards):

1. 1440 × 900, mouse: select a Paper (outline, label, buttons), move it two cells right (cells and landing drawn, items pushed down), resize it from its right edge, move a Typography from the page into a Paper's grid, undo each.
2. 720 × 1280 viewport with touch emulation: the same move by a resting touch; the page does not scroll under the finger, and the canvas scrolls when the finger nears its bottom edge.
3. A generated 150-node document (Papers of Typography on the page): a move re-renders only the grid under the pointer, once per cell (React DevTools profiler, spec §18); record the numbers in the handoff.

- [ ] **Step 6: Handoff and checkpoint**

Add a section to `docs/handoff/2026-10-29.md` (Italian, one handoff per day): what landed, what was checked in the browser, open questions.
