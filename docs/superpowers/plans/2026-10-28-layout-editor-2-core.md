# Layout editor, plan 2: the editor's pure core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The layout editor's model, written as plain TypeScript with no UI: the document and its tree queries, the grid maths, the component manifest, the document's invariants, form bindings, every editing operation, and undo/redo — all tested, ready for the canvas and panels of plan 3.

**Architecture:** Plain modules in `apps/playground/editor/`, no React and no React Native imports. A document is an immutable tree; every operation takes a document and returns a new one (or the same one, unchanged, when the operation is refused). The grid maths and the manifest are the only things operations consult; `checkDocument` states the invariants every operation must keep, and the tests run it after every operation. Plan 1's library pieces (`GridLayout`, the drag and drop additions) are not used here: this layer only decides _what_ the document becomes.

**Tech Stack:** TypeScript, jest (jest-expo preset of the playground). No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-26-layout-editor-design.md` — §7 (document), §8 (manifest), §11.3–11.7 (placement, resizing, containers, delete and duplicate, forms), §14 (history), §16 (decisions 1–6). This is plan 2 of 3; plan 3 (the editor page, export, persistence) is written once this one has landed.

## Global Constraints

- Every module lives in `apps/playground/editor/` and imports only from that folder (no `react`, no `react-native`, no `@its/glowup-ui`, no `site/`). Tests may import the catalogue (`catalogue/registry`, `catalogue/categories`) and `site/propsData`.
- **Operations never mutate their input.** Tests deep-freeze the input document; a refused operation returns the **same** document object.
- Grid defaults, verbatim: **12 columns, row height 48 dp, gap 16 dp**. A grid container's `columns` equals its own `layout.w`.
- Ids are `"n"` followed by a number; a new id is one more than the largest in the document.
- Placement: **free, with gaps; collisions push down, nothing moves up** (§11.3, §16 Q3).
- Field names: **unique within their Form**, valid JavaScript identifiers; a field outside every Form has no binding (§11.7).
- Tests: `apps/playground/__tests__/editor-*.test.ts`; shared fixture `apps/playground/__tests__/__fixtures__/editor-document.json` (JSON: jest runs every `.ts` under `__tests__` as a test). Run with `cd apps/playground && npx jest __tests__/editor-`.
- Formatting and lint: `npx prettier --write <files>`, `npm run lint` gains no error. `npm run type-check` clean.
- Commits only if the user has asked; otherwise skip the "Commit" steps.

## Review Focus

1. **Moving a container into its own descendant** (a Paper dropped into a card inside it): refused, document unchanged — never a cycle or a lost subtree. → Task 6, test "refuses to move a node into itself".
2. **An item wider than the grid it moves to** (a 12-wide panel into a 6-column card): its width is cut to the columns and it lands inside them, overlapping nothing. → Task 6, test "cuts a node to the columns of a narrower grid".
3. **Two fields with the same label in one Form**, by adding, duplicating or moving: the second gets `email2`, the names stay unique. → Task 5 and Task 6, tests "names the second field with the same label email2" and "renames a duplicated field".
4. **Undo after a run of typing**: one undo returns to the document before the typing, not to the middle of it. → Task 7, test "coalesces a run of edits with the same key".
5. **Removing the last tab of a TabbedPanel**: refused; a TabbedPanel always has a tab. → Task 6, test "keeps at least one tab".

---

### Task 1: The document and its tree queries

**Files:**

- Create: `apps/playground/editor/document.ts`
- Create: `apps/playground/__tests__/__fixtures__/editor-document.json`
- Test: `apps/playground/__tests__/editor-document.test.ts`

**Interfaces:**

- Produces (every later task uses these):

```ts
export type NodeId = string;
export interface GridPlacement {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface FieldRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  /** A regular expression's source. */
  pattern?: string;
  type?: "email" | "url" | "number";
  message?: string;
}
export interface FieldBinding {
  name: string;
  rules: FieldRule[];
}
export interface TabPanel {
  label: string;
  columns: number;
  children: LayoutNode[];
}
export interface LayoutNode {
  id: NodeId;
  /** A manifest type ("Paper", "Input", "TabbedPanel", "Form", …). */
  type: string;
  props: Record<string, unknown>;
  /** A text component's label. */
  text?: string;
  /** Its cells, on the grid of the slot it is in; absent in a flow container. */
  layout?: GridPlacement;
  /** A grid container's own grid (and a Form's). */
  columns?: number;
  children?: LayoutNode[];
  /** A TabbedPanel's panels. */
  tabs?: TabPanel[];
  /** A field inside a Form. */
  field?: FieldBinding;
}
export interface GridSettings {
  columns: number;
  rowHeight: number;
  gap: number;
}
export interface LayoutDocument {
  format: "glowup-layout";
  version: 1;
  name: string;
  grid: GridSettings;
  items: LayoutNode[];
}
/** Where a node lives: the page, a container's children, or one panel of a TabbedPanel. */
export type Slot =
  | { kind: "page" }
  | { kind: "children"; parent: NodeId }
  | { kind: "tab"; parent: NodeId; tab: number };

export const emptyDocument: (name: string) => LayoutDocument; // grid 12 / 48 / 16, no items
export const newId: (doc: LayoutDocument) => NodeId;
export const walk: (doc: LayoutDocument) => LayoutNode[]; // pre-order: items, children, tabs' children in order
export const findNode: (doc: LayoutDocument, id: NodeId) => LayoutNode | null;
export const slotOf: (doc: LayoutDocument, id: NodeId) => Slot | null;
export const slotNodes: (doc: LayoutDocument, slot: Slot) => LayoutNode[];
export const ancestors: (doc: LayoutDocument, id: NodeId) => NodeId[]; // nearest first
```

- [ ] **Step 1: Write the fixture** `__tests__/__fixtures__/editor-document.json` — the document every editor test starts from:

```json
{
  "format": "glowup-layout",
  "version": 1,
  "name": "Fixture",
  "grid": { "columns": 12, "rowHeight": 48, "gap": 16 },
  "items": [
    {
      "id": "n1",
      "type": "Paper",
      "props": {},
      "layout": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "columns": 6,
      "children": [
        {
          "id": "n2",
          "type": "Typography",
          "props": {},
          "text": "Hi",
          "layout": { "x": 0, "y": 0, "w": 6, "h": 1 }
        }
      ]
    },
    {
      "id": "n3",
      "type": "TabbedPanel",
      "props": {},
      "layout": { "x": 6, "y": 0, "w": 6, "h": 4 },
      "tabs": [
        {
          "label": "A",
          "columns": 6,
          "children": [
            {
              "id": "n4",
              "type": "Input",
              "props": { "label": "Name" },
              "layout": { "x": 0, "y": 0, "w": 4, "h": 2 }
            }
          ]
        },
        { "label": "B", "columns": 6, "children": [] }
      ]
    },
    {
      "id": "n5",
      "type": "VStack",
      "props": {},
      "layout": { "x": 0, "y": 4, "w": 4, "h": 3 },
      "children": [
        { "id": "n6", "type": "Button", "props": {}, "text": "Save" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Write the failing tests** (`editor-document.test.ts`; `const doc = fixture as LayoutDocument`):

```ts
it("starts empty on the default grid", () => {
  expect(emptyDocument("New")).toEqual({
    format: "glowup-layout",
    version: 1,
    name: "New",
    grid: { columns: 12, rowHeight: 48, gap: 16 },
    items: [],
  });
});
it("gives the next id", () => expect(newId(doc)).toBe("n7"));
it("walks the tree in order, tab panels included", () => {
  expect(walk(doc).map((n) => n.id)).toEqual([
    "n1",
    "n2",
    "n3",
    "n4",
    "n5",
    "n6",
  ]);
});
it("finds a node and its slot", () => {
  expect(findNode(doc, "n4")?.type).toBe("Input");
  expect(findNode(doc, "zz")).toBeNull();
  expect(slotOf(doc, "n1")).toEqual({ kind: "page" });
  expect(slotOf(doc, "n2")).toEqual({ kind: "children", parent: "n1" });
  expect(slotOf(doc, "n4")).toEqual({ kind: "tab", parent: "n3", tab: 0 });
  expect(slotNodes(doc, { kind: "tab", parent: "n3", tab: 1 })).toEqual([]);
});
it("lists the ancestors, nearest first", () => {
  expect(ancestors(doc, "n4")).toEqual(["n3"]);
  expect(ancestors(doc, "n1")).toEqual([]);
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `cd apps/playground && npx jest __tests__/editor-document.test.ts`
Expected: FAIL — `../editor/document` not found.

- [ ] **Step 4: Implement** `editor/document.ts` with the signatures above (`newId` on an empty document is `"n1"`).

- [ ] **Step 5: Run them**

Run: `cd apps/playground && npx jest __tests__/editor-document.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/playground/editor/document.ts apps/playground/__tests__/editor-document.test.ts apps/playground/__tests__/__fixtures__/editor-document.json
git commit -m "feat(editor): layout document and tree queries"
```

---

### Task 2: The grid maths

**Files:**

- Create: `apps/playground/editor/engine.ts`
- Test: `apps/playground/__tests__/editor-engine.test.ts`

**Interfaces:**

- Consumes: `GridPlacement`, `GridSettings` from Task 1.
- Produces:

```ts
export interface Placed extends GridPlacement {
  id: string;
}
export const overlaps: (a: GridPlacement, b: GridPlacement) => boolean;
/** The cell under a preview's top-left corner (a drop's `over.rect`), inside the columns for an item `size.w` wide. */
export const snapCell: (
  rect: { x: number; y: number },
  zoneWidth: number,
  grid: GridSettings,
  size: { w: number; h: number },
) => { x: number; y: number };
/** After `fixedId` was placed: every item it overlaps moves down below it, keeping its column, and so on along the chain. Nothing moves up. Same order out as in. */
export const pushDown: (items: Placed[], fixedId: string) => Placed[];
/** The first cell, row by row then left to right, where `size` overlaps nothing; scanning starts at row `fromRow` (default 0). */
export const firstFreeCell: (
  items: GridPlacement[],
  size: { w: number; h: number },
  columns: number,
  fromRow?: number,
) => { x: number; y: number };
/** The fewest rows (≥ 1) whose height holds `height` dp. */
export const rowsFor: (
  height: number,
  rowHeight: number,
  gap: number,
) => number;
/** How far the items reach: the rightmost column edge and the bottom row edge (0 and 0 for none). */
export const extent: (items: GridPlacement[]) => {
  columns: number;
  rows: number;
};
```

`snapCell`: `x = clamp(round(rect.x / ((zoneWidth + gap) / columns)), 0, columns - size.w)`, `y = max(0, round(rect.y / (rowHeight + gap)))` — the formula the plan-1 demo uses. `pushDown` works from a queue starting with the fixed item: for each item taken off it, every other item (not the fixed one) that overlaps it gets `y = taken.y + taken.h` and joins the queue; items are visited in `(y, x)` order.

- [ ] **Step 1: Write the failing tests**

```ts
const GRID = { columns: 12, rowHeight: 48, gap: 16 };
const p = (id: string, x: number, y: number, w: number, h: number) => ({
  id,
  x,
  y,
  w,
  h,
});

it("snaps a preview to a cell, inside the columns", () => {
  expect(snapCell({ x: 160, y: 100 }, 600, GRID, { w: 4, h: 1 })).toEqual({
    x: 3,
    y: 2,
  });
  expect(snapCell({ x: 590, y: -30 }, 600, GRID, { w: 4, h: 1 })).toEqual({
    x: 8,
    y: 0,
  });
});
it("tells overlapping cells apart from touching ones", () => {
  expect(overlaps(p("a", 0, 0, 6, 2), p("b", 5, 1, 2, 2))).toBe(true);
  expect(overlaps(p("a", 0, 0, 6, 2), p("b", 6, 0, 2, 2))).toBe(false);
  expect(overlaps(p("a", 0, 0, 6, 2), p("b", 0, 2, 2, 2))).toBe(false);
});
it("pushes down along a chain, and nothing up", () => {
  const out = pushDown(
    [
      p("A", 0, 0, 6, 2),
      p("B", 0, 1, 4, 2),
      p("C", 0, 3, 4, 1),
      p("D", 8, 0, 4, 1),
      p("E", 0, 9, 2, 1),
    ],
    "A",
  );
  expect(out.map((i) => [i.id, i.y])).toEqual([
    ["A", 0],
    ["B", 2],
    ["C", 4],
    ["D", 0],
    ["E", 9],
  ]);
});
it("finds the first free cell", () => {
  expect(
    firstFreeCell([p("a", 0, 0, 6, 2), p("b", 6, 0, 6, 1)], { w: 6, h: 1 }, 12),
  ).toEqual({ x: 6, y: 1 });
  expect(firstFreeCell([], { w: 4, h: 1 }, 12, 3)).toEqual({ x: 0, y: 3 });
});
it("counts the rows a height needs", () => {
  expect(rowsFor(10, 48, 16)).toBe(1);
  expect(rowsFor(240, 48, 16)).toBe(4);
  expect(rowsFor(241, 48, 16)).toBe(5);
});
it("measures how far items reach", () => {
  expect(extent([])).toEqual({ columns: 0, rows: 0 });
  expect(extent([p("a", 0, 0, 6, 2), p("b", 6, 1, 4, 3)])).toEqual({
    columns: 10,
    rows: 4,
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd apps/playground && npx jest __tests__/editor-engine.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** `editor/engine.ts`.

- [ ] **Step 4: Run them**

Run: `cd apps/playground && npx jest __tests__/editor-engine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/playground/editor/engine.ts apps/playground/__tests__/editor-engine.test.ts
git commit -m "feat(editor): grid maths"
```

---

### Task 3: The component manifest

**Files:**

- Create: `apps/playground/editor/manifest.ts`
- Test: `apps/playground/__tests__/editor-manifest.test.ts`

**Interfaces:**

- Produces:

```ts
export type NodeKind = "grid" | "flow" | "text" | "leaf" | "tabs";
export interface ManifestEntry {
  type: string;
  kind: NodeKind;
  /** The Form container (§11.7). */
  form?: true;
  /** A container's accepted child types; leave out for "every palette type except overlays". */
  accepts?: string[];
  /** A flow container's axis. */
  direction?: "column" | "row";
  defaultProps: Record<string, unknown>;
  /** A text component's starting label. */
  defaultText?: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  /** Outside a Form, the value/change pair the export turns into state. */
  controlled?: { value: string; onChange: string; initial: unknown };
  /** Inside a Form, how FormField connects it. */
  field?: { valueProp: string; trigger: string; initial: unknown };
  palette: { group: string; icon: string };
}
export const MANIFEST: Record<string, ManifestEntry>;
/** Catalogued components the palette leaves out, each with its reason. */
export const LEFT_OUT: Record<string, string>;
export const entryFor: (type: string) => ManifestEntry | undefined;
/** Whether `container` takes a child of `child` type (manifest `accepts`; a Form never takes a Form). */
export const acceptsChild: (container: string, child: string) => boolean;
export const isContainer: (type: string) => boolean; // grid, flow or tabs
```

The entries follow the spec's §8 classification and §11.7 field list; `TabbedPanel` (kind `tabs`, editor-only) has `defaultProps` from the library's `Tabs`; `Form` is `kind: "grid"`, `form: true`. `palette.group` is the component's catalogue category (`CATEGORY_OF`); `TabbedPanel` goes in `"Navigation"`, `Form` in `"Inputs"`.

- [ ] **Step 1: Write the failing tests** (import `FLAT_ORDER`, `CATEGORY_OF` from `catalogue/categories`, `COMPONENT_DOCS` from `site/propsData`; `propsOf(type) = COMPONENT_DOCS[type === "TabbedPanel" ? "Tabs" : type].props.map((p) => p.name)`):

```ts
it("covers every catalogued component, once", () => {
  for (const name of FLAT_ORDER) {
    expect([name in MANIFEST, name in LEFT_OUT]).toContain(true);
    expect(name in MANIFEST && name in LEFT_OUT).toBe(false);
  }
  for (const type of Object.keys(MANIFEST)) {
    if (type !== "TabbedPanel") expect(FLAT_ORDER).toContain(type);
  }
});
it("names only real props", () => {
  for (const entry of Object.values(MANIFEST)) {
    const props = propsOf(entry.type);
    for (const key of Object.keys(entry.defaultProps))
      expect(props).toContain(key);
    if (entry.field) {
      expect(props).toContain(entry.field.valueProp);
      expect(props).toContain(entry.field.trigger);
    }
    if (entry.controlled) {
      expect(props).toContain(entry.controlled.value);
      expect(props).toContain(entry.controlled.onChange);
    }
  }
});
it("binds the spec's field components", () => {
  for (const type of [
    "Input",
    "InputArea",
    "PasswordField",
    "NumberField",
    "Select",
    "Autocomplete",
    "Checkbox",
    "CheckboxGroup",
    "RadioGroup",
    "Switch",
    "Slider",
    "Rating",
    "PinInput",
    "DatePicker",
    "TimePicker",
    "DateTimePicker",
  ]) {
    expect(MANIFEST[type]?.field).toBeDefined();
  }
});
it("keeps containers, sizes and forms consistent", () => {
  for (const entry of Object.values(MANIFEST)) {
    expect(entry.defaultSize.w).toBeLessThanOrEqual(12);
    expect(entry.defaultSize.w).toBeGreaterThanOrEqual(entry.minSize.w);
    expect(entry.defaultSize.h).toBeGreaterThanOrEqual(entry.minSize.h);
    if (!isContainer(entry.type)) expect(entry.accepts).toBeUndefined();
    for (const child of entry.accepts ?? [])
      expect(MANIFEST[child]).toBeDefined();
  }
  expect(MANIFEST.Form).toMatchObject({ kind: "grid", form: true });
  expect(acceptsChild("Form", "Form")).toBe(false);
  expect(acceptsChild("ListSection", "ListItem")).toBe(true);
  expect(acceptsChild("ListSection", "Button")).toBe(false);
  expect(acceptsChild("Input", "Button")).toBe(false);
  expect(acceptsChild("Paper", "Input")).toBe(true);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd apps/playground && npx jest __tests__/editor-manifest.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** `editor/manifest.ts`: one entry per palette component, `LEFT_OUT` for the rest (overlays, providers, `Portal`, `Visible`, `Center`, `Grid`, the bare `Tabs`/`TabContent`, `Collapse`, `Accordion` — each with its reason from §8). Read each component's prop names from `docgen/props.generated.json` while writing the `field`/`controlled` pairs: the test holds them to it.

- [ ] **Step 4: Run them**

Run: `cd apps/playground && npx jest __tests__/editor-manifest.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/playground/editor/manifest.ts apps/playground/__tests__/editor-manifest.test.ts
git commit -m "feat(editor): component manifest"
```

---

### Task 4: The invariants

**Files:**

- Create: `apps/playground/editor/check.ts`
- Test: `apps/playground/__tests__/editor-check.test.ts`

**Interfaces:**

- Consumes: Task 1 queries, Task 2 `overlaps`, Task 3 `entryFor`, `acceptsChild`.
- Produces: `export const checkDocument: (doc: LayoutDocument) => string[]` — every broken invariant as one message, empty when the document is sound. The messages (tests match them exactly):
  - `"<id>: duplicate id"`, `"<id>: unknown type <type>"`
  - `"<id>: needs a layout on a grid"`, `"<id>: has a layout in a flow container"`, `"<id>: outside the <n> columns"` (`x < 0`, `y < 0`, `w < 1`, `h < 1` or `x + w > n`)
  - `"<a> and <b> overlap"` (two nodes of one grid slot, first by walk order)
  - `"<id>: columns <c>, width <w>"` (a grid container or panel on a grid whose `columns` ≠ its `layout.w`; a TabbedPanel checks each panel)
  - `"<parent>: does not take <type>"`
  - `"<id>: text on a <kind>"` (text only on kind `text`), `"<id>: a TabbedPanel needs a tab"`
  - `"<id>: field outside a Form"`, `"<id>: field name <name> is not an identifier"`, `"<form>: field name <name> used twice"`, `"<id>: a Form inside a Form"`

- [ ] **Step 1: Write the failing tests** (`clone = structuredClone(fixture) as LayoutDocument`):

```ts
it("finds the fixture sound", () =>
  expect(checkDocument(fixture as LayoutDocument)).toEqual([]));
it("reports each broken invariant", () => {
  const dup = clone();
  dup.items[2].children![0].id = "n2";
  expect(checkDocument(dup)).toContain("n2: duplicate id");
  const overlap = clone();
  overlap.items[2].layout = { x: 0, y: 3, w: 4, h: 3 };
  expect(checkDocument(overlap)).toContain("n1 and n5 overlap");
  const wide = clone();
  wide.items[0].layout!.w = 8;
  expect(checkDocument(wide)).toContain("n1: columns 6, width 8");
  const flowLayout = clone();
  flowLayout.items[2].children![0].layout = { x: 0, y: 0, w: 1, h: 1 };
  expect(checkDocument(flowLayout)).toContain(
    "n6: has a layout in a flow container",
  );
  const stray = clone();
  stray.items[0].children![0].field = { name: "x", rules: [] };
  expect(checkDocument(stray)).toContain("n2: field outside a Form");
});
it("checks forms", () => {
  const doc = clone();
  doc.items.push({
    id: "n7",
    type: "Form",
    props: {},
    layout: { x: 0, y: 8, w: 6, h: 4 },
    columns: 6,
    children: [
      {
        id: "n8",
        type: "Input",
        props: {},
        layout: { x: 0, y: 0, w: 3, h: 2 },
        field: { name: "email", rules: [] },
      },
      {
        id: "n9",
        type: "Input",
        props: {},
        layout: { x: 3, y: 0, w: 3, h: 2 },
        field: { name: "email", rules: [] },
      },
      {
        id: "n10",
        type: "Form",
        props: {},
        layout: { x: 0, y: 2, w: 6, h: 2 },
        columns: 6,
        children: [],
      },
    ],
  });
  expect(checkDocument(doc)).toEqual(
    expect.arrayContaining([
      "n7: field name email used twice",
      "n10: a Form inside a Form",
    ]),
  );
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd apps/playground && npx jest __tests__/editor-check.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** `editor/check.ts`.

- [ ] **Step 4: Run them**

Run: `cd apps/playground && npx jest __tests__/editor-check.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/playground/editor/check.ts apps/playground/__tests__/editor-check.test.ts
git commit -m "feat(editor): document invariants"
```

---

### Task 5: Form bindings

**Files:**

- Create: `apps/playground/editor/forms.ts`
- Test: `apps/playground/__tests__/editor-forms.test.ts`

**Interfaces:**

- Consumes: Task 1 queries, Task 3 `entryFor`.
- Produces:

```ts
/** "Email address" → "emailAddress"; accents dropped, non-letters removed, a leading digit prefixed with "field". "" for no letters. */
export const camelName: (label: string) => string;
/** The Form a node sits in (nearest ancestor with `form: true`), or null. */
export const formOf: (doc: LayoutDocument, id: NodeId) => NodeId | null;
/** Binds every field component inside a Form and unbinds every one outside, in walk order: a field keeps its name while it is free in its Form, otherwise it gets `base`, `base2`, `base3`…, where base is camelName(label) or, with no label, lowerFirst(type) + a number from 1 (`input1`). Returns the same document when nothing changes. */
export const normalizeFields: (doc: LayoutDocument) => LayoutDocument;
/** Why `name` cannot be that field's name ("Not a valid name", "Already used in this form", "Not a field in a form"), or null. */
export const fieldNameProblem: (
  doc: LayoutDocument,
  id: NodeId,
  name: string,
) => string | null;
export const setFieldName: (
  doc: LayoutDocument,
  id: NodeId,
  name: string,
) => LayoutDocument; // same doc when fieldNameProblem
export const setFieldRules: (
  doc: LayoutDocument,
  id: NodeId,
  rules: FieldRule[],
) => LayoutDocument; // same doc for an unbound node
```

- [ ] **Step 1: Write the failing tests.** `withForm` is the fixture plus a Form `n7` at `(0, 8, 6, 4)` with `columns: 6` holding `n8` Input `{ label: "Email" }` at `(0, 0, 3, 2)`, `n9` Input `{ label: "Email" }` at `(3, 0, 3, 2)` and `n10` Checkbox with no label at `(0, 2, 3, 1)`, and on the page `n11` Input at `(6, 8, 4, 2)`; deep-frozen. `fieldNames(doc, form)` lists the names of that Form's fields in walk order.

```ts
it("makes names from labels", () => {
  expect(camelName("Email address")).toBe("emailAddress");
  expect(camelName("Città di residenza")).toBe("cittaDiResidenza");
  expect(camelName("2nd phone")).toBe("field2ndPhone");
  expect(camelName("!!")).toBe("");
});
it("names the second field with the same label email2", () => {
  const out = normalizeFields(withForm);
  expect(fieldNames(out, "n7")).toEqual(["email", "email2", "checkbox1"]);
  expect(findNode(out, "n11")?.field).toBeUndefined(); // the Input outside the Form
  expect(checkDocument(out)).toEqual([]);
});
it("keeps a free name and the same document when nothing changes", () => {
  const once = normalizeFields(withForm);
  expect(normalizeFields(once)).toBe(once);
});
it("validates a new name", () => {
  const doc = normalizeFields(withForm);
  expect(fieldNameProblem(doc, "n8", "email2")).toBe(
    "Already used in this form",
  );
  expect(fieldNameProblem(doc, "n8", "my email")).toBe("Not a valid name");
  expect(fieldNameProblem(doc, "n11", "x")).toBe("Not a field in a form");
  expect(setFieldName(doc, "n8", "email2")).toBe(doc);
  expect(findNode(setFieldName(doc, "n8", "work"), "n8")?.field?.name).toBe(
    "work",
  );
});
it("sets rules on a bound field only", () => {
  const doc = normalizeFields(withForm);
  const rules = [{ required: true }, { type: "email" as const }];
  expect(findNode(setFieldRules(doc, "n8", rules), "n8")?.field?.rules).toEqual(
    rules,
  );
  expect(setFieldRules(doc, "n11", rules)).toBe(doc);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd apps/playground && npx jest __tests__/editor-forms.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** `editor/forms.ts` (accents: `normalize("NFD")` and drop combining marks).

- [ ] **Step 4: Run them**

Run: `cd apps/playground && npx jest __tests__/editor-forms.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/playground/editor/forms.ts apps/playground/__tests__/editor-forms.test.ts
git commit -m "feat(editor): form bindings"
```

---

### Task 6: The editing operations

**Files:**

- Create: `apps/playground/editor/operations.ts`
- Test: `apps/playground/__tests__/editor-operations.test.ts`

**Interfaces:**

- Consumes: Tasks 1–5.
- Produces:

```ts
/** A grid slot takes a cell; a flow container takes an index. */
export type Destination =
  | { slot: Slot; cell: { x: number; y: number } }
  | { slot: Slot; index: number };
/** Whether a node of `type` (or the node `movingId`) may go in `slot`: accepted there, not into itself, no Form in a Form, and a grid container fits the slot's columns with its children. */
export const canPlace: (
  doc: LayoutDocument,
  type: string,
  slot: Slot,
  movingId?: NodeId,
) => boolean;
export const insertNode: (
  doc: LayoutDocument,
  type: string,
  dest: Destination,
) => { doc: LayoutDocument; id: NodeId };
export const moveNode: (
  doc: LayoutDocument,
  id: NodeId,
  dest: Destination,
) => LayoutDocument;
export const removeNode: (doc: LayoutDocument, id: NodeId) => LayoutDocument;
export const duplicateNode: (
  doc: LayoutDocument,
  id: NodeId,
) => { doc: LayoutDocument; id: NodeId };
/** Merges props; a key set to undefined is removed. */
export const setProps: (
  doc: LayoutDocument,
  id: NodeId,
  props: Record<string, unknown>,
) => LayoutDocument;
export const setText: (
  doc: LayoutDocument,
  id: NodeId,
  text: string,
) => LayoutDocument;
/** Moves or resizes a node within its own grid. */
export const placeNode: (
  doc: LayoutDocument,
  id: NodeId,
  placement: GridPlacement,
) => LayoutDocument;
/** Grows a node on a grid to hold `contentHeight` dp (measured by the canvas), never shrinking it. */
export const growToFit: (
  doc: LayoutDocument,
  id: NodeId,
  contentHeight: number,
) => LayoutDocument;
export const addTab: (
  doc: LayoutDocument,
  id: NodeId,
  label: string,
) => LayoutDocument;
export const renameTab: (
  doc: LayoutDocument,
  id: NodeId,
  tab: number,
  label: string,
) => LayoutDocument;
export const removeTab: (
  doc: LayoutDocument,
  id: NodeId,
  tab: number,
) => LayoutDocument;
export const moveTab: (
  doc: LayoutDocument,
  id: NodeId,
  from: number,
  to: number,
) => LayoutDocument;
```

Rules every operation follows (from §11.3–11.6), each ending with `normalizeFields`:

- A new node takes the manifest's `defaultProps`, `defaultText`, and on a grid `defaultSize` (its `w` cut to the slot's columns); a grid container gets `columns = w` and `children: []`; a TabbedPanel gets two panels `"Tab 1"`, `"Tab 2"` with `columns = w`.
- Placing on a grid puts the node at the cell (clamped by `snapCell`'s rule: `x ≤ columns − w`) and `pushDown`s the rest of that slot.
- Moving keeps `w`/`h` between grids (cut to the target's columns, and a grid container's `columns` follows); into a flow container drops `layout`; out of one gives `defaultSize`. Duplicating places the copy at the original's `x`, `y + h` (pushing down), or right after it in a flow; every id in the copy is new.
- `placeNode` clamps to the columns and `minSize`; a grid container is never narrower than its children's `extent().columns` and its `columns` follows `w`; the rest of the slot is pushed down.
- A refused operation (`canPlace` false, unknown id, a resize that cannot apply) returns the same document. `removeTab` refuses the last tab.

- [ ] **Step 1: Write the failing tests** (`doc = deepFreeze(fixture)`; after every successful operation also `expect(checkDocument(out)).toEqual([])`):

```ts
it("inserts on the page at a free cell", () => {
  const { doc: out, id } = insertNode(doc, "Input", {
    slot: { kind: "page" },
    cell: { x: 6, y: 4 },
  });
  expect(id).toBe("n7");
  expect(findNode(out, id)?.layout).toEqual({ x: 6, y: 4, w: 4, h: 2 });
});
it("pushes down what a new node lands on", () => {
  const { doc: out } = insertNode(doc, "Paper", {
    slot: { kind: "page" },
    cell: { x: 0, y: 0 },
  });
  expect(findNode(out, "n1")?.layout?.y).toBe(4);
  expect(findNode(out, "n5")?.layout?.y).toBe(8);
});
it("inserts into a flow container at an index, without a layout", () => {
  const { doc: out, id } = insertNode(doc, "Input", {
    slot: { kind: "children", parent: "n5" },
    index: 0,
  });
  expect(findNode(out, "n5")?.children?.[0].id).toBe(id);
  expect(findNode(out, id)?.layout).toBeUndefined();
});
it("moves between grids keeping the size, and out of a flow with the default size", () => {
  const a = moveNode(doc, "n2", {
    slot: { kind: "page" },
    cell: { x: 0, y: 8 },
  });
  expect(findNode(a, "n2")?.layout).toEqual({ x: 0, y: 8, w: 6, h: 1 });
  expect(findNode(a, "n1")?.children).toEqual([]);
  const b = moveNode(doc, "n6", {
    slot: { kind: "page" },
    cell: { x: 8, y: 8 },
  });
  expect(findNode(b, "n6")?.layout).toEqual({ x: 8, y: 8, w: 3, h: 1 }); // Button 3×1
});
it("refuses to move a node into itself", () => {
  expect(
    moveNode(doc, "n1", {
      slot: { kind: "children", parent: "n1" },
      cell: { x: 0, y: 2 },
    }),
  ).toBe(doc);
});
it("cuts a node to the columns of a narrower grid", () => {
  const { doc: wide, id } = insertNode(doc, "DataGrid", {
    slot: { kind: "page" },
    cell: { x: 0, y: 8 },
  }); // 12 wide
  const out = moveNode(wide, id, {
    slot: { kind: "children", parent: "n1" },
    cell: { x: 3, y: 1 },
  });
  expect(findNode(out, id)?.layout).toMatchObject({ x: 0, w: 6 });
});
it("removes a node with its children", () => {
  const out = removeNode(doc, "n1");
  expect(findNode(out, "n2")).toBeNull();
});
it("duplicates below the original with new ids", () => {
  const { doc: out, id } = duplicateNode(doc, "n1");
  expect(findNode(out, id)?.layout).toEqual({ x: 0, y: 4, w: 6, h: 4 });
  expect(findNode(out, id)?.children?.[0].id).not.toBe("n2");
  expect(findNode(out, "n5")?.layout?.y).toBe(8);
});
it("widens a container, its columns following, and pushes down what it now covers", () => {
  const out = placeNode(doc, "n1", { x: 0, y: 0, w: 8, h: 4 });
  expect(findNode(out, "n1")).toMatchObject({ columns: 8, layout: { w: 8 } });
  expect(findNode(out, "n3")?.layout?.y).toBe(4);
});
it("never narrows a container past its children", () => {
  expect(
    findNode(placeNode(doc, "n1", { x: 0, y: 0, w: 3, h: 4 }), "n1")?.layout?.w,
  ).toBe(6);
});
it("grows to fit its content and pushes down below it", () => {
  const out = growToFit(doc, "n1", 400); // rowsFor(400) = 7
  expect(findNode(out, "n1")?.layout?.h).toBe(7);
  expect(findNode(out, "n5")?.layout?.y).toBe(7);
  expect(growToFit(doc, "n1", 10)).toBe(doc); // never shrinks
});
it("edits props and text", () => {
  const out = setProps(doc, "n1", { elevation: 2 });
  expect(findNode(out, "n1")?.props).toEqual({ elevation: 2 });
  expect(
    findNode(setProps(out, "n1", { elevation: undefined }), "n1")?.props,
  ).toEqual({});
  expect(findNode(setText(doc, "n2", "Hello"), "n2")?.text).toBe("Hello");
});
it("edits tabs and keeps at least one tab", () => {
  const added = addTab(doc, "n3", "C");
  expect(findNode(added, "n3")?.tabs?.map((t) => t.label)).toEqual([
    "A",
    "B",
    "C",
  ]);
  expect(
    findNode(moveTab(added, "n3", 0, 2), "n3")?.tabs?.map((t) => t.label),
  ).toEqual(["B", "C", "A"]);
  const removed = removeTab(doc, "n3", 0);
  expect(findNode(removed, "n4")).toBeNull();
  expect(removeTab(removed, "n3", 0)).toBe(removed); // "B" is the last tab
});
it("binds a field moved into a Form and unbinds it when it leaves", () => {
  const { doc: withForm, id: form } = insertNode(doc, "Form", {
    slot: { kind: "page" },
    cell: { x: 0, y: 8 },
  });
  const inside = moveNode(withForm, "n4", {
    slot: { kind: "children", parent: form },
    cell: { x: 0, y: 0 },
  });
  expect(findNode(inside, "n4")?.field).toEqual({ name: "name", rules: [] });
  const outside = moveNode(inside, "n4", {
    slot: { kind: "page" },
    cell: { x: 6, y: 20 },
  });
  expect(findNode(outside, "n4")?.field).toBeUndefined();
});
it("renames a duplicated field", () => {
  const { doc: withForm, id: form } = insertNode(doc, "Form", {
    slot: { kind: "page" },
    cell: { x: 0, y: 8 },
  });
  const inside = moveNode(withForm, "n4", {
    slot: { kind: "children", parent: form },
    cell: { x: 0, y: 0 },
  });
  const { doc: out, id } = duplicateNode(inside, "n4");
  expect(findNode(out, id)?.field?.name).toBe("name2");
});
it("refuses a Form in a Form", () => {
  const { doc: withForm, id: form } = insertNode(doc, "Form", {
    slot: { kind: "page" },
    cell: { x: 0, y: 8 },
  });
  expect(canPlace(withForm, "Form", { kind: "children", parent: form })).toBe(
    false,
  );
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd apps/playground && npx jest __tests__/editor-operations.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** `editor/operations.ts` (a private `updateTree(doc, fn)` that rebuilds only the path to the changed node is the expected shape; the rest of the tree keeps its objects).

- [ ] **Step 4: Run them, then every editor test**

Run: `cd apps/playground && npx jest __tests__/editor-`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/playground/editor/operations.ts apps/playground/__tests__/editor-operations.test.ts
git commit -m "feat(editor): editing operations"
```

---

### Task 7: Undo and redo

**Files:**

- Create: `apps/playground/editor/history.ts`
- Test: `apps/playground/__tests__/editor-history.test.ts`

**Interfaces:**

- Produces:

```ts
export const HISTORY_LIMIT = 100;
export interface History {
  past: LayoutDocument[];
  present: LayoutDocument;
  future: LayoutDocument[];
  /** The key of the last commit, for coalescing. */
  lastKey: string | null;
}
export const createHistory: (doc: LayoutDocument) => History;
/** A new step; with the same `key` as the last commit it replaces that step instead (typing in one field). Committing the present document changes nothing. A commit clears the future. */
export const commit: (
  history: History,
  doc: LayoutDocument,
  key?: string,
) => History;
export const undo: (history: History) => History; // same history when nothing to undo
export const redo: (history: History) => History;
```

- [ ] **Step 1: Write the failing tests** (`d0`…`d3` are four distinct documents, e.g. `emptyDocument("0")`…):

```ts
it("undoes and redoes", () => {
  const h = commit(commit(createHistory(d0), d1), d2);
  expect(undo(h).present).toBe(d1);
  expect(undo(undo(h)).present).toBe(d0);
  expect(redo(undo(h)).present).toBe(d2);
  expect(undo(createHistory(d0)).present).toBe(d0);
});
it("clears the future on a new commit", () => {
  const h = commit(undo(commit(createHistory(d0), d1)), d2);
  expect(redo(h)).toBe(h);
});
it("coalesces a run of edits with the same key", () => {
  const h = commit(
    commit(commit(createHistory(d0), d1, "text:n2"), d2, "text:n2"),
    d3,
    "text:n2",
  );
  expect(h.present).toBe(d3);
  expect(undo(h).present).toBe(d0);
});
it("keeps the last hundred steps", () => {
  let h = createHistory(d0);
  for (let i = 0; i < 150; i++) h = commit(h, emptyDocument(String(i)));
  expect(h.past).toHaveLength(HISTORY_LIMIT);
});
it("ignores a commit of the present document", () => {
  const h = createHistory(d0);
  expect(commit(h, d0)).toBe(h);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd apps/playground && npx jest __tests__/editor-history.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** `editor/history.ts`.

- [ ] **Step 4: Run them**

Run: `cd apps/playground && npx jest __tests__/editor-history.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/playground/editor/history.ts apps/playground/__tests__/editor-history.test.ts
git commit -m "feat(editor): undo and redo"
```

---

### Task 8: Verify and hand off

**Files:**

- Modify: `docs/handoff/<today>.md` (a section for this work), `docs/superpowers/specs/2026-10-26-layout-editor-design.md` (§19: phase 2 marked done with the date), `apps/playground/CLAUDE.md` (a short "The layout editor's core" section: where it lives, the immutability rule, `checkDocument`)

- [ ] **Step 1: Run everything**

Run: `npm run type-check && npm test && npm run lint`
Expected: type-check clean; every suite PASS; lint shows only the pre-existing `FieldShell.tsx:108` error.

- [ ] **Step 2: Write the handoff section, the CLAUDE.md section and mark phase 2 done in §19.**

- [ ] **Step 3: Commit**

```bash
git add docs apps/playground/CLAUDE.md
git commit -m "docs: handoff for the layout editor core"
```
