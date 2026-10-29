# Layout editor, plan 4: palette, flow containers, tabs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 4 of the spec: add components from a palette (drag, or tap to add), drop into flow containers at the insertion line, switch a TabbedPanel's panel on the canvas (by tap, and by hovering a tab while dragging), and move nodes between grids, flow containers and tab panels.

**Architecture:** Plan 3's drop plan (`dropTarget` → `{ id, dest }`) becomes a plan with a **source** (a node already in the document, or a new component of a type) and a **destination** of three kinds of zone — a grid (place by cell), a flow container (place by index, the drag and drop system's insertion line), a tab (that panel's first free cell). One pure `applyPlan` turns it into the next document, for the draft drawn during the drag and for the drop alike. Which panel of each TabbedPanel is shown is editor state, not document. The palette lives inside the canvas's `DragDropProvider`, as a left column.

**Tech Stack:** TypeScript, React Native + react-native-web, `@its/glowup-ui` (`DragDropProvider`/`Draggable`/`Droppable`/`useDragState`, `GridLayout`, `gridLayoutHeight`, `Tabs`, `SearchBar`, `ScrollArea`), jest-expo + RNTL 14.

**Spec:** `docs/superpowers/specs/2026-10-26-layout-editor-design.md` (§2 "Add", §8, §11.5, §13 "Palette", §19 phase 4). Builds on plan 3 (`docs/superpowers/plans/2026-10-29-layout-editor-3-canvas.md`, its ledger rulings and `apps/playground/CLAUDE.md` "The canvas").

## Global Constraints

- Everything in plan 3's Global Constraints still holds: library imported by name only, no new dependencies, `editor/*.ts` pure, views in `editor/canvas/`, real components drawn inert, tokens for every visual, one undo step per edit, growth amends, no commits (the user commits).
- The edit layer stays on the committed document during a drag (plan 3 ruling); only the render tree, cells, landing and the drag system's insertion line show where a drop will land.
- Palette (§13): "the manifest grouped by the catalogue's categories, with search; each entry is a `Draggable`". The groups are the entries' `palette.group`, in manifest order, which already follows `CATEGORIES` (`catalogue/categories.ts`): Foundations, Actions, Inputs, Data Display, Feedback, Navigation, Layout.
- Tap to add (§2): "a tap on a palette item adds it at the first free place of the selected container, or of the page".
- Flow container (§11.5): "dropping into it shows the drag and drop system's insertion line and inserts at that index"; moving into a flow container drops `layout`, out of one onto a grid gives `defaultSize` (already in `moveNode`).
- TabbedPanel (§11.5): "a tap switches the panel being edited. Only the shown panel's grid is a drop zone; its height is the tallest panel's, so switching tabs never moves the page. Hovering a tab while dragging switches to it after half a second" — **500 ms**.
- The page still shows the palette as a column at every width (ruling: the 600–1320 dp side sheet and the compact rules are phase 8).

## Review Focus

1. **A node dropped over a container that does not take its type** (a Button over a `ListSection`, which takes `ListItem`; a Form over a Form): the drag system leaves a refusing zone out of its targets, so the drop lands on the zone beneath (here the page, where the cells show it), never inside the container — test in Task 3.
2. **A tab hovered for less than 500 ms** (the pointer passes over it) or a drag cancelled while hovering: the panel does not switch — test in Task 3.
3. **A flow child dropped back at its own place**: the document is the same object and history gains no step — tests in Task 1 (model) and Task 3 (canvas).
4. **The open tab of a TabbedPanel that lost tabs** (a removed tab, an undo): the shown panel clamps to the last one instead of rendering nothing or throwing — test in Task 2.
5. **Tap to add with a selected node that cannot take the type** (a leaf; a `ListSection` and a Button): it goes to the page's first free cell instead of being refused — test in Task 4.

---

### Task 1: The model and the maths of a drop

**Files:**

- Modify: `apps/playground/editor/operations.ts` (export `createNode`; `moveNode` within a flow at the same place returns `doc`)
- Modify: `apps/playground/editor/canvasMath.ts`
- Test: `apps/playground/__tests__/editor-operations.test.ts`, `apps/playground/__tests__/editor-canvas-math.test.ts`

**Interfaces:**

- Produces in `operations.ts`: `createNode(doc: LayoutDocument, type: string): LayoutNode` (today's private `create`, renamed and exported; `insertNode` keeps using it).
- Produces in `canvasMath.ts` (replacing plan 3's `DropPlan`, `GridZoneData`):
  - `interface NewDragData { kind: "new"; type: string }` (beside `NodeDragData`)
  - `interface ZoneData { kind: "grid" | "flow" | "tab"; slot: Slot }`
  - `type DragSource = { kind: "node"; id: NodeId } | { kind: "new"; type: string }`
  - `interface DropPlan { source: DragSource; dest: Destination }`
  - `dropTarget(doc, active: DragItem, over: DropTarget | null): DropPlan | null` — grid zone → `{ slot, cell }` (plan 3's snapping, size from the node or `defaultSize`); flow zone → `{ slot, index: over.index }`; tab zone → `{ slot, index: 0 }` (a grid by index lands on the first free cell); `null` when the zone is unknown, the source type is unknown, or `canPlace` refuses.
  - `applyPlan(doc, plan: DropPlan): { doc: LayoutDocument; id: NodeId }` — `moveNode` for a node (`id` = the node's), `insertNode` for a new one (`id` = the new id; `""` and the same `doc` when refused).
  - `targetKey(plan: DropPlan | null): string | null` — `` `${source}@${slotKey(slot)}` `` + `` `:${x},${y}` `` for a cell or `` `#${index}` `` for an index, where `source` is the node id or `` `new:${type}` ``.
  - `shownTab(node: LayoutNode, tabs: Record<NodeId, number>): number` — `tabs[node.id] ?? 0`, clamped to `[0, node.tabs.length - 1]`.
  - `addTarget(doc, type: string, selected: NodeId | null, tabs: Record<NodeId, number>): Destination` — into the selected node when it is a container that `canPlace` the type: a grid → `{ slot: children, index: 0 }`, a flow → its children at the end, a TabbedPanel → its shown panel, `index: 0`; otherwise `{ slot: { kind: "page" }, index: 0 }`.

- [ ] **Step 1: Write the failing tests**

Operations (fixture, deep-frozen):

- `createNode(doc, "Paper")` → `{ id: "n7", type: "Paper", props: {}, columns: 6, children: [] }`.
- **Review Focus 3** `moveNode(doc, "n6", { slot: { kind: "children", parent: "n5" }, index: 0 })` is `toBe(doc)`.

Canvas maths (fixture; `over` built as in plan 3's tests: `zone: { width: 1184, height: 704 }`, pitch 100 × 64):

- new Input over the page at `rect { x: 400, y: 256 }` → `{ source: { kind: "new", type: "Input" }, dest: { slot: { kind: "page" }, cell: { x: 4, y: 4 } } }`.
- node `n2` over a flow zone `{ kind: "flow", slot: { kind: "children", parent: "n5" } }` with `index: 1` → `dest: { slot: <that>, index: 1 }`.
- node `n2` over a tab zone `{ kind: "tab", slot: { kind: "tab", parent: "n3", tab: 1 } }` → `dest: { slot: <that>, index: 0 }`.
- refused → `null`: a new `Form` over a zone whose slot is inside a Form (fixture plus a Form `f1` on the page, zone `{ kind: "grid", slot: { kind: "children", parent: "f1" } }`); a new `"Nope"`; a new `Button` over a flow zone of a `ListSection` `ls` (fixture plus `{ id: "ls", type: "ListSection", props: {}, layout: { x: 0, y: 7, w: 4, h: 3 }, children: [] }`).
- `applyPlan` of the new Input plan → `id: "n7"`, `findNode(result.doc, "n7").layout` is `{ x: 4, y: 4, w: 4, h: 2 }`; of a move plan for `n5` → `id: "n5"`.
- `targetKey`: the new Input plan → `"new:Input@page:4,4"`; the `n2` flow plan → `"n2@children:n5:#1"`; `null` → `null`.
- `shownTab(n3, { n3: 5 })` → `1`; `shownTab(n3, {})` → `0`.
- `addTarget`: `selected` `null` → `{ slot: { kind: "page" }, index: 0 }`; `"n1"` (Paper) → `{ slot: { kind: "children", parent: "n1" }, index: 0 }`; `"n5"` (VStack) → `{ slot: { kind: "children", parent: "n5" }, index: 1 }`; `"n3"` with `{ n3: 1 }` → `{ slot: { kind: "tab", parent: "n3", tab: 1 }, index: 0 }`; `"n2"` (Typography) → the page; `"ls"` with type `"Button"` → the page.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && npx jest __tests__/editor-operations __tests__/editor-canvas-math`
Expected: FAIL — `createNode`, `applyPlan`, `shownTab`, `addTarget` missing; `dropTarget` returns the old shape.

- [ ] **Step 3: Implement**

`moveNode`: when the node's slot equals `dest.slot`, the slot is a flow (`slotColumns` is `null`) and `dest.index` equals the node's current index, return `doc`. Plan 3's callers of `DropPlan.id` (`Canvas.tsx`) move to `plan.source` / `applyPlan(...).id` in Task 3; until then keep `npx tsc --noEmit` passing by updating `Canvas.tsx` to the new shape with no behaviour change (a node source only).

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && npx jest __tests__/editor- && npx tsc --noEmit`
Expected: PASS, no type error.

- [ ] **Step 5: Checkpoint**

---

### Task 2: Tabs on the canvas — the shown panel, the tab bar, tap to switch

**Files:**

- Modify: `apps/playground/editor/canvas/useEditor.ts`, `RenderTree.tsx`, `EditLayer.tsx`, `Canvas.tsx`
- Test: `apps/playground/__tests__/editor-canvas.test.tsx` (new `describe("tabs")`), `apps/playground/__tests__/editor-render-tree.test.tsx`

**Interfaces:**

- Consumes: `shownTab` (Task 1); library `gridLayoutHeight`.
- Produces:
  - `Editor` gains `tabs: Record<NodeId, number>` and `showTab(id: NodeId, tab: number): void` (canvas state, never in the document or history).
  - `RenderTree` gains `tabs?: Record<NodeId, number>`: a TabbedPanel draws `Tabs` with `fullWidth` (equal-width tabs, so the edit layer can lay its tab targets evenly) and `activeTab={shownTab(...)}` inside a `View testID={"bar-" + id}` measured into `bar:<id>` (relative to the node's frame, like `inner:`), then the shown panel's grid as its `inner:<id>`, with `minHeight` = the largest `gridLayoutHeight(panel layouts, rowHeight, gap)` over all panels.
  - `EditLayer`: a TabbedPanel's inner zone is the shown panel's (`{ kind: "tab", parent, tab: shown }`, data `{ kind: "grid", slot }`); over `bar:<id>` a row of equal-width tab targets, one per tab, each a `Droppable id={"tab:" + id + ":" + i} testID={"tab-" + id + "-" + i}` with data `{ kind: "tab", slot: { kind: "tab", parent: id, tab: i } }`, `indicator={false}`, `accept={accepting(doc, slot)}`, holding a tap view (`accessibilityLabel={label + " tab"}`, responder like plan 3's `tap-<id>`) that calls `showTab(id, i)`.

- [ ] **Step 1: Write the failing tests**

- Render tree `"shows the panel the editor opened"`: `tabs={{ n3: 1 }}` → no `frame-n4`, the placeholder "Drop components here" inside `inner-n3`.
- Render tree `"keeps the tallest panel's height"`: with `tabs={{ n3: 1 }}` (panel B empty) `inner-n3` has `minHeight` `112` (panel A's `n4` is 2 rows: 2 × 48 + 16).
- Canvas `"taps a tab to edit its panel"`: after measuring `bar-n3` (window rects `frame-n3 [600, 0, 584, 240]`, `bar-n3 [600, 0, 584, 48]`), tap the view labelled `"B tab"` → `editor.tabs.n3 === 1`, `frame-n4` gone; tap `"A tab"` → back.
- Canvas **Review Focus 4** `"shows the last panel when the open one is removed"`: `showTab("n3", 1)`, then `editor.apply(removeTab(editor.doc, "n3", 1))` → `frame-n4` is drawn again, no error.
- Canvas `"opening a tab is not an edit"`: after `showTab`, `editor.canUndo` is `false`.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && npx jest __tests__/editor-render-tree __tests__/editor-canvas -t "tab"`
Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && npx jest __tests__/editor-`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 3: Drops into flow containers, onto tabs, and between containers

**Files:**

- Modify: `apps/playground/editor/canvas/EditLayer.tsx`, `Canvas.tsx`
- Test: `apps/playground/__tests__/editor-canvas.test.tsx` (new `describe("between containers")`)

**Interfaces:**

- Consumes: `dropTarget`, `applyPlan`, `targetKey` (Task 1); tab targets and `showTab` (Task 2).
- Produces:
  - A flow container's box holds a `Droppable id={id} testID={"zone-" + id}` filling it, data `{ kind: "flow", slot: { kind: "children", parent: id } }`, `orientation` `"horizontal"` for a `row` manifest `direction`, else `"vertical"`, the insertion line on (the default), `accept` through `canPlace`; its children's boxes are inside it, so the drag system counts them for `over.index`.
  - `Canvas`: the draft is `applyPlan(doc, plan).doc`; `dimmed` and the landing use `applyPlan(...).id`; the landing exists only for a grid slot (`slotColumns !== null`) — a flow drop shows the insertion line instead. `onDragEnd` commits the drawn draft (plan 3's `drawnRef`, keyed by the new `targetKey`) and selects the result's `id` when the source was new.
  - Hover to switch: a tab target under a dragged item for **500 ms** calls `showTab`; leaving it, the drag ending or cancelling first cancels the timer (`useDragState((s) => s.over?.id === zoneId)` plus a timeout in an effect).

- [ ] **Step 1: Write the failing tests**

Window rects as in plan 3 (`placeBoxes()`), plus the zones each test uses. A page Typography `t1` at `{ x: 0, y: 7, w: 4, h: 1 }` (box `[0, 448, 384, 48]`) as in plan 3's `withTypography()`.

- `"drops a page node into a stack at the insertion line"`: `zone-n5 [0, 256, 384, 176]`, `box-n6 [0, 256, 384, 40]` (measured as `child:n6`); drag `box-t1` from `[20, 460]` to `[20, 262]` (above n6's middle) → `n5.children` ids `["t1", "n6"]`, `t1.layout` is `undefined`.
- `"takes a stack's child out onto the page"`: drag `box-n6` from `[20, 270]` to `[520, 600]` (page, outside n5) → `slotOf(n6)` is the page and its layout is `w: 3, h: 1` (Button's `defaultSize`).
- `"reorders inside a stack"`: n5 holding `b1`, `b2` (`frame-b1 [0, 256, 384, 40]`, `frame-b2 [0, 304, 384, 40]`, boxes the same); drag `box-b2` from `[20, 320]` to `[20, 262]` → `["b2", "b1"]`.
- **Review Focus 3** `"a drop at the same place in a stack changes nothing"`: drag `box-b1` from `[20, 270]` to `[20, 272]` → `editor.doc` unchanged (`toBe`), `canUndo` false.
- `"drops onto a tab, into that panel"`: `tab-n3-1 [892, 0, 292, 48]`; drag `box-t1` onto `[1000, 20]` → `slotOf(t1)` is `{ kind: "tab", parent: "n3", tab: 1 }`, layout `{ x: 0, y: 0, w: 4, h: 1 }`.
- `"switches to a tab hovered for half a second"`: drag `box-t1` over `[1000, 20]`, `act(() => jest.advanceTimersByTime(500))` → `editor.tabs.n3 === 1`.
- **Review Focus 2** `"does not switch for a tab only passed over"`: over `[1000, 20]`, advance 300 ms, move to `[20, 600]`, advance 500 ms → `editor.tabs.n3` is not `1`; and a drag cancelled (`responderTerminate`) after 300 ms over the tab, then 500 ms → not `1`.
- **Review Focus 1** `"drops through a container that does not take the type"`: a `ListSection` `ls` at `{ x: 4, y: 4, w: 4, h: 3 }` (`zone-ls [400, 256, 384, 176]`); drag the Button `box-n6` from `[20, 270]` to `[440, 290]` → `slotOf(n6)` is the page, `ls.children` is still empty.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && npx jest __tests__/editor-canvas -t "between containers"`
Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && npx jest __tests__/editor-`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 4: The palette

**Files:**

- Create: `apps/playground/editor/canvas/Palette.tsx`
- Modify: `apps/playground/editor/canvas/Canvas.tsx` (a `palette?: React.ReactNode` drawn as a 280 dp left column inside the providers), `apps/playground/app/templates/editor.tsx`
- Test: `apps/playground/__tests__/editor-palette.test.tsx`

**Interfaces:**

- Consumes: `MANIFEST` (`manifest.ts`); `createNode`, `insertNode` (`operations.ts`); `addTarget`, `NewDragData` (Task 1); `NodePreview` (`RenderTree.tsx`); `Editor` (with `tabs`).
- Produces: `Palette({ editor }: { editor: Editor })` — a `SearchBar` (placeholder `"Search components"`) over a `ScrollArea` of groups by `palette.group` in manifest order (a group label, then its entries; a group with no match is not drawn; nothing matches → `"No components match"`). Each entry: `Draggable id={"new:" + type} testID={"palette-" + type} data={{ kind: "new", type }}` with `preview={<NodePreview node={createNode(doc, type)} grid={doc.grid} />}` and `onPress` = tap to add: `insertNode(doc, type, addTarget(doc, type, editor.selected, editor.tabs))`, then `apply` and `select` the new id; its content is the entry's `palette.icon` and the type's name. Search matches the type name, case-insensitive substring.

- [ ] **Step 1: Write the failing tests**

Render `Canvas` with `palette={<Palette editor={editor} />}` in plan 3's harness.

- `"lists every palette component under its catalogue group"`: the labels `"Foundations"`, `"Inputs"`, `"Layout"` are shown; `palette-Paper`, `palette-TabbedPanel`, `palette-VStack`, `palette-Form` exist; the number of `palette-*` entries equals `Object.keys(MANIFEST).length`.
- `"filters by name"`: `changeText` `"inp"` → `palette-Input` and `palette-InputArea` present, `palette-Paper` absent; `"zzz"` → `"No components match"`.
- `"adds on the page's first free cell with a tap"`: tap `palette-Input` (press capture, grant, release as the library's tap test) → `n7` with layout `{ x: 4, y: 4, w: 4, h: 2 }`, `editor.selected === "n7"`, one undo removes it.
- `"adds into the selected container with a tap"`: select `n1`, tap `palette-Typography` → `n7` in `n1` at `{ x: 0, y: 1, w: 6, h: 1 }`.
- **Review Focus 5** `"adds to the page when the selection cannot take it"`: with `ls` (a `ListSection`) selected, tap `palette-Button` → the new Button's slot is the page.
- `"drags a component from the palette onto the page"`: `palette-Input` at `[-280, 100, 260, 40]`, drag from `[-200, 120]` to `[480, 276]` (the entry's corner lands on `(400, 256)`, the grab offset carried as for a node) → a new Input at `{ x: 4, y: 4, w: 4, h: 2 }`, selected.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && npx jest __tests__/editor-palette`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Palette.tsx` and the column; the route passes it**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && npx jest __tests__/editor-`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 5: Docs, full run, browser pass

**Files:**

- Modify: `apps/playground/CLAUDE.md` ("The canvas": sources and zone kinds, tab state, the palette), `docs/superpowers/specs/2026-10-26-layout-editor-design.md` §19 (phase 4 **Done** with the date), `docs/handoff/2026-10-29.md` (a section in Italian), `docs/README.md` (this plan's row)

- [ ] **Step 1: Everything**

Run: `cd apps/playground && npx jest __tests__/editor- && npx tsc --noEmit`, then `npm test -w @its/glowup-playground -- --maxWorkers=2` from the root, and ESLint + Prettier on the changed files (the repo-wide lint does not finish locally while `ds-bundle/` exists; plan 3 note).
Expected: all green.

- [ ] **Step 2: Browser** (`CI=1 npx expo start --web --port 8099`, restart after edits; screenshots under `c:/dev/Glowup/.playwright-mcp`, deleted afterwards)

1. 1440 × 900, mouse: drag Input from the palette onto the page (cells and landing drawn, the new node selected); drag a Button into the Card's VStack (insertion line drawn, the Button lands at the line); take it back out onto the page; tap "Dati aggiuntivi" on the TabbedPanel, drop a Typography in that panel, switch back; drag a node over the other tab and hold half a second (the panel switches). No console errors.
2. 1024 × 768 with touch emulation: the palette column and the canvas side by side; a resting touch on a palette entry lifts it onto the canvas.

- [ ] **Step 3: Checkpoint and handoff**
