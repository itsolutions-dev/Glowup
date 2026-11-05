# Layout editor, plan 8: responsive editor, keyboard, device checklist — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 8 of the spec: the editor works at every window width (three columns, side sheets, the phone arrangement), every edit has its keyboard shortcut (listed in the site's shortcuts dialog), and the iOS / Android pass has a written checklist to run on devices.

**Architecture:** The site's shortcut layer learns two things: a Shift modifier, and shortcuts a page registers for itself (`usePageShortcuts`, shown in the dialog's "This page" group). The editor's keys are pure (`editor/keys.ts`: a key and the document in, the next document out) and bound by the route. The arrangement is one function of the window width in `site/breakpoints.ts` (the only place that compares a width to a number): `columns` (≥ 1400), `sheets` (600–1399), `compact` (< 600). In `sheets` the side and properties panels become overlays toggled from the toolbar, one at a time, hidden (not unmounted) while something is dragged; in `compact` the canvas follows the phone rules already built in plan 4b, with the panels in bottom sheets and a banner.

**Tech Stack:** TypeScript, React Native + react-native-web, `@its/glowup-ui` (`BottomSheet`, `Banner`, `IconButton`, `DragDropProvider`'s `onDragStart`), the site's `useKeyboardShortcuts` / `ShortcutsDialog` / `useLayout`, jest-expo + RNTL 14.

**Spec:** `docs/superpowers/specs/2026-10-26-layout-editor-design.md` — §14 ("Keyboard (web): Delete/Backspace, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+D duplicate, arrows move the selected node one cell on its grid, Shift+arrows resize it, Escape deselects or cancels a drag. Listed in the site's shortcuts dialog like the others"), §17 (responsive editor), §19 phase 8, §20 ("Browser … desktop mouse, touch at 720 dp, the upright-phone mode at 390"; "Native: a manual checklist on an iPhone and an Android device").

## Global Constraints

- §17: three columns "only while the canvas keeps at least 720 dp". With the rail (80) and the panels (280 + 320), that is a window of **1400 dp** (the spec's "about 1320" predates the rail): `columns` from 1400, `sheets` from 600, `compact` below.
- §17 sheets: "canvas full width; palette, layers and properties open one at a time as a side sheet; a drag that starts in the sheet closes it so the canvas is reachable." The sheet is hidden but stays mounted during the drag (an unmounted active `Draggable` cancels the drag — plan 4's finding).
- §17 compact: "the canvas shows the phone arrangement (stacked …), and editing is everything that does not need aiming at a cell: tap to select, properties in a bottom sheet, add from a bottom-sheet palette …, delete, duplicate, 'Move into…' from Layers, undo and redo. A banner says 'Turn the phone sideways to move and resize'. No drag and no handles on the grid." The width switch is hidden there (the canvas is the phone).
- §14 keyboard as quoted above; shortcuts never fire while typing in a field (the site's rule); arrows and Shift+arrows act only on a node placed on a grid, through `placeNode` (the same rules as dragging), consecutive presses on one node one undo step.
- The site's rule stays: only `site/breakpoints.ts` compares a width to a number.
- Unchanged: library by name only, `editor/*.ts` pure, tokens, no new dependency, no commits (the user commits).

## Review Focus

1. **A shortcut pressed while typing in a panel field** (Backspace in "Text", Ctrl+Z in a JSON field): the field gets it, the document does not change — test in Task 2.
2. **Ctrl+Shift+Z versus Ctrl+Z, and Shift+arrows versus arrows**: each does its own action, never the other — tests in Tasks 1 and 2.
3. **Arrows with nothing selected, or a flow child selected, or at the grid's edge**: nothing happens (no error, no undo step) — test in Task 2.
4. **A drag started from the palette sheet**: the sheet gets out of the way and the drag goes on to the drop — test in Task 3.
5. **Crossing a breakpoint with a sheet open or a node selected** (rotating a tablet): nothing is lost — the selection stays, at most the sheet closes — test in Task 3.

---

### Task 1: The site's shortcuts — Shift and page shortcuts

**Files:**

- Modify: `apps/playground/site/useKeyboardShortcuts.ts`, `apps/playground/site/SiteShell.tsx`, `apps/playground/site/ShortcutsDialog.tsx`
- Test: `apps/playground/__tests__/site-shortcuts.test.tsx` (new)

**Interfaces:**

- Produces:
  - `Shortcut` gains `shift?: boolean` — when given, `event.shiftKey` must equal it; when left out, Shift is not looked at (today's behaviour, which "?" relies on). Arrow keys keep their `event.key` names (`"ArrowUp"`…).
  - A pure `matchShortcut(shortcuts: Shortcut[], event: { key; metaKey; ctrlKey; shiftKey; altKey }, typing: boolean): Shortcut | undefined` (what the listener uses, testable without a DOM).
  - `usePageShortcuts(shortcuts: Shortcut[]): void` exported from `SiteShell.tsx`: a page's own shortcuts, bound with the shell's and listed in `ShortcutsDialog` under "This page" while the page is mounted.

- [ ] **Step 1: Write the failing tests** — `matchShortcut`: Ctrl+Shift+Z picks the `shift: true` "z" over the plain one, and Ctrl+Z the plain one; "?" still matches with Shift held; nothing matches while typing unless `whileTyping`; Alt never matches. A page that calls `usePageShortcuts([{ key: "Delete", label: "Del", description: "Delete the selection" }])` inside `SiteShell` → the shortcuts dialog shows "Delete the selection" under "This page"; after unmount it is gone.
- [ ] **Step 2: Run them to verify they fail** — `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/site-shortcuts` → FAIL.
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run them to verify they pass** — the same command, and `__tests__/` files that render `SiteShell` → PASS.
- [ ] **Step 5: Checkpoint**

---

### Task 2: The editor's keys

**Files:**

- Create: `apps/playground/editor/keys.ts`
- Modify: `apps/playground/app/templates/editor.tsx` (registers them with `usePageShortcuts`)
- Test: `apps/playground/__tests__/editor-keys.test.ts`, `apps/playground/__tests__/editor-page.test.tsx`

**Interfaces:**

- Produces: `nudge(doc: LayoutDocument, id: NodeId | null, key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight", resize: boolean): LayoutDocument` — the selected node one cell over (`x`/`y` ±1) or one cell bigger or smaller (`w`/`h` ±1) through `placeNode`; `doc` itself for no selection, a node without `layout`, or a move `placeNode` refuses.
- The route's shortcuts (labels as the dialog shows them): Delete and Backspace "Delete the selection" (`removeNode`), ⌘/Ctrl+Z "Undo", ⌘/Ctrl+Shift+Z "Redo", ⌘/Ctrl+D "Duplicate the selection" (selects the copy), the four arrows "Move the selection one cell", Shift + the four arrows "Resize the selection", Escape "Clear the selection" (the drag system already cancels a drag on Escape). Arrow steps use the undo key `nudge:<id>`.

- [ ] **Step 1: Write the failing tests** — `nudge` on the fixture: `n1` right → `x` 1… (`placeNode`'s result), Shift+right → `w` 7; no selection, `n6` (a flow child), `n1` left at `x` 0 → `toBe(doc)`. Page: select `n1` through Layers; a `keydown` dispatched on `document` is not available in jest, so the page test drives the registered shortcuts through `matchShortcut` and their `run` (exported for tests by the route as `editorShortcuts(editor)`): "Delete" removes `n1`; "z" with meta undoes; with meta and shift redoes; while typing (Review Focus 1) nothing matches.
- [ ] **Step 2: Run them to verify they fail**
- [ ] **Step 3: Implement `editor/keys.ts` and `editorShortcuts(editor): Shortcut[]` in the route; register them**
- [ ] **Step 4: Run them to verify they pass** — `__tests__/editor-` and tsc.
- [ ] **Step 5: Checkpoint**

---

### Task 3: The arrangement at every width

**Files:**

- Modify: `apps/playground/site/breakpoints.ts` (`editorArrangement`), `apps/playground/app/templates/editor.tsx`, `apps/playground/editor/canvas/Toolbar.tsx`, `apps/playground/editor/canvas/Canvas.tsx` (`onDragStart`)
- Create: `apps/playground/editor/canvas/Sheet.tsx`
- Test: `apps/playground/__tests__/editor-page.test.tsx`, `apps/playground/__tests__/site-shell.test.ts` (or a breakpoints test)

**Interfaces:**

- Produces:
  - `editorArrangement(width: number): "columns" | "sheets" | "compact"` in `site/breakpoints.ts` (1400 / 600).
  - `Sheet({ side: "left" | "right"; open: boolean; hidden: boolean; children })`: an overlay over the canvas's edge (280 or 320 dp, surface, elevation), drawn only while `open`; `hidden` (during a drag) keeps it mounted but invisible and not touchable.
  - In `sheets`: the toolbar gains toggles "Add", "Layers", "Properties" (one sheet at a time; selecting a node on the canvas does not open Properties by itself); `Canvas` gains `onDragStart`, and the route hides the open sheet from a drag's start to its end.
  - In `compact`: the device is the phone whatever the switch said (the switch hidden), a `Banner` "Turn the phone sideways to move and resize", and the palette/layers and properties in `BottomSheet`s opened from the toolbar.

- [ ] **Step 1: Write the failing tests** — `editorArrangement(1440) === "columns"`, `(1399)` and `(600)` `"sheets"`, `(599)` `"compact"`. Page at a window of 1024 (`Dimensions` mocked as the site's tests do): no Properties column; pressing "Properties" with `n1` selected shows its panel; pressing "Add" closes it and shows the palette (Review Focus 5's "one at a time"). A palette drag started from the open sheet (Review Focus 4): after `onDragStart` the sheet is hidden but `palette-Input` is still mounted, and the drop adds the Input. Page at 390: the banner shows, `box-n1` is disabled (no drag), no width switch, tap a box then "Properties" opens the bottom sheet with its header. Crossing from 1024 to 1440 with `n1` selected (Review Focus 5): `editor.selected` stays `n1`, the Properties column shows it.
- [ ] **Step 2: Run them to verify they fail**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run them to verify they pass** — `__tests__/editor-`, `__tests__/site-` and tsc.
- [ ] **Step 5: Checkpoint**

---

### Task 4: Device checklist, docs, full run, browser

**Files:**

- Create: `docs/layout-editor-device-checklist.md` (the manual iOS/Android pass, §20: upright and sideways; add, move, resize, nest, scroll while dragging, tabs, properties, layouts, export; what to note for each)
- Modify: `apps/playground/CLAUDE.md` ("The canvas": arrangement and keys; "Keyboard": Shift and page shortcuts), the spec §19 (phase 8: done on the web, the device pass waiting for the checklist to be run), `docs/handoff/2026-11-05.md`, `docs/README.md` (this plan's row and the checklist's)

- [ ] **Step 1: Everything** — editor and site tests, tsc, the full suite (no dev server running), ESLint and Prettier on the changed files.
- [ ] **Step 2: Browser** — 1440 mouse (three columns, every shortcut once, the shortcuts dialog lists them under "This page"); 1024 with touch (sheets, a palette drag from the sheet onto the canvas); 390 upright with touch (banner, tap to select, properties and palette in bottom sheets, add by tap, delete, undo). No console errors.
- [ ] **Step 3: Checkpoint and handoff**
