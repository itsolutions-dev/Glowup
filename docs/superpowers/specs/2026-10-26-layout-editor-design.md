# Layout editor — design

Status: **decisions taken, to review** (2026-10-26). The four open questions were answered the same day
(§16); everything marked _(my call)_ is a default the builder may revisit. Builds on the drag and drop
system that landed that day (`packages/ui/src/components/DragDrop.tsx`, the `/drag-and-drop` page).

## 1. Purpose

A page of the documentation site with a **canvas**: pick the library's components from a palette, drop
them on the canvas, move and resize them on a grid, nest them in the components that hold others (which
have a grid of their own), edit each one through its props, and take the result away as **code** and as
**JSON**.

The interaction is the one of the CRM's "Modifica layout" screen (screenshot of 2026-10-26): a grid of
cells is drawn while something moves, the item shows where it will land, the selected item has resize
handles on its edges and corners and a delete button.

It is a **tool of the documentation site** (§16 Q1): design a screen, copy its code. Apps do not embed it.

Why now: the component set is complete enough to compose real screens, the drag and drop core exists, and
the templates section has so far been hand-written files only.

## 2. What the reader sees

On a desktop browser:

```
┌ Toolbar ── name · undo redo · Desktop|Tablet|Phone · grid on/off · Preview · Export · Save ┐
├ Left panel ─────┬ Canvas ─────────────────────────────────────────────┬ Properties ─────────┤
│ [Add] [Layers]  │  ┌─ Paper ───────────────┐        ┌─ Card ─────────┐ │ Paper · n1          │
│ search…         │  │ Typography  Typography│        │ Input          │ │ ─ Props ─ (registry)│
│ Layout          │  │ Typography  Typography│        │ Select         │ │ elevation  [ 1 ]    │
│  Box Paper Card │  └───────────────────────┘        └────────────────┘ │ ─ Layout ─          │
│ Inputs          │   ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░  ← cells, while     │ x 0  y 0  w 6  h 4  │
│  Input Select … │   ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░    something moves  │                     │
└─────────────────┴──────────────────────────────────────────────────────┴─────────────────────┘
```

- **Add**: drag a component from the palette onto the canvas, or into a container on the canvas. A tap on
  a palette item adds it at the first free place of the selected container, or of the page (the keyboard
  way, and the way on a phone held upright).
- **Move**: drag an item. While it moves: the cells of the grid it is over are drawn, a copy of the item
  follows the pointer, and the cells it would occupy are highlighted. Items it would overlap are pushed
  down; nothing else moves, so gaps stay where you leave them. Release drops it there.
- **Resize**: select an item; handles appear on its four edges (diamonds) and corners (squares). Dragging
  one snaps the size to whole cells, pushing down what it would overlap.
- **Nest**: drop into a container (Paper, Card, Box…) and the item lands on **that container's grid**, at
  the cell under it. A container grows to hold what is put in it. Stacks and lists (VStack, ListSection…)
  take items in order instead, at the insertion line. Inputs, selects, buttons and other leaves take
  nothing; a container that only holds certain children (`ListSection` holds `ListItem`s) refuses the rest.
- **Edit**: select an item; the right panel shows its props with the same controls as the component pages,
  its text, and its position.
- **Export**: a panel with the generated `.tsx` (copy, download), a **Preview** that runs that exact code,
  and the JSON (copy, download, import).

## 3. Goals

- A canvas on a 12-column grid with drag to move, handles to resize, a drawn grid and a landing preview,
  by mouse and by touch; free placement with gaps, never overlaps.
- Containers with a grid of their own, nested to any depth; stack-like containers that keep an order.
- Every catalogued component available in the palette, edited through its real props.
- Undo and redo; autosave; named layouts; JSON import and export.
- Code export that compiles and renders the same screen as the canvas, proved by running it on the page.
- One layout per screen, which stacks into a single column on phones.

## 4. Non-goals (not in this project)

- Several arrangements per device size (§16 Q2: one layout).
- Embedding the editor in an app, or rendering saved JSON at run time in an app (§16 Q1: a docs tool).
  The JSON stays plain data, so neither is ruled out later.
- Turning the existing templates (`apps/playground/templates/*.tsx`) into editable layouts: they are code
  with state, validation and loops, not a tree of props. Starters are new JSON files instead (§12).
- Logic: event handlers, validation, data fetching, navigation. The export leaves them to the developer.
- Inline text editing on the canvas, copy/paste between layouts, multi-select, alignment guides.
- Overlays (Dialog, BottomSheet, Drawer, Menu, Popover, Snackbar, Toast) in the palette: they open over
  the page and have no place on a grid.

## 5. Anti-goals (a failure even if it "works")

- Exported code that does not compile, or renders something other than the canvas.
- An editor that only works with a mouse, or only on a large screen when a tablet would do.
- Hand-written prop forms per component next to the registry: the panel must read the same registry and
  generated prop tables as the component pages, so a new prop appears in both or in neither.
- Editor-only copies of components: the canvas renders the real library components.
- New dependencies for drag, resize, grid or code formatting.

## 6. Where it lives

- **Library** (`packages/ui`), because exported code needs them:
  - the drag and drop extensions of §9;
  - a new `GridLayout` component (§10) that places children on a grid from layout data.
- **Documentation site** (`apps/playground`): the editor, at **`/templates/editor`** _(my call: the
  templates section is where it was first asked for)_, linked from the templates gallery ("New layout") and
  from each starter. Code in `apps/playground/editor/`: `document.ts` (types, operations), `manifest.ts`
  (§8), `engine.ts` (grid maths, §11.3), `history.ts`, `exportCode.ts`, `Canvas.tsx`, `Palette.tsx`,
  `Properties.tsx`, `Layers.tsx`, `Toolbar.tsx`, `starters/*.json`; the route is `app/templates/editor.tsx`.

## 7. The document (JSON)

```jsonc
{
  "format": "glowup-layout",
  "version": 1,
  "name": "Pagina di dettaglio",
  "grid": { "columns": 12, "rowHeight": 48, "gap": 16 },
  "items": [
    {
      "id": "n1",
      "type": "Paper",
      "props": { "elevation": 1 },
      "layout": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "children": [
        {
          "id": "n2",
          "type": "Typography",
          "props": { "variant": "labelMedium" },
          "text": "Codice fiscale",
          "layout": { "x": 0, "y": 0, "w": 6, "h": 1 },
        },
        {
          "id": "n3",
          "type": "Typography",
          "props": { "variant": "titleMedium" },
          "text": "STPTNY29E07D744U",
          "layout": { "x": 0, "y": 1, "w": 6, "h": 1 },
        },
      ],
    },
    {
      "id": "n4",
      "type": "VStack",
      "props": { "spacing": "s" },
      "layout": { "x": 8, "y": 0, "w": 4, "h": 3 },
      "children": [
        { "id": "n5", "type": "Input", "props": { "label": "Email" } },
        {
          "id": "n6",
          "type": "Button",
          "props": { "variant": "filled" },
          "text": "Save",
        },
      ],
    },
  ],
}
```

- `items` is the page's grid. Every node placed on a grid — the page's or a grid container's — has `layout`
  in that grid's units: `x` and `w` in columns, `y` and `h` in rows.
- The children of a **flow** container (§8) have no `layout`: their order is their place.
- Gaps are allowed: nothing requires an item to touch the one above (`n4` starts at column 8).
- `props` hold plain data only (strings, numbers, booleans, arrays and objects of those); `text` is the
  content of a component whose children are a label (Typography, Button…).
- `id`s are unique in the document, short and stable (`n` + counter); they become `key`s in the code.
- `format` + `version` let an import refuse what it does not know and migrate older versions.
- Grid defaults _(my call)_: 12 columns, row 48 dp, gap 16 dp — close to the screenshot's cells and on the
  spacing tokens. Every grid in a document, nested ones included, uses the same row height and gap, so rows
  line up across containers.

## 8. The component manifest

What the editor needs to know about a component beyond its props. One entry per palette component, in
`editor/manifest.ts`, pinned by a test against the catalogue registry and the generated prop tables (an
entry for a component that is not catalogued, or a catalogued component without an entry and without a
reason, fails).

| Field          | Meaning                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `kind`         | `grid` (a container with its own grid), `flow` (a container that keeps an order), `text` (children are a label), `leaf` |
| `accepts`      | for a container: which types it takes (`["ListItem"]`); default every non-overlay type                                  |
| `direction`    | for a flow container: `column` (default) or `row` (HStack, CardActions, Toolbar)                                        |
| `defaultProps` | what a new instance starts with, so it renders something (a Select's options, a Stat's value)                           |
| `defaultSize`  | `w`, `h` when placed on a grid (Input 4×2, Button 3×1, Paper 6×4, DataGrid 12×6)                                        |
| `minSize`      | the smallest `w`, `h` a resize may reach                                                                                |
| `controlled`   | the value/change pair the export turns into state (`{ value: "value", onChange: "onChangeText", initial: "" }`)         |
| `palette`      | group and icon (the catalogue's categories and their icons)                                                             |

First classification _(my call, to refine with the manifest test)_:

- **grid** containers — surfaces, whose content you arrange freely: Box, Paper, Card, CardContent,
  ScrollArea, Collapse, TabContent, Accordion (its content).
- **flow** containers — components whose job is an order, so a grid inside would contradict their own
  props (`spacing`, `direction`): Stack, VStack, HStack, CardActions, Toolbar, ListSection, FormControl.
  _(My call within §16 Q3: the answer was "a grid inside containers", and these are the exception; making
  them grids too means dropping their spacing props from the palette's meaning.)_
- **text**: Typography, Button, Link, HelperText, ListSubheader, ProgressButton, SplitButton, Divider (label).
- **leaf**: Input, InputArea, PasswordField, NumberField, Select, Autocomplete, Checkbox, Switch, Slider,
  RadioGroup, CheckboxGroup, Chip, ChipGroup, Avatar, Badge, StatusBadge, Icon, IconButton, FAB, Image,
  Stat, CaptionValue, ListItem, DataGrid, Tree, Tabs, Stepper, Pagination, Breadcrumbs, Rating,
  DatePicker, TimePicker, DateTimePicker, Skeleton, progress indicators, QrCode, CodeBlock, EmptyState,
  Banner, Upload, Spacer.
- **left out**: overlays (§4), providers, `Portal`, `Visible`, `Center` (centres one child, meaningless on a
  grid), `Grid` (the library's responsive grid; `GridLayout` does this job here), `Draggable`/`Droppable`.

Classification cannot come from the prop types alone: `Button` and `Typography` take `ReactNode` children
like `Paper` does (checked against `docgen/props.generated.json`).

## 9. Drag and drop: what the core needs

The system built today reports _which zone_ and _which index_. A grid also needs _where_. Changes to
`packages/ui/src/components/DragDrop.tsx`, each with tests in `drag-drop.test.tsx`:

1. **The dragged item's position in the zone.** `over` gains `rect`: where the item's preview is, relative
   to the zone's top-left (pointer position minus the grab offset), plus the zone's size. A grid snaps that
   rect's corner to a cell. Today the pointer is known but not exposed.
2. **A selector hook over the drag state**, `useDragState(selector)`: re-renders its caller only when the
   selected value changes. A grid selects its target cell, so a move re-renders it once per cell crossed,
   not once per pixel. (The store already exists; this exports it.)
3. **Re-measuring during a drag.** Zones and items are measured once, when the drag begins. On the canvas
   things move while you drag (pushed items, a container growing), so a zone you aim at may have moved: a
   zone or item whose `onLayout` fires during a drag must be measured again.
4. **Auto-scroll.** A canvas taller than the window must scroll when the pointer nears its top or bottom
   edge: the provider takes the scroll view's ref (`scrollRef`) and scrolls it, re-measuring as it goes.
5. **Palette items** dropped as new nodes (`data: { kind: "new", type }`) already work; listed to keep the
   case in the tests.

Resizing is not drag and drop (nothing is dropped anywhere): it is a pan on a handle, done with the
responder system in the editor (`ResizeHandle`), sharing the grid maths of §11.3.

## 10. `GridLayout` (library)

```tsx
<GridLayout
  columns={12}
  rowHeight={48}
  gap={16}
  layout={[{ id: "n1", x: 0, y: 0, w: 6, h: 4 }, …]}
  stackBelow="medium"
>
  <Paper key="n1">
    <GridLayout layout={[{ id: "n2", x: 0, y: 0, w: 6, h: 1 }, …]}>
      <Typography key="n2">Codice fiscale</Typography>
    </GridLayout>
  </Paper>
</GridLayout>
```

- Measures its own width (`onLayout`, never the window: it must reflow on the stage's 360 / 720 widths and
  prerender at width 0 like the templates), derives the column width, and places each child absolutely at
  its cell, gaps included. Its own height is the bottom of the lowest item.
- Nests: a `GridLayout` inside a container lays out on the container's content width with the same row
  height and gap.
- Below `stackBelow` (a window size class, `medium` default, read with the library's `useBreakpoint`), the
  children stack full width in reading order (`y`, then `x`), each at its own height, separated by the gap;
  empty rows between items collapse. Nested grids stack the same way.
- The editor renders the canvas with it, and the exported code uses it: what you see is the component that
  ships.
- Its own catalogue page, example and gallery, like every component.

## 11. The canvas

### 11.1 Rendering

The document is rendered with the real components, **inert**: the canvas content has
`pointerEvents="none"`, so a Button does not press, an Input does not focus, a Card does not ripple.

Over it lies an **edit layer** of transparent boxes, one per node, at the node's measured rect, nested like
the document (a child's box inside its container's box). The boxes do the editing:

- every box is a `Draggable` (id = node id, `data: { kind: "node", type }`, `preview` = the node rendered);
- a grid container's box, and the page itself, is a `Droppable` with `data: { kind: "grid" }` that places by
  position (§9.1); a flow container's box is a `Droppable` that places by index; both apply the manifest's
  `accepts`.

Why a separate layer: rendering the components as drag handles directly fails on the ones that are pressable
(Card, ListItem with `onClick`, Chip) or own their touches (Input, Slider, ScrollArea), and on containers,
whose children must stay grabbable while their own surface does not react. The layer's rects come from each
node wrapper's `onLayout`, converted to canvas coordinates.

### 11.2 Selection

- A tap or click on a box selects that node (the innermost under the pointer); on empty canvas it clears.
- The selected node: a 2 dp primary outline, its type as a small label above the top-left corner, a delete
  and a duplicate button above the top-right corner; on a node placed on a grid, the resize handles (§11.4).
- Hover outline (web): 1 dp `outlineVariant`.
- The Layers panel (§13) selects nodes that are hard to reach on the canvas.

### 11.3 Moving on a grid

While a node, or a palette item, is dragged over a grid (the page's or a container's — the innermost that
accepts it, as the drag and drop core already decides):

1. **That grid's cells** are drawn under its items: every empty cell as a rounded rectangle
   (`surfaceContainerHigh`, `shape.small`); on the page, the rows extend four below the lowest item, so
   there is room to drop below. Other grids stay quiet.
2. The target cell is the preview rect's top-left corner snapped to the nearest column and row, clamped so
   the item stays inside the columns (and its `w` is cut to the grid's columns when it is wider).
3. The **landing preview**: the target cells, tinted `primaryContainer` with a 2 dp dashed `primary` border,
   with the item's own content dimmed inside (the dragged original is drawn there).
4. **Collisions push down, nothing else moves** (§16 Q3: leave gaps). An item the target would overlap moves
   down just below it, keeping its column; whatever that one now overlaps moves the same way, and so on.
   Nothing moves up to fill a hole.
5. A **container grows** to hold its grid: when a child lands or is resized below the container's last row,
   the container's `h` increases to fit, which may push down items under the container in its own grid, up
   to the page.
6. Release: the layout with the item at the target becomes the document (one undo step). Escape or a
   cancelled gesture restores the layout from before the drag.

The maths is pure (`engine.ts`): `snap`, `collides`, `pushDown`, `fitContainer`, `resize`, `clampToGrid`,
`firstFreeCell` (for a tap-to-add), each tested on its own.

### 11.4 Resizing

Handles on a selected node that sits on a grid, as in the screenshot: diamonds on the middle of each edge,
squares on the corners. Each moves the edges it sits on; the size snaps to whole cells and never goes under
the manifest's `minSize` nor, for a grid container, under what its children need. Pushing down and growing
apply live as in §11.3. Touch targets are at least 24 dp (`hitSlop`), the visible handle 12 dp.

### 11.5 Containers

- A **grid** container's content box (inside its padding) is a grid of the document's 12 columns: a child's
  `x`/`w` are in those columns, so shrinking the container keeps the children's proportions. The container
  grows to fit its children (§11.3.5) and cannot be resized smaller than they need.
- A **flow** container keeps its children in order in its `direction`; dropping into it shows the drag and
  drop system's insertion line and inserts at that index.
- Moving a node from one grid to another keeps its `w`/`h` (cut to the columns); moving it into a flow
  container drops its `layout`; moving it out of a flow container onto a grid gives it its `defaultSize`.
- A container never takes its own ancestor (the drag and drop core already refuses a zone inside the
  dragged item) nor a type outside its `accepts`.
- An empty container shows a dashed placeholder ("Drop components here") on the canvas only.

### 11.6 Delete and duplicate

Delete removes the node and its children (the space it took stays empty). Duplicate copies the subtree with
new ids: on a grid, at the first free cell below the original; in a flow container, right after it.

## 12. Starters

New layouts start blank or from a **starter**: a JSON file in `editor/starters/`, opened like a saved
layout. First three _(my call)_: "Pagina di dettaglio" (the screenshot's shape: data cards, a tabbed panel,
an action card), a form in sections, a dashboard with stats and a table. Each starter is a test case for the
export (§15).

## 13. Panels

**Properties** (right):

- Header: type, id, delete, duplicate.
- **Content**: the `text` of a text component.
- **Props**: the existing `PropControls` with the component's registry entry — the same controls, defaults
  and `appliesWhen` rules as the component pages. A prop left at its default is not stored.
- **Data**: array and object props that the registry does not cover (a Select's `options`, Tabs' `tabs`,
  DataGrid's `columns` and `rows`): a list editor for label/value lists, a JSON field (`InputArea`,
  validated) for the rest.
- **Layout**: `x`, `y`, `w`, `h` for a node on a grid (number fields, same rules as dragging); for a flow
  container, its direction and spacing.
- Props that take nodes or functions are listed as "set in code" and are not editable.

**Layers** (left panel, second tab): the document as a library `Tree` (type + first words of its text);
selecting a row selects the node; "Move into…" picks a container from a list (the node lands at its first
free cell, or at the end of a flow container) — the way to restructure without dragging.

**Palette** (left panel, first tab): the manifest grouped by the catalogue's categories, with search; each
entry is a `Draggable` whose preview is the component at its default size.

## 14. History, keyboard, persistence

- **Undo / redo**: a stack of documents (100 steps). A drag, a resize, an add, a delete are one step each;
  typing in a field is one step per field focus.
- **Keyboard** (web): Delete/Backspace, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+D duplicate, arrows move the
  selected node one cell on its grid, Shift+arrows resize it, Escape deselects or cancels a drag. Listed in
  the site's shortcuts dialog like the others.
- **Autosave** of the open layout with `usePersistentState` (AsyncStorage: localStorage on the web, the
  device's storage on native), debounced; a list of saved layouts (open, rename, delete) in the toolbar.
- **JSON**: download (library `Download` on the web, `expo-sharing` on native, already a dependency) and
  import (library `Upload` on the web; on native, paste into a field). Import validates `format`,
  `version`, types against the manifest, props against the registry and layouts against their grids (inside
  the columns, no overlaps), and reports what it dropped or moved.
- The editor renders after hydration only (`useHydrated`): its state comes from storage, which the
  prerendered HTML cannot know.

## 15. Code export

- A `.tsx` file: imports from `react` and `@its/glowup-ui` (only what is used), a default-exported component
  named after the layout, one layout constant per grid (`LAYOUT`, `N1_LAYOUT`…), `GridLayout` for the page
  and inside each grid container, children with `key`, flow containers with their children in order.
- Props equal to the component's default are left out; strings in quotes, other values in braces; objects
  and arrays printed as literals.
- **Controlled components** (manifest `controlled`): a `useState` per instance, named from its label
  (`const [email, setEmail] = useState("")`), wired to the value and change props, so the export runs as is.
- Handlers are not invented: a header comment lists what is left to wire ("Button 'Save': onClick").
- Formatting: 2 spaces, double quotes, trailing commas, the shape the examples use; no Prettier at run time.
- **Preview** compiles the exported text with the site's `compileExample` (sucrase + `new Function`) and
  renders it at the chosen width, beside the canvas or instead of it: a mismatch is visible at once. On a
  native engine without `new Function` the preview says so (as the component pages do).
- Copy (library `Clipboard`) and download.

## 16. Decisions taken (2026-10-26)

1. **A docs tool**, not something apps embed. It lives in the playground; the library gets only what
   exported code needs (`GridLayout`, the drag and drop extensions).
2. **One layout** for every size, stacking into one column on phones.
3. **Leave gaps, and a grid inside containers.** Free placement on every grid; collisions push down,
   nothing compacts. Surfaces (Paper, Card, Box…) have their own grid; stacks and lists keep an order
   (§8, my call within this answer).
4. **Phone: as much as is practical** — decided in §17.

## 17. Responsive editor

How much editing a width allows _(my call, §16 Q4)_. The limit is the cell: at 12 columns with 16 dp gaps, a
360 dp canvas leaves about 13 dp per column, too small to aim at and smaller than a 24 dp handle. Moving and
resizing need a canvas of at least 600 dp (about 30 dp per column), which tablets and **phones held
sideways** have.

- **≥ expanded (840 dp)**: three columns, palette/layers 280 dp, canvas, properties 320 dp; toolbar on top.
  Everything works.
- **medium (600–839 dp)** — tablets, phones held sideways: canvas full width; palette, layers and properties
  open one at a time as a side sheet; a drag that starts in the sheet closes it so the canvas is reachable.
  Everything works, by touch (long press to lift).
- **compact (< 600 dp)** — phones held upright: the canvas shows the phone arrangement (stacked, as the
  exported screen will look there), and editing is everything that does not need aiming at a cell: tap to
  select, properties in a bottom sheet, add from a bottom-sheet palette (to the selected container or the
  page, at the first free cell), delete, duplicate, "Move into…" from Layers, undo and redo. A banner says
  "Turn the phone sideways to move and resize". No drag and no handles on the grid.
- A **Desktop / Tablet / Phone** switch sets the canvas width (full, 720, 360) whatever the window, like the
  component pages' stage; at Phone the canvas shows the stacked arrangement and follows the compact rules.
- On native, the canvas's `ScrollView` takes `scrollEnabled={!active}`; drags start with a long press, as
  everywhere in the drag and drop system.

## 18. Performance budget

- 150 nodes on the canvas without a dropped frame on a desktop browser, and usable on a mid-range Android.
- A drag move re-renders only the grid under the pointer, and only when its target cell changes; node
  renderers are memoised by id and props; the edit layer's rects live in one store, not in each node's state.
- Measured with React DevTools' profiler on the web before phase 3 is called done.

## 19. Phases

Each phase ends with its tests green, a browser check and a handoff entry.

| #   | Phase                                                                         | Size | Ends with                                                                  |
| --- | ----------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------- |
| 0   | Drag and drop extensions (§9)                                                 | M    | library tests; `/drag-and-drop` demo of position and auto-scroll           |
| 1   | `GridLayout` (§10), nested and stacking                                       | M    | library tests (placement, gaps, nesting, stacking, prerender at 0); page   |
| 2   | Document, manifest, engine, history (pure)                                    | M    | unit tests of every operation and grid function; manifest test             |
| 3   | Canvas: render, edit layer, select, move with landing preview, resize, nested | L    | page tests; desktop mouse and phone-sideways touch in the browser          |
| 4   | Palette, flow containers, moving between grids and containers                 | M    | page tests; browser                                                        |
| 5   | Properties and Layers panels                                                  | M    | page tests (edit a prop, see the canvas change, undo it)                   |
| 6   | Persistence, JSON import/export, starters                                     | S    | import validation tests; the three starters open                           |
| 7   | Code export and preview                                                       | M    | every starter exports, compiles and renders the same tree as the canvas    |
| 8   | Responsive editor (§17), keyboard, iOS and Android pass                       | M    | browser at 1440 / 720 / 360; manual run on an iPhone and an Android device |

Phases 0 and 1 are library work with changesets; 2–8 are the playground.

## 20. Testing

- **Pure** (jest): the grid engine (snap, push down chains, container growth up to the page, clamping,
  first free cell); document operations with their invariants (unique ids, no cycles, no container holding
  a type outside its `accepts`, every grid node inside its columns, no overlaps on any grid, every grid
  container tall enough for its children); history; JSON import and migration; the code generator on golden
  files.
- **Fidelity**: for each starter, export → `compileExample` → render, compared with the canvas's render of
  the same document (the method of `examples.test.tsx`).
- **Library**: drag and drop extensions in `drag-drop.test.tsx` (position, selector, re-measure,
  auto-scroll); `GridLayout` placement, gaps, nesting and stacking.
- **Page** (RNTL): drag from the palette onto the page and into a grid and a flow container with the
  responder helpers of `drag-drop.test.tsx`; select, edit, delete, undo; the compact-width rules.
- **Browser** (Playwright, as on 2026-10-26): desktop mouse, touch at 720 dp, the upright-phone mode at 390.
- **Native**: a manual checklist on an iPhone and an Android device, upright and sideways (add, move,
  resize, nest, scroll while dragging); none of it can run in CI today.

## 21. Risks

| Risk                                                                            | Mitigation                                                                                              |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| The edit layer drifts from the rendered nodes (nested grids, text reflow)       | Rects from each wrapper's `onLayout`, recomputed on every layout change; a test with three nested grids |
| A push-down or a growing container cascades through several grids during a drag | Pure engine with tests on chains; the drag re-measures (§9.3); target only recomputed per cell          |
| Native scroll views take the touch during a drag                                | `scrollEnabled={!active}` on the canvas; checked on devices in phase 8                                  |
| Export fidelity: controlled inputs, required data props                         | Manifest `controlled` and `defaultProps`; the fidelity test on every starter                            |
| A component the manifest misclassifies (a container marked leaf, grid vs flow)  | The manifest test lists every catalogued component; reviewed once by hand                               |
| Scope growth: per-size layouts, inline editing, run-time rendering              | Listed as non-goals; each one a separate project                                                        |
| Low-end Android performance                                                     | Budget in §18; memoised renderers; one store for rects                                                  |

## 22. Left to the builder

Exact visuals of handles, labels and placeholders (from the tokens, through the Glowup skill's gates); file
names inside `editor/`; history depth and debounce times; whether pushed items glide to their new places
(`LayoutAnimation` on native, a CSS transition on the web) or jump; the wording of the empty states and of
the "turn sideways" banner.
