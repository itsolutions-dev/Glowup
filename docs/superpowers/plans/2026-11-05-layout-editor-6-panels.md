# Layout editor, plan 6: Properties and Layers panels — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 5 of the spec: a **Properties** panel on the right that edits the selected node (text, props, data, position, form field, tabs), and a **Layers** tab beside the palette that shows the document as a tree, selects from it and moves a node into another container without dragging.

**Architecture:** What the panels compute is pure, in `editor/panels.ts` (which props are data, which are code only, the layer tree, where a node can move); the views are `editor/canvas/PropertiesPanel.tsx` and `editor/canvas/LayersPanel.tsx`, each over the `Editor`. Every change is an existing operation applied through `editor.apply(next, key)`, the key making the keystrokes in one control a single undo step. The left column becomes Add | Layers tabs; the Properties column sits right of the canvas; on the editor's route the site's navigation shrinks to its rail so the canvas keeps its room.

**Tech Stack:** TypeScript, React Native + react-native-web, `@its/glowup-ui` (`Tabs`, `Tree`, `Input`, `InputArea`, `Switch`, `Select`, `Button`, `IconButton`, `Dialog`, `ScrollArea`), the site's `PropControls` with `catalogue/registry` (`ComponentRegistry`), `docgen/props.generated.json` through `editor/docgen.ts`, jest-expo + RNTL 14.

**Spec:** `docs/superpowers/specs/2026-10-26-layout-editor-design.md` — §2 ("Edit"), §11.2, §11.7 (the Field section), §13 (Properties, Layers), §14 (one undo step per field focus), §17 (three columns), §19 phase 5. Builds on plans 3–5 (`apps/playground/CLAUDE.md`, "The canvas", "Export").

## Global Constraints

- §13 Props: "the existing `PropControls` with the component's registry entry — the same controls, defaults and `appliesWhen` rules as the component pages. A prop left at its default is not stored."
- §13 Data: array and object props the registry does not cover are edited as JSON (`InputArea`, validated). **Ruling in this plan:** the label/value list editor of §13 is left for later; the JSON field covers every such prop today (a Select's `options` included).
- §13 Layout: `x`, `y`, `w`, `h` for a node on a grid, "same rules as dragging" (`placeNode`). A flow container's direction and spacing are already registry props (Stack), so they are in Props, not a Layout section of their own.
- §13: "Props that take nodes or functions are listed as 'set in code' and are not editable"; a TabbedPanel's Tabs section: "add, rename, remove, reorder; removing a tab with content asks first."
- §11.7 Field section: name (refused with `fieldNameProblem`'s message) and rules.
- §13 Layers: "the document as a library `Tree` (type + first words of its text); selecting a row selects the node; 'Move into…' picks a container from a list (the node lands at its first free cell, or at the end of a flow container)."
- §14: "typing in a field is one step per field focus" — every control passes a key (`props:<id>:<name>`, `text:<id>`, `data:<id>:<name>`, `layout:<id>`, `field:<id>`, `tab:<id>:<i>`) to `editor.apply`, which merges consecutive commits with the same key.
- §17: three columns (palette/layers 280 dp, canvas, properties 320 dp) need ≥ 720 dp of canvas; on `/templates/editor` the site's navigation is the 80 dp rail at every width (1440 − 80 − 280 − 320 = 760). The sheets below 1320 dp stay for phase 8.
- Unchanged: library by name only, `editor/*.ts` pure, tokens for visuals, no new dependency, no commits (the user commits).

## Review Focus

1. **A position typed as text, empty, negative, huge or fractional** (`w: "abc"`, `x: -3`, `w: 99`, `h: 1.5`): nothing reaches the document that `placeNode` would not produce by dragging — no `NaN`, nothing outside the columns — test in Task 2.
2. **Invalid JSON in a Data field, or JSON of another kind** (`options` set to `"nope"`): an error under the field, the document and history untouched — test in Task 2.
3. **A field name that is taken in its Form or is not an identifier**: `fieldNameProblem`'s message, the name unchanged — test in Task 2.
4. **Removing a tab that holds components**: a confirmation first; cancelling keeps it; the last tab cannot be removed — test in Task 2.
5. **"Move into…" a container that cannot take the node** (itself, one of its descendants, a container whose `accepts` refuses the type, a Form for a node holding a Form): not offered — test in Task 1.

---

### Task 1: What the panels compute

**Files:**

- Create: `apps/playground/editor/panels.ts`
- Test: `apps/playground/__tests__/editor-panels.test.ts`

**Interfaces:**

- Consumes: `componentProps` (`docgen.ts`), `MANIFEST`, `canPlace`, `moveNode`, `addTarget` (`canvasMath.ts`), `walk`, `findNode`, `ancestors` (`document.ts`). `editor/*.ts` stays free of the catalogue: the caller passes the registry's prop names.
- Produces:
  - `dataProps(node: LayoutNode, registryProps: string[]): string[]` — the keys of `{ ...MANIFEST[type].defaultProps, ...node.props }` whose value is an array or an object, minus `registryProps`, in that order.
  - `codeProps(type: string): string[]` — the component's docgen props whose `type` text matches `/=>|ReactNode|ReactElement|JSX\.Element|ComponentType/`, sorted.
  - `interface Layer { id: NodeId; label: string; children?: Layer[] }` and `layerTree(doc: LayoutDocument): Layer[]` — label `` `${type} · ${words}` `` with `words` the first 4 words of `text`, else of `props.label`, else of `props.title`, else just the type; a TabbedPanel's children are one `Layer` per tab (`id` `` `${id}:tab${i}` ``, label the tab's label) holding that panel's nodes.
  - `moveTargets(doc: LayoutDocument, id: NodeId): { id: NodeId | null; label: string }[]` — `{ id: null, label: "Page" }` first, then every container (grid, flow or TabbedPanel) that is neither the node nor inside it and whose slot `canPlace` the node (for a TabbedPanel, its first panel), labelled like its layer.
  - `moveInto(doc: LayoutDocument, id: NodeId, target: NodeId | null, tabs: Record<NodeId, number>): LayoutDocument` — `moveNode(doc, id, addTarget(doc, type, target, tabs))`.

- [ ] **Step 1: Write the failing tests** (on the shared fixture, deep-frozen)

- `"lists the data props, not the registry's"`: a Select node `{ type: "Select", props: { label: "Choice" } }` with registry props `["label", "placeholder"]` → `["options"]`; `n2` (Typography) → `[]`.
- `"lists the props set in code"`: `codeProps("Button")` contains `"onClick"` and not `"variant"`.
- `"draws the document as layers"`: `layerTree(fixture)` → `[{ id: "n1", label: "Paper", children: [{ id: "n2", label: "Typography · Hi" }] }, { id: "n3", label: "TabbedPanel", children: [{ id: "n3:tab0", label: "A", children: [{ id: "n4", label: "Input · Name" }] }, { id: "n3:tab1", label: "B", children: [] }] }, { id: "n5", label: "VStack", children: [{ id: "n6", label: "Button · Save" }] }]`.
- **Review Focus 5** `"offers only the containers that can take the node"`: `moveTargets(fixture, "n6")` ids → `[null, "n1", "n3", "n5"]`; `moveTargets(fixture, "n1")` does not contain `"n1"`; with a ListSection `ls` added on the page, `moveTargets(doc, "n6")` (a Button) does not contain `"ls"`; with a Form `f1` on the page and a Form `f2` inside `n1`, `moveTargets(doc, "n1")` does not contain `"f1"`.
- `"moves a node into a container"`: `moveInto(fixture, "n6", "n1", {})` → `n6` in `n1` at its first free cell `{ x: 0, y: 1, w: 3, h: 1 }`; `moveInto(fixture, "n2", "n5", {})` → `n5.children` ids `["n6", "n2"]`; `moveInto(fixture, "n6", null, {})` → on the page.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-panels`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `editor/panels.ts`**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 2: The Properties panel

**Files:**

- Create: `apps/playground/editor/canvas/PropertiesPanel.tsx`
- Test: `apps/playground/__tests__/editor-properties.test.tsx`

**Interfaces:**

- Consumes: Task 1; `PropControls` (`site/PropControls.tsx`), `ComponentRegistry` (`catalogue/registry`); `setProps`, `setText`, `placeNode`, `addTab`, `renameTab`, `removeTab`, `moveTab`, `duplicateNode`, `removeNode` (`operations.ts`); `fieldNameProblem`, `setFieldName`, `setFieldRules` (`forms.ts`); `Editor`.
- Produces: `PropertiesPanel({ editor }: { editor: Editor })` — a 320 dp column (`testID="properties"`), a `ScrollArea` of sections for `editor.selected`; nothing selected → `"Select a component to edit it."`. Sections, each drawn only when it applies:
  - **Header**: `` `${type} · ${id}` `` (plus `` ` · ${field.name}` `` for a bound field), IconButtons "Duplicate" (selects the copy) and "Delete".
  - **Content** (text components): `Input` labelled `"Text"` → `setText`, key `text:<id>`.
  - **Props**: `PropControls` with `ComponentRegistry[type]` minus its `children` control (the Content section owns the text), `values` = registry defaults overlaid with `node.props`; `onChange(key, value)` → `setProps(doc, id, { [key]: value equal to the registry default ? undefined : value })`, key `props:<id>:<key>`; `onReset` → every registry key `undefined`. A type with no registry entry draws no Props section.
  - **Data**: one `InputArea` per `dataProps(node, Object.keys(entry.props))`, labelled with the prop name, holding `JSON.stringify(value, null, 2)`; on each change: invalid JSON, or a value whose kind (array, object, string, number, boolean, null) differs from the current one → the message `"Not valid JSON"` or `"Expected an array"` / `"Expected an object"` under it and nothing applied; otherwise `setProps`, key `data:<id>:<name>`. The field keeps the text typed while it is invalid.
  - **Layout** (node with `layout`): four number `Input`s `x`, `y`, `w`, `h`; a change that parses to a finite number → `placeNode` with `Math.round` of it (placeNode clamps), key `layout:<id>`; anything else leaves the document as it is.
  - **Field** (bound field): `Input` "Field name" → `fieldNameProblem` non-null shows that message and applies nothing, else `setFieldName`, key `field:<id>`; `Switch` "Required" → `setFieldRules` with `{ required: true }` added or removed.
  - **Tabs** (TabbedPanel): per tab an `Input` (its label → `renameTab`, key `tab:<id>:<i>`), IconButtons "Move up" / "Move down" (`moveTab`) and "Remove tab" (`removeTab`; disabled with one tab; a tab with children first opens a `Dialog` "Remove the tab and its content?" with "Remove" and "Cancel"); a Button "Add tab" (`addTab`).
  - **Set in code**: `codeProps(type)` as one line of text, when not empty.

- [ ] **Step 1: Write the failing tests** (a harness rendering `PropertiesPanel` beside `useEditor(fixture)`, as `editor-canvas.test.tsx` does; `editor` read back after each render)

- `"asks for a selection"`: nothing selected → `"Select a component to edit it."`.
- `"edits a text, one undo step per field"`: select `n2`; `changeText` the "Text" field to `"H"`, then `"Ho"` → `findNode(doc, "n2").text === "Ho"`; one `undo` → `"Hi"`.
- `"edits a prop with the component page's controls, and stores no default"`: select `n6` (Button); turn its "Disabled" switch on → `props.disabled === true`; off again (the registry default, `false`) → `props` has no `disabled`; no control is labelled "Label" (the registry's `children`).
- **Review Focus 1** `"moves and resizes by numbers, as dragging would"`: select `n1`; `w` ← `"8"` → layout `w` 8; `w` ← `"abc"` → still 8; `x` ← `"-3"` → `x` 0; `w` ← `"99"` → `w` 12; `h` ← `"1.5"` → an integer `h`; `checkDocument` is `[]` after each.
- **Review Focus 2** `"edits data as JSON, refusing what is not"`: a Select on the page selected; its `options` field ← `"[{"` → `"Not valid JSON"` shown, `options` unchanged, `canUndo` false; ← `"\"nope\""` → `"Expected an array"`, unchanged; ← `'[{"label":"A","value":"a"}]'` → stored.
- **Review Focus 3** `"names a field, refusing a taken name"`: a Form holding two bound Inputs `email` and `phone`; select the second; "Field name" ← `"email"` → the `fieldNameProblem` message shown, name still `phone`; ← `"mobile"` → `mobile`; "Required" on → its rules contain `{ required: true }`.
- **Review Focus 4** `"edits tabs, asking before removing one with content"`: select `n3`; "Add tab" → 3 tabs; rename the third to `"C"`; "Remove tab" on tab A (holds `n4`) → the dialog; "Cancel" → still 3 tabs; again and "Remove" → 2 tabs, `n4` gone; remove until one is left → its "Remove tab" is disabled.
- `"lists what is set in code"`: select `n6` → a text containing `onClick`.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-properties`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `PropertiesPanel.tsx`**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor- && node ../../node_modules/typescript/bin/tsc --noEmit -p .`
Expected: PASS, no type error.

- [ ] **Step 5: Checkpoint**

---

### Task 3: The Layers panel and the page's columns

**Files:**

- Create: `apps/playground/editor/canvas/LayersPanel.tsx`
- Modify: `apps/playground/editor/canvas/Canvas.tsx` (the `palette` slot renamed `left`), `apps/playground/app/templates/editor.tsx` (left column: `Tabs` "Add" | "Layers" over the Palette or the Layers panel, 280 dp; right column: `PropertiesPanel`), `apps/playground/site/SiteShell.tsx` (the rail on the editor's route)
- Test: `apps/playground/__tests__/editor-page.test.tsx`, `apps/playground/__tests__/editor-canvas.test.tsx` (the slot's new name), `apps/playground/__tests__/site-shell.test.ts` (new)

**Interfaces:**

- Consumes: `layerTree`, `moveTargets`, `moveInto` (Task 1); `PropertiesPanel` (Task 2).
- Produces:
  - `LayersPanel({ editor }: { editor: Editor })`: a library `Tree` (`selectionMode="single"`, every container expanded by default, `selected={editor.selected ? [editor.selected] : []}`, `onSelectedChange` → `editor.select(ids[0] ?? null)`; a tab row `<id>:tab<i>` selects its TabbedPanel and shows that panel with `showTab`); under it, for a selected node, a `Select` labelled `"Move into…"` with `moveTargets` and a Button "Move" applying `moveInto` (one undo step).
  - `wideNav(pathname: string, large: boolean): boolean` exported from `SiteShell.tsx` — `large && !pathname.startsWith("/templates/editor")`; the shell's `expanded` becomes `wideNav(pathname, layout.atLeast("large"))`.

- [ ] **Step 1: Write the failing tests**

- Page `"shows the layers and selects from them"`: press "Layers" → rows `"Typography · Anagrafica"` and `"TabbedPanel"` shown; press the row of the Button "Modifica" → the Properties header reads `Button · <its id>`.
- Page `"moves a node into another container from the layers"`: select the "Telefono" label through its layer row; "Move into…" ← the Card; "Move" → its node is in the Card's VStack (the end); one "Undo" puts it back.
- Page `"edits the selection in the Properties column"`: tap a box on the canvas, then the "Text" field ← `"Nome"` → the canvas shows `"Nome"`.
- `site-shell.test.ts` `"shows the rail on the layout editor"`: `wideNav("/templates/editor", true)` → `false`; `wideNav("/components/Button", true)` → `true`; `wideNav("/", false)` → `false`.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-page __tests__/site-shell`
Expected: FAIL.

- [ ] **Step 3: Implement the Layers panel, the two columns, the slot rename and `wideNav`**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor- __tests__/site-shell && node ../../node_modules/typescript/bin/tsc --noEmit -p .`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 4: Docs, full run, browser

**Files:**

- Modify: `apps/playground/CLAUDE.md` ("The canvas": the panels and their undo keys; "Responsive": the rail on the editor's route), the spec §19 (phase 5 **Done** with the date), `docs/handoff/2026-11-05.md` (new, Italian), `docs/README.md` (this plan's row)

- [ ] **Step 1: Everything**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor- && node ../../node_modules/typescript/bin/tsc --noEmit -p .`, then `npm test -w @its/glowup-playground -- --maxWorkers=2` from the root (no dev server running), ESLint and Prettier on the changed files.
Expected: all green.

- [ ] **Step 2: Browser** (`CI=1 node ../../node_modules/expo/bin/cli start --web --port 8099` from `apps/playground`; screenshots under `c:/dev/Glowup/.playwright-mcp`, deleted afterwards)

1440 × 900: the rail, three columns, the canvas at least 720 wide. Select a Paper: change its elevation in Props, see it on the canvas, undo it. Edit a Typography's text (one undo step for the whole word). Type a position. Edit a Select's `options` as JSON. Rename, add and remove a tab (the confirmation). Layers: select from the tree, move a label into the Card. No console errors.

- [ ] **Step 3: Checkpoint and handoff**
