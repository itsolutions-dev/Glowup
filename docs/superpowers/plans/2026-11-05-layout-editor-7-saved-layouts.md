# Layout editor, plan 7: saved layouts, autosave, starters — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The rest of phase 6: the open layout saves itself, a **Layouts** dialog in the toolbar lists the saved layouts (open, rename, delete) and starts new ones blank or from a **starter**, and two new starters join "Pagina di dettaglio": a form in sections and a dashboard with stats and a table.

**Architecture:** The saved layouts are one JSON value in AsyncStorage (`glowup.editor.library`): `{ version: 1, open, layouts: [{ id, savedAt, doc }] }`. What can be done to it is pure, in `editor/library.ts`; reading it back goes through `parseLayout`, so a stored layout is held to the same rules as an imported one. A hook, `editor/canvas/useLibrary.ts`, loads it once, writes it back, and saves the open layout 500 ms after the last edit. Opening another layout replaces the editor's history (`editor.load`), so Undo never crosses from one layout into another.

**Tech Stack:** TypeScript, React Native + react-native-web, `@react-native-async-storage/async-storage` (already a dependency, the site's `usePersistentState` uses it), `@its/glowup-ui` (`Dialog`, `Button`, `IconButton`, `Input`, `Typography`), jest-expo + RNTL 14.

**Spec:** `docs/superpowers/specs/2026-10-26-layout-editor-design.md` — §12 (starters), §14 ("Autosave … debounced; a list of saved layouts (open, rename, delete) in the toolbar"; "the editor renders after hydration only"), §19 phase 6. Builds on plans 3–6 (`apps/playground/CLAUDE.md`, "The canvas", "The panels", "Export").

## Global Constraints

- §14: "**Autosave** of the open layout … (AsyncStorage: localStorage on the web, the device's storage on native), debounced; a list of saved layouts (open, rename, delete) in the toolbar." Debounce: **500 ms** after the last change. A storage failure never breaks editing (writes are fire-and-forget, as in `usePersistentState`).
- §12: "New layouts start blank or from a **starter**: a JSON file in `editor/starters/` … First three: 'Pagina di dettaglio' …, a form in sections, a dashboard with stats and a table. Each starter is a test case for the export (§15)."
- The two new starters are in Italian like the first: **"Nuovo cliente"** (`form.json`: a `Form` with two sections — "Dati anagrafici": Nome, Cognome, Data di nascita; "Contatti": Email, Telefono — each section a `Typography` heading (`titleSmall`) over its fields, then a `Checkbox` "Accetto l'informativa" and a `Button` "Salva" with `type: "submit"` if the Button takes it) and **"Cruscotto vendite"** (`dashboard.json`: four `Stat`s in a row — Fatturato, Ordini, Clienti, Resi — over a `Paper` holding a `Typography` "Ultimi ordini" and a `DataGrid` with columns Cliente, Data, Totale and five rows). Ids `n1`…, sound by `checkDocument`, round-trip through `parseLayout` with no notes.
- A blank layout is `emptyDocument("Nuovo layout")`.
- On first visit (no stored library) the editor opens a new layout from "Pagina di dettaglio", as today.
- Unchanged: library by name only, `editor/*.ts` pure, tokens, no new dependency, no commits (the user commits).

## Review Focus

1. **Stored data that cannot be read** (not JSON, another shape, a layout `parseLayout` refuses, an `open` id that is not there): the unreadable parts are dropped, the editor opens what is left or a starter, never a crash — test in Task 1.
2. **Storage that fails** (`setItem` rejects: quota, private mode): editing goes on, nothing is thrown — test in Task 2.
3. **Deleting the open layout**: another one opens (the most recent), or a new one from "Pagina di dettaglio" when none is left — never an empty editor — tests in Tasks 1 and 3.
4. **Undo after opening another layout**: nothing to undo; Undo never brings back the previous layout's document — test in Task 3.
5. **Fast edits**: one write 500 ms after the last of them, not one per keystroke; an edit in the panel or the canvas is saved the same way — test in Task 2.

---

### Task 1: The library and the starters (pure)

**Files:**

- Create: `apps/playground/editor/library.ts`, `apps/playground/editor/starters/form.json`, `apps/playground/editor/starters/dashboard.json`, `apps/playground/editor/starters/index.ts`
- Modify: `apps/playground/editor/operations.ts` (`setName`), `apps/playground/__tests__/editor-export-fidelity.test.tsx` and `apps/playground/__tests__/editor-export-types.test.ts` (every starter)
- Test: `apps/playground/__tests__/editor-library.test.ts`

**Interfaces:**

- Produces:
  - `setName(doc: LayoutDocument, name: string): LayoutDocument` (`operations.ts`; the same document for the same name; the name trimmed, an empty one refused).
  - `STARTERS: { id: "detail" | "form" | "dashboard"; doc: LayoutDocument }[]` (`starters/index.ts`, in that order).
  - In `library.ts`: `interface SavedLayout { id: string; savedAt: number; doc: LayoutDocument }`, `interface Library { version: 1; open: string | null; layouts: SavedLayout[] }`, and:
    - `emptyLibrary(): Library`
    - `readLibrary(raw: string | null): Library` — `null`, not JSON, not the shape → `emptyLibrary()`; each layout kept only when `parseLayout(JSON.stringify(doc))` is `ok` (its repaired `doc`), ids not matching `/^l\d+$/` or repeated dropped; `open` kept only if it names a kept layout, else `null`.
    - `addLayout(library: Library, doc: LayoutDocument, now: number): { library: Library; id: string }` — id `l<n>` (one more than the largest), opened.
    - `saveLayout(library: Library, id: string, doc: LayoutDocument, now: number): Library` — the same object when that layout already holds `doc` (by reference) or `id` is unknown.
    - `openLayout(library: Library, id: string): Library`
    - `removeLayout(library: Library, id: string): Library` — removing the open one opens the most recent remaining (largest `savedAt`), or `null` when none is left.
    - `recent(library: Library): SavedLayout[]` — by `savedAt`, newest first.

- [ ] **Step 1: Write the failing tests** (`editor-library.test.ts`)

- `"starts empty, and reads back what it wrote"`: `readLibrary(null)` equals `emptyLibrary()`; a library with two added layouts, `JSON.stringify`ed and read back, deep-equals itself.
- **Review Focus 1** `"drops what it cannot read"`: `readLibrary("{")`, `readLibrary("[]")`, `readLibrary('{"version":1}')` → `emptyLibrary()`; a stored library with a layout whose `doc` is `{}` and one valid layout → only the valid one; `open` naming the dropped one → `null`.
- `"adds, saves, renames and opens layouts"`: `addLayout` twice → ids `l1`, `l2`, `open === "l2"`; `saveLayout(lib, "l1", doc, 5)` → that layout's `doc` and `savedAt` 5; `saveLayout` with the same `doc` → `toBe(lib)`; `openLayout(lib, "l1").open === "l1"`.
- **Review Focus 3** `"removing the open layout opens the most recent one"`: three layouts saved at 1, 3, 2, `open` the one at 3; remove it → `open` is the one saved at 2; remove the rest → `open === null`.
- `"recent lists newest first"`.
- `"names a layout"`: `setName(doc, "  Ordini ")` → `name === "Ordini"`; `setName(doc, "")` and `setName(doc, doc.name)` → `toBe(doc)`.
- Starters: `"every starter is sound and opens unchanged"`: for each of `STARTERS`, `checkDocument(doc)` is `[]` and `parseLayout(JSON.stringify(doc))` is `{ ok: true, doc, notes: [] }`; their names are "Pagina di dettaglio", "Nuovo cliente", "Cruscotto vendite".
- Extend the fidelity test's `it.each` and the type-check test to every `STARTERS` doc (the export of each draws the canvas's texts and type-checks).

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-library __tests__/editor-export-`
Expected: FAIL — `library.ts`, `starters/index.ts` and `setName` missing.

- [ ] **Step 3: Implement `library.ts`, `setName`, the two starters and `starters/index.ts`**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 2: Loading, autosave and opening another layout

**Files:**

- Create: `apps/playground/editor/canvas/useLibrary.ts`
- Modify: `apps/playground/editor/canvas/useEditor.ts` (`load`)
- Test: `apps/playground/__tests__/editor-library-hook.test.tsx`

**Interfaces:**

- Consumes: Task 1.
- Produces:
  - `Editor.load(doc: LayoutDocument): void` — a fresh history on `doc` (nothing to undo or redo), no selection, no open tabs.
  - `useLibrary(): { ready: boolean; library: Library; add(doc): string; open(id): void; save(id, doc): void; rename(id, name): void; remove(id): void }` — reads `glowup.editor.library` once (`readLibrary`), then every change writes the whole library back (`setItem(...).catch(() => {})`). `save` is what autosave calls.
  - `useAutosave(editor: Editor, library: ReturnType<typeof useLibrary>): void` — 500 ms after `editor.doc` last changed, `library.save(library.library.open, editor.doc)`; nothing while not `ready` or with nothing open; the timer cleared on unmount.

- [ ] **Step 1: Write the failing tests** (a harness with `useEditor`, `useLibrary`, `useAutosave`; AsyncStorage mocked as an in-memory map; fake timers)

- `"loads the stored library"`: storage holds a library with `l1` open → `ready` becomes true, `library.open === "l1"`.
- **Review Focus 5** `"saves 500 ms after the last edit, once"`: three `editor.apply` 100 ms apart → no write until 500 ms after the third; then exactly one `setItem`, whose library holds the third document.
- **Review Focus 2** `"keeps editing when storage fails"`: `setItem` rejects → an edit and 500 ms pass without an unhandled rejection; the editor's document is the edited one.
- `"load starts a fresh history"`: two edits, then `editor.load(other)` → `doc` is `other`, `canUndo` false, `selected` null.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-library-hook`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `load`, `useLibrary` and `useAutosave`**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor- && node ../../node_modules/typescript/bin/tsc --noEmit -p .`
Expected: PASS, no type error.

- [ ] **Step 5: Checkpoint**

---

### Task 3: The Layouts dialog and the route

**Files:**

- Create: `apps/playground/editor/canvas/LayoutsDialog.tsx`
- Modify: `apps/playground/editor/canvas/Toolbar.tsx` (an IconButton "Layouts", icon `folder-outline`, before the name), `apps/playground/app/templates/editor.tsx` (the library, autosave, first visit, the dialog)
- Test: `apps/playground/__tests__/editor-page.test.tsx` (AsyncStorage mocked as an in-memory map for the whole file)

**Interfaces:**

- Consumes: Tasks 1–2.
- Produces:
  - The route renders after hydration **and** `library.ready` (until then nothing, as before hydration). With `library.open` null it adds a layout from "Pagina di dettaglio" and opens it; the editor starts on the open layout's `doc`.
  - `LayoutsDialog({ visible, onClose, library, current, onOpen, onNew })`: `Dialog` (`title="Layouts"`); one row per `recent(library)` layout: its name (the open one marked "Open"), an `Input` labelled `Name of <name>` committing `rename` on blur, IconButtons `Open <name>` and `Delete <name>`; under them "New layout:" Buttons "Blank", "Pagina di dettaglio", "Nuovo cliente", "Cruscotto vendite".
  - Opening or creating a layout: `library.open(id)` / `library.add(doc)` and `editor.load(doc)`; deleting the open one loads whatever `removeLayout` opens, or a new "Pagina di dettaglio" when none is left.

- [ ] **Step 1: Write the failing tests**

- `"opens the starter on a first visit, and the saved layout after"`: empty storage → the canvas shows "RSSMRA80A01H501U"; edit a text through the Properties panel, wait 500 ms (fake timers), unmount; draw the page again → the edited text is on the canvas.
- `"starts a new layout from a starter"`: "Layouts" → "Cruscotto vendite" → the canvas shows "Fatturato"; "Layouts" lists two layouts.
- **Review Focus 4** `"opening another layout leaves nothing to undo"`: edit, then open the other layout from the dialog → "Undo" disabled; open the first again → its edited document, "Undo" disabled.
- `"renames a layout"`: "Name of Pagina di dettaglio" ← "Scheda cliente", blur → the toolbar shows "Scheda cliente".
- **Review Focus 3** `"deleting the open layout opens another, or a new starter"`: two layouts, delete the open one → the other is on the canvas; delete it too → "Pagina di dettaglio" again, one layout listed.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor-page`
Expected: FAIL — no "Layouts" button.

- [ ] **Step 3: Implement the dialog, the toolbar button and the route**

- [ ] **Step 4: Run them to verify they pass**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor- && node ../../node_modules/typescript/bin/tsc --noEmit -p .`
Expected: PASS.

- [ ] **Step 5: Checkpoint**

---

### Task 4: Docs, full run, browser

**Files:**

- Modify: `apps/playground/CLAUDE.md` ("The canvas": the library, autosave, starters), the spec §19 (phase 6 **Done** with the date), `docs/handoff/2026-11-05.md` (a section, Italian), `docs/README.md` (this plan's row)

- [ ] **Step 1: Everything**

Run: `cd apps/playground && node ../../node_modules/jest/bin/jest.js __tests__/editor- && node ../../node_modules/typescript/bin/tsc --noEmit -p .`, then `npm test -w @its/glowup-playground -- --maxWorkers=2` from the root (no dev server running), ESLint and Prettier on the changed files.
Expected: all green.

- [ ] **Step 2: Browser** (`CI=1 node ../../node_modules/expo/bin/cli start --web --port 8099` from `apps/playground`; screenshots under `c:/dev/Glowup/.playwright-mcp`, deleted afterwards)

1440 × 900: edit, reload the page — the edit is there. Layouts: new from each starter (each draws, exports and previews), rename, open the first again, delete. Corrupt `localStorage["glowup.editor.library"]` by hand and reload — a starter opens, no console error.

- [ ] **Step 3: Checkpoint and handoff**
