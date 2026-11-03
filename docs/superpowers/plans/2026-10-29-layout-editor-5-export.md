# Layout editor, plan 5: Export (code, preview, JSON) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An **Export** button in the editor's toolbar opens a panel with the layout as a `.tsx` file (copy, download), a **Preview** that runs that exact code, and the layout's **JSON** (copy, download, import).

**Architecture:** Two pure modules beside the model: `editor/codegen.ts` turns a document into the text of a component file, and `editor/importJson.ts` turns a JSON text into a sound document (refusing it, or repairing it with notes). A view, `editor/canvas/ExportPanel.tsx`, is a library `Dialog` with three tabs over them; the Preview compiles the exported text with the site's `compileExample`, exactly as a component page compiles its edited example.

**Tech Stack:** TypeScript, React Native + react-native-web, `@its/glowup-ui` (`Dialog`, `Tabs`, `CodeBlock`, `Download`, `Upload`, `InputArea`, `Button`, `ViewportProvider`, `Form`, `FormField`, `TabContent`, `GridLayout`), `site/liveCode.ts` (`compileExample`, sucrase), `docgen/props.generated.json` (component defaults), jest-expo + RNTL 14.

**Spec:** `docs/superpowers/specs/2026-10-26-layout-editor-design.md` — §2 "Export", §5 (anti-goals), §7, §11.7 (forms in the export), §14 "JSON", §15, §20. Builds on plans 3–4 (`apps/playground/CLAUDE.md`, "The canvas").

## Global Constraints

- §15: "A `.tsx` file: imports from `react` and `@its/glowup-ui` (only what is used), a default-exported component named after the layout, one layout constant per grid (`LAYOUT`, `N1_LAYOUT`…), `GridLayout` for the page and inside each grid container, children with `key`, flow containers with their children in order."
- §15: "Props equal to the component's default are left out; strings in quotes, other values in braces; objects and arrays printed as literals." The default is the prop's `default` in `docgen/props.generated.json` (`components[type].props[].default`, source text: `"\"filled\""`, `"1"`, `"true"`); a default that is not a JSON literal is unknown, and the prop is kept.
- §15: "Handlers are not invented: a header comment lists what is left to wire"; "Formatting: 2 spaces, double quotes, trailing commas, the shape the examples use; no Prettier at run time."
- §5 anti-goal: "Exported code that does not compile, or renders something other than the canvas."
- §14: "Import validates `format`, `version`, types against the manifest, props against the registry and layouts against their grids (inside the columns, no overlaps), and reports what it dropped or moved." Download: library `Download` (a share sheet on native, its default); import: library `Upload` on the web, a paste field everywhere.
- "Props against the registry" is read as **against the component's prop table** (`docgen/props.generated.json`): the registry lists only the props that have a control, and the manifest's starting props (`options`, `data`, `source`…) are not among them.
- The Preview lives in the Export panel (§2 puts it there); the toolbar's separate "Preview" of §2's sketch is not part of this plan.
- An import is **one** undo step. `editor/*.ts` stays pure (no React, React Native or library import; JSON data and the manifest are fine). Library by name only, no new dependency, no commits (the user commits).
- Line rule for the printer, so the output has the examples' shape: anything that fits in **80 columns** stays on one line; otherwise an import puts one name per line, a JSX tag one attribute per line (the `>` or `/>` back at the tag's indent), an array or object one entry per line — all 2 spaces deeper, with trailing commas.

## Review Focus

1. **Text and props with characters JSX or TypeScript treat specially** (`"`, `{`, `}`, `<`, `\`, a newline, "€"): the export compiles and shows exactly those strings — test in Task 2.
2. **Labels that make clashing or invalid state names** (two inputs labelled "Email", "class", "2nd step", no label): distinct valid identifiers, and the file compiles — tests in Tasks 1 and 2.
3. **A layout name that is not an identifier** ("2024 report", an empty name, "für Kunden"): a valid component and file name — test in Task 1.
4. **A JSON file that is not this editor's, hand-edited, or from a newer version** (not JSON, another `format`, `version: 2`, an unknown type, overlaps, a duplicate id, a prop the component does not have): refused with a message or repaired with notes; the canvas never gets a document `checkDocument` rejects — tests in Task 3.
5. **An empty layout, an empty container, an empty tab panel**: the export compiles and the preview renders them without throwing — test in Task 2.

---

### Task 1: The code generator

**Files:**

- Create: `apps/playground/editor/codegen.ts`
- Test: `apps/playground/__tests__/editor-codegen.test.ts`

**Interfaces:**

- Consumes: `camelName` (`editor/forms.ts`), `MANIFEST` / `entryFor` (`editor/manifest.ts`), `walk` (`editor/document.ts`), `docgen/props.generated.json`.
- Produces:
  - `componentName(layoutName: string): string` — `camelName(layoutName)` with its first letter upper-cased; `"Layout"` when that is empty.
  - `exportCode(doc: LayoutDocument): string` — the file's text, ending in a newline.
- The output, decided here (each a test below):
  - Header: `// <name>: exported from the Glowup layout editor.`, then, when anything is left to wire, `// Left to wire:` and one `// - <what>: <handler>` per node in reading order, where `<handler>` is `onClick` for `Button`, `IconButton`, `ProgressButton` and `onSubmit` for `Form`, and `<what>` is `<type> "<text or label>"` or, with neither, `<type> <id>`.
  - Imports: `import React from "react";` (with `, { useState }` when used); `import { View } from "react-native";` only for a TabbedPanel; the library's names sorted.
  - One `const <KEY> = [...]` per non-empty grid, `{ id: "n2", x: 0, y: 0, w: 6, h: 1 }` per item: `LAYOUT` for the page, `<ID>_LAYOUT` for a grid container (`N1_LAYOUT`), `<ID>_TAB<i + 1>_LAYOUT` for a tab panel (`N3_TAB1_LAYOUT`). An empty grid container prints no grid inside it (`<Paper key="n9" style={{ flexGrow: 1 }} />`).
  - `GridLayout` gets `layout`, and `columns` / `rowHeight` / `gap` only where they differ from 12 / 48 / 16.
  - A container placed on a grid gets `style={{ flexGrow: 1 }}` (the canvas draws it so, plan 3's ruling); a text component prints its `text` as the child.
  - **State** (§15 "Controlled components"): a component with `controlled` outside every Form gets `const [<name>, set<Name>] = useState(<initial>);` in reading order, `<name>` = `camelName(label)` or the type in lower case, made unique and never a JavaScript reserved word by a counter (`email`, `email2`, `class2`), wired as `<value>={<name>} <onChange>={set<Name>}` after the node's own props.
  - **Form** (§11.7): `<Form key initialValues={{ <name>: <field.initial>, … }} …props style>`; each bound field becomes `<FormField key name [rules] [valuePropName] [trigger]>{(field) => <Type {...field} …props />}</FormField>`, `valuePropName` / `trigger` only when not `value` / `onChange`, `rules` only when not empty; a field in a Form gets no `useState`.
  - **TabbedPanel**: `const [tab, setTab] = useState(0);` (then `tab2`…), a `<View key style={{ flexGrow: 1 }}>` holding `<Tabs tabs={[…labels]} activeTab={tab} onChange={setTab} />` and `<TabContent activeTab={tab}>` with one child per panel: its `GridLayout`, or `<View />` for an empty panel (indices stay in step).
  - Strings: an attribute is `name="…"` unless it holds `"`, `\` or a line break (then `name={"…"}`, `JSON.stringify`); a text child is raw unless it holds `{`, `}`, `<`, `>`, a line break or leading/trailing spaces (then `{"…"}`). Booleans print `name={true}`. Object keys are bare when they are identifiers.

- [ ] **Step 1: Write the failing tests**

The golden — this document (inline in the test):

```json
{
  "format": "glowup-layout",
  "version": 1,
  "name": "Contact card",
  "grid": { "columns": 12, "rowHeight": 48, "gap": 16 },
  "items": [
    {
      "id": "n1",
      "type": "Paper",
      "props": {},
      "layout": { "x": 0, "y": 0, "w": 6, "h": 3 },
      "columns": 6,
      "children": [
        {
          "id": "n2",
          "type": "Typography",
          "props": { "variant": "titleMedium" },
          "text": "Contact",
          "layout": { "x": 0, "y": 0, "w": 6, "h": 1 }
        },
        {
          "id": "n3",
          "type": "Input",
          "props": { "label": "Email" },
          "layout": { "x": 0, "y": 1, "w": 4, "h": 2 }
        }
      ]
    },
    {
      "id": "n4",
      "type": "VStack",
      "props": {},
      "layout": { "x": 6, "y": 0, "w": 3, "h": 2 },
      "children": [
        {
          "id": "n5",
          "type": "Button",
          "props": { "variant": "filled" },
          "text": "Save"
        }
      ]
    }
  ]
}
```

`"exports a layout as a component file"` — `exportCode(contactCard)` is exactly:

```tsx
// Contact card: exported from the Glowup layout editor.
// Left to wire:
// - Button "Save": onClick
import React, { useState } from "react";
import {
  Button,
  GridLayout,
  Input,
  Paper,
  Typography,
  VStack,
} from "@its/glowup-ui";

const LAYOUT = [
  { id: "n1", x: 0, y: 0, w: 6, h: 3 },
  { id: "n4", x: 6, y: 0, w: 3, h: 2 },
];

const N1_LAYOUT = [
  { id: "n2", x: 0, y: 0, w: 6, h: 1 },
  { id: "n3", x: 0, y: 1, w: 4, h: 2 },
];

export default function ContactCard() {
  const [email, setEmail] = useState("");
  return (
    <GridLayout layout={LAYOUT}>
      <Paper key="n1" style={{ flexGrow: 1 }}>
        <GridLayout layout={N1_LAYOUT} columns={6}>
          <Typography key="n2" variant="titleMedium">
            Contact
          </Typography>
          <Input key="n3" label="Email" value={email} onChange={setEmail} />
        </GridLayout>
      </Paper>
      <VStack key="n4" style={{ flexGrow: 1 }}>
        <Button key="n5">Save</Button>
      </VStack>
    </GridLayout>
  );
}
```

(`Button`'s `variant="filled"` is its default, so it is left out.)

More tests, each on a small document built in the test:

- `"names the component after the layout"` (Review Focus 3): `componentName("Pagina di dettaglio")` → `"PaginaDiDettaglio"`; `"2024 report"` → `"Field2024Report"`; `""` → `"Layout"`; `"für Kunden"` → `"FurKunden"`.
- `"gives every controlled component its own state"` (Review Focus 2): four Inputs labelled `"Email"`, `"Email"`, `"class"`, and none → the text contains `const [email, setEmail]`, `const [email2, setEmail2]`, `const [class2, setClass2]`, `const [input, setInput]`.
- `"binds a Form's fields instead"`: a Form `f1` (`w: 6`, `columns: 6`) holding an Input `n2` (`label: "Email"`, `field: { name: "email", rules: [{ required: true }, { type: "email" }], auto: true }`) and a Checkbox `n3` (`label: "I agree"`, `field: { name: "iAgree", rules: [], auto: true }`) → contains `initialValues={{ email: "", iAgree: false }}`, `name="email" rules={[{ required: true }, { type: "email" }]}`, `{(field) => <Input {...field} label="Email" />}`, `valuePropName="checked"`, `trigger="onValueChange"`, `// - Form f1: onSubmit`; does not contain `useState`.
- `"turns a TabbedPanel into Tabs and TabContent"`: the shared fixture (`__tests__/__fixtures__/editor-document.json`) → contains `const [tab, setTab] = useState(0);`, `import { View } from "react-native";`, `<Tabs tabs={["A", "B"]} activeTab={tab} onChange={setTab} />`, `<TabContent activeTab={tab}>`, `const N3_TAB1_LAYOUT = [`, and `<View />` (panel B is empty).

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-codegen`
Expected: FAIL — module `../editor/codegen` not found.

- [ ] **Step 3: Implement `componentName` and `exportCode` in `editor/codegen.ts`**

A small printer of lines with an indent; values through one `printValue(value, indent)` that tries the one-line form and falls back to one entry per line (the line rule).

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-codegen`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 2: Fidelity — the export draws what the canvas draws

**Files:**

- Modify: `apps/playground/editor/canvas/RenderTree.tsx` (a TabbedPanel's shown panel inside `TabContent`, as the export draws it)
- Test: `apps/playground/__tests__/editor-export-fidelity.test.tsx`, `apps/playground/__tests__/editor-render-tree.test.tsx`

**Interfaces:**

- Consumes: `exportCode` (Task 1), `compileExample` (`site/liveCode.ts`), `RenderTree`.
- Produces: nothing new; the canvas's TabbedPanel body becomes `<Tabs …/>` + `<TabContent activeTab={shown}>{panels as InnerGrids, the shown one only}</TabContent>`.

- [ ] **Step 1: Write the failing tests**

A helper `texts(tree)` collects every string in a rendered tree (`toJSON()`), in order. The canvas's texts leave out `"Drop components here"` (its placeholder, not part of the layout).

- `"the starter exports a file that draws what the canvas draws"`: for `editor/starters/detail.json` and the shared fixture, `compileExample(exportCode(doc))` is `ok`, renders under `ThemeProvider` without throwing, and its `texts` equal those of `<RenderTree doc={doc} />` minus the placeholder.
- **Review Focus 1** `"keeps every character of texts and props"`: a page with a Typography whose text is `He said "hi" {x} </b> \\ back`, a Typography with text `"Prezzo: 12 €\nIVA inclusa"`, and an Input with `label: 'Il "nome"'` → compiles, and the rendered texts include those three strings exactly.
- **Review Focus 2** `"compiles with clashing labels"`: the four-Input document of Task 1 → `ok`, renders.
- **Review Focus 5** `"compiles an empty layout, container and tab panel"`: `emptyDocument("Empty")`; a page with one empty Paper; the fixture (panel B empty) → each `ok` and renders.
- Render tree `"draws a tab panel in TabContent, as the export does"`: an ancestor of `inner-n3` within `frame-n3` has style `padding: 16` (TabContent's content frame) — walk `.parent` from `screen.getByTestId("inner-n3")`.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-export-fidelity __tests__/editor-render-tree`
Expected: the render-tree test FAILS (no `TabContent` on the canvas yet). The fidelity cases may already pass with Task 1's generator: keep them (they are §20's fidelity check) and note it in the ledger.

- [ ] **Step 3: Draw the shown panel in `TabContent` in `RenderTree.tsx`; fix whatever the fidelity cases found in `codegen.ts`**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-`
Expected: PASS (the canvas's tab tests still pass: the panel's `inner:` rect is measured where `TabContent` puts it).

- [ ] **Step 5: Checkpoint**

---

### Task 3: Importing JSON

**Files:**

- Create: `apps/playground/editor/importJson.ts`
- Test: `apps/playground/__tests__/editor-import.test.ts`

**Interfaces:**

- Consumes: `checkDocument` (`check.ts`), `canPlace`, `slotColumns` (`operations.ts`), `firstFreeCell`, `pushDown` (`engine.ts`), `normalizeFields` (`forms.ts`), `MANIFEST`, `docgen/props.generated.json`.
- Produces:
  - `type ImportResult = { ok: true; doc: LayoutDocument; notes: string[] } | { ok: false; error: string }`
  - `parseLayout(text: string): ImportResult`
- Refused (`ok: false`), with these messages: not JSON → `"Not JSON: <parser message>"`; `format` not `"glowup-layout"` → `"Not a Glowup layout"`; `version` above 1 → `"Made by a newer editor (version <n>)"`; no `grid` or no `items` array → `"No grid or items"`; anything still broken after the repairs → `"Cannot open it: <checkDocument's first message>"`.
- Repaired, one note each, in reading order: a node of an unknown type is dropped with its children (`Dropped n7: unknown type "Nope"`); a node its slot does not take is dropped (`Dropped n8: a ListSection does not take a Button`); a repeated id gets the next free one (`Renamed a second n4 to n12`); a prop the component does not have (not in its docgen table) is removed (`Removed "colour" from n2`); a flow child's `layout` is removed (`Removed n6's layout: a VStack keeps an order`); a grid child with no layout goes to the first free cell, one outside the columns is cut to them, one that overlaps is pushed down (`Placed n5 at the first free cell`, `Moved n1 inside the 12 columns`, `Moved n3 down: it overlapped another item`). Then `normalizeFields`.

- [ ] **Step 1: Write the failing tests**

- `"opens what the editor exports, unchanged"`: `parseLayout(JSON.stringify(detail, null, 2))` → `ok`, `doc` deep-equals `detail`, `notes` `[]`.
- **Review Focus 4** `"refuses what it cannot open"`: `"{"` → error starts `"Not JSON"`; `{}` → `"Not a Glowup layout"`; the fixture with `version: 2` → `"Made by a newer editor (version 2)"`; `{ "format": "glowup-layout", "version": 1 }` → `"No grid or items"`.
- **Review Focus 4** `"repairs what it can and says so"`: the fixture with `n2.props.colour = "red"`, `n6.layout = { x: 0, y: 0, w: 2, h: 1 }`, `n5.layout = { x: 10, y: 0, w: 4, h: 3 }` (outside the columns, then over `n3`), and three page items added: `{ id: "n7", type: "Nope", props: {}, layout: { x: 0, y: 8, w: 2, h: 1 } }`, `{ id: "ls", type: "ListSection", props: {}, layout: { x: 4, y: 8, w: 4, h: 3 }, children: [{ id: "n8", type: "Button", props: {}, text: "X" }] }`, `{ id: "n4", type: "Typography", props: {}, text: "Dup", layout: { x: 8, y: 8, w: 4, h: 1 } }` → `ok`; `notes` has 7 entries and contains `Removed "colour" from n2`, `Removed n6's layout: a VStack keeps an order`, `Moved n5 inside the 12 columns`, `Moved n5 down: it overlapped another item`, `Dropped n7: unknown type "Nope"`, `Dropped n8: a ListSection does not take a Button`, and one matching `/^Renamed a second n4 to nd+$/`; `n5` ends at `{ x: 8, y: 4, w: 4, h: 3 }`; `checkDocument(result.doc)` is `[]`.
- `"every document it returns is sound"`: for each of the cases above that is `ok`, `checkDocument(doc)` is `[]`.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-import`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `parseLayout` in `editor/importJson.ts`**

Walk the tree once, slot by slot, building the repaired copy (never mutate the parsed input), then `normalizeFields`, then `checkDocument` as the last gate.

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 4: The Export panel

**Files:**

- Create: `apps/playground/editor/canvas/ExportPanel.tsx`
- Modify: `apps/playground/editor/canvas/Toolbar.tsx` (an "Export" button), `apps/playground/app/templates/editor.tsx` (the panel's visibility; it passes `device`)
- Test: `apps/playground/__tests__/editor-page.test.tsx`

**Interfaces:**

- Consumes: `exportCode`, `componentName` (Task 1), `parseLayout` (Task 3), `compileExample` (`site/liveCode.ts`), `DemoErrorBoundary` (`site/ErrorBoundary.tsx`), `STAGE_WIDTHS` / `StageWidth` (`site/stage.ts`), `Editor`.
- Produces:
  - `Toolbar` gains `onExport: () => void`: a tonal `Button` "Export" (icon `export-variant`) after the width switch.
  - `ExportPanel({ editor, device, visible, onClose }: { editor: Editor; device: StageWidth; visible: boolean; onClose: () => void })`: a `Dialog` (`title="Export"`, `width="lg"`) with `Tabs` "Code", "Preview", "JSON":
    - **Code**: `CodeBlock` (`language="tsx"`, `copyable`, `maxHeight={480}`) of `exportCode(editor.doc)`, and `<Download data={code} filename={`${componentName(name)}.tsx`} mimeType="text/plain" />`.
    - **Preview** (`testID="export-preview"`): `compileExample(code)`; on `ok`, the component under `ViewportProvider width={STAGE_WIDTHS[device]}` inside a `DemoErrorBoundary` (`label="Export preview"`) in a scroll area 480 dp high; on failure the compiler's message.
    - **JSON**: `CodeBlock` (`language="json"`, `copyable`) of `JSON.stringify(editor.doc, null, 2)`, a `Download` (`.json`, `application/json`), then the import: on the web an `Upload` (`variant="button"`, `accept=".json,application/json"`) that reads `file.file.text()`; on every platform an `InputArea` labelled `"Paste a layout's JSON"` and a Button "Import". `parseLayout` → `ok`: `editor.apply(doc)` (one undo step) and the notes listed under the heading "Imported" (`"Imported, nothing to repair"` when none); not `ok`: the error, the canvas untouched.
  - Compiled once per exported text (`useMemo` on the code), not per render.

- [ ] **Step 1: Write the failing tests** (in `editor-page.test.tsx`, which renders the whole route)

- `"exports the layout's code"`: press "Export" → some text matches `/export default function PaginaDiDettaglio\(\)/`.
- `"previews the exported code"`: press "Export", then "Preview" → `within(screen.getByTestId("export-preview")).getByText("RSSMRA80A01H501U")`.
- `"imports a pasted layout as one undo step"`: Export → "JSON" → `changeText` on `"Paste a layout's JSON"` with `JSON.stringify` of a one-Typography layout (text `"Imported"`) → press "Import" → `frame-n1` shows `"Imported"`, `"RSSMRA80A01H501U"` is gone from the canvas; press "Undo" → it is back.
- `"refuses a file that is not a layout"`: paste `{}` → `"Not a Glowup layout"` shown; the starter is still on the canvas; "Undo" is still disabled.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-page`
Expected: FAIL — no "Export" button.

- [ ] **Step 3: Implement `ExportPanel.tsx`, the button and the route's state**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor- && node ../../node_modules/typescript/bin/tsc --noEmit -p .`
Expected: PASS, no type error.

- [ ] **Step 5: Checkpoint**

---

### Task 5: Docs, full run, browser

**Files:**

- Modify: `apps/playground/CLAUDE.md` ("The canvas": the export and import), the spec §19 (phase 7 **Done** with the date; phase 6's JSON part noted done, persistence and the other starters still open), `docs/handoff/2026-10-29.md` (Italian, a section), `docs/README.md` (this plan's row)

- [ ] **Step 1: Everything**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor- && node ../../node_modules/typescript/bin/tsc --noEmit -p .`, then `npm test -w @its/glowup-playground -- --maxWorkers=2` from the root (with no dev server running), ESLint and Prettier on the changed files.
Expected: all green.

- [ ] **Step 2: Browser** (`CI=1 node ../../node_modules/expo/bin/cli start --web --port 8099` from `apps/playground`; screenshots under `c:/dev/Glowup/.playwright-mcp`, deleted afterwards)

1. 1440 × 900: Export → Code shows the file; Copy puts it on the clipboard; Download saves `PaginaDiDettaglio.tsx`. Preview draws the starter like the canvas; switch the toolbar to 360 and the preview stacks. JSON → Download; edit a label in the downloaded file and import it with Upload: the canvas shows it, one Undo brings the starter back. No console errors.
2. Paste the downloaded `.tsx` into a scratch copy of `templates/` and run `node ../../node_modules/typescript/bin/tsc --noEmit -p .`: it type-checks (then delete the copy).

- [ ] **Step 3: Checkpoint and handoff**
