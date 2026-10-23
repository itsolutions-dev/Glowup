# Glowup UI — what was done, 19 to 23 October 2026

A walk-through for a meeting. Sections 1 and 2 are the five-minute version; the rest is there to answer
questions. Numbers compare the tree with commit `14a148f`, the last one before the API migration began.

## 1. In one minute

- **The component API is migrated to a Material UI style** (`onClick`, `variant`, `color`, `onChange`,
  `multiple`) for 54 components (27 more are new), in two breaking batches, with the old names gone.
- **16 new components** are built, tested and documented: `Center`, `AbsoluteCenter`, `Break`, `Visible`,
  `ScrollArea`, `Clipboard`, `Download`, `Upload`, `Editable`, `PasswordField`, `CodeBlock`, `QrCode`, `Tree`,
  `AlertDialog`, `HoverCard`, plus a full **form engine** in `Form`.
- **The documentation site was rebuilt around one idea**: every component page is one realistic example
  whose code you can edit, with the Properties panel wired to that code. 100 pages, each with a description.
- **Tests grew**: library 717 to 1,472 tests, playground 948 to 1,280. Type-check, lint, build and
  package validation are green.
- **Four follow-up changes were applied the same afternoon** (section 7.1): `Typography` defaults to
  `body1`, `Select multiple` takes `value[]`, `ConfirmDialog` is fused into `AlertDialog`, and a `ListItem`
  with `onClick` is one pressable row.
- **What is not proven**: nothing built in this period has run on a real phone. The web is verified; iOS and
  Android are not.

## 2. Timeline

| Day    | Main work                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 19 Oct | Rename batch 1: actions, inputs, pickers, typography. Inline calendar and clock become `variant="static"`.                                  |
| 20 Oct | Date-picker fixes, `ViewportProvider` (phone and tablet previews on a desktop page), new Overview page, tooltip accessibility fix.          |
| 22 Oct | Rename batch 2: dialogs, navigation, lists, layout, `Table` rewritten. Examples with real data, the icons page, a review of all components. |
| 23 Oct | One example per page, descriptions, icon filters, 16 new components, form engine, docs rewritten, old docs removed.                         |

## 3. The library (`packages/ui`)

### 3.1 API migration: what changed and why

The old names were inconsistent (`onPress` on one control, `onClick` on the next; `mode`, `type`, `tone` for the
same idea). The target is the vocabulary developers already know from Material UI, so a new teammate can guess
the prop. Two batches landed, each with its own changeset listing every break:

| Batch      | Components                                                                                                                                         | Examples of the change                                                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 (19 Oct) | Button, IconButton, Chip, FAB, Card, Avatar, Typography, Input, Select, Switch, SearchBar, PinInput, Autocomplete, the date and time pickers       | `onPress` to `onClick`, `mode` to `variant`, `tone` to `color`, `onChangeText` to `onChange`, `multiSelect` to `multiple`; `Toggle` is `Switch`, `Spinner` is `NumberField`; `AnimatedFAB` folds into `FAB variant="animated"` |
| 2 (22 Oct) | Dialog, AppBar, NavBar, Drawer, Menu, BottomSheet, Snackbar, Accordion, Pagination, Stepper, Stat, CaptionValue, ListItem, Table, Box, Stack, Grid | `Modal` is `Dialog`, `TopAppBar` is `AppBar`, `NavigationBar` is `NavBar`; `Box` loses its shorthands for `padding`, `margin`, `background`, `variant`; `Table` is driven by `columns` and `data`                              |

Each batch also added props the components lacked: colour roles on buttons, chips and badges; a `filled`
field variant; `labelPlacement` and `fullWidth` on fields; dialog `width`, `height` and `form`; drawer
`position` and `variant`; tab `variant`; table paging, hover, selection and fixed header; progress labels.

New with the migration: `CheckboxGroup`, `Form`, `IFrame`, `Blink`, `ViewportProvider`.

**Not yet migrated** (still on the old vocabulary): the field family (`RadioButton`, `ToggleButton`,
`ButtonGroup`, `SplitButton`, `Checkbox`, `Slider`…) and some feedback pieces. That is "rename batch 3" in
the roadmap.

### 3.2 The 16 new components (23 Oct)

| Group    | Component                                                                   | What it does                                                                                        |
| -------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Layout   | `Center`                                                                    | A `Box` that centres its children; `direction="column"` for a column.                               |
|          | `AbsoluteCenter`                                                            | Lifts a child out of the flow and centres it in its parent, on one axis or both.                    |
|          | `Break`                                                                     | Negative margins that let a child run to the edge of a padded container.                            |
|          | `Visible` (+ `useBreakpointValue`)                                          | Shows content only above, below or at given window sizes, with a fallback.                          |
|          | `ScrollArea`                                                                | A scroll area whose bars are drawn from the theme, on web and native.                               |
| Actions  | `Clipboard` (+ `useClipboard`)                                              | A copy button, or your own trigger; `CaptionValue` copies through it too.                           |
|          | `Download` (+ `useDownload`)                                                | Saves a file from a string, an object (as JSON), a Blob or a URL.                                   |
| Inputs   | `PasswordField`                                                             | Show or hide, password-manager hints, optional strength meter.                                      |
|          | `Editable`                                                                  | Text that edits in place with the library's own fields (text, textarea, number, select).            |
|          | `Upload`                                                                    | Pick or drop files, validate type and size, show progress, retry and cancel.                        |
| Data     | `CodeBlock` (+ `HighlightedCode`)                                           | Syntax-coloured code with line numbers and a copy button.                                           |
|          | `QrCode`                                                                    | Any text as a QR code, from the library's own encoder (no QR dependency), with an optional logo.    |
|          | `Tree`                                                                      | An expandable hierarchy: selection or checkboxes, lazy loading, keyboard and screen-reader support. |
| Overlays | `AlertDialog` (also replaces the old `ConfirmDialog`, removed the same day) | A dialog that needs an answer: severity, one action, optional cancel, no way out but its buttons.   |
|          | `HoverCard`                                                                 | A card shown on hover or focus (web) or long press (native).                                        |
| Forms    | **Form engine** in `Form`                                                   | `FormField`, `useForm`, `useFormField`, `useWatch`, `useFormState`.                                 |

**The form engine in two sentences.** Values, errors and the dirty, touched and submitting flags live in a
store outside React state, and each field subscribes only to its own slice, so typing in one field of a
hundred re-renders that field alone (a test counts the renders). Rules (`required`, `min`, `max`, `pattern`,
`type`, sync or async `validator`), nested names such as `"address.city"` and `"items[0].qty"`, field
dependencies and `validateOn` come with it; a submit button shows its own loading state.

### 3.3 Bugs found and fixed along the way

Most were found by looking at the pages in a browser, not by the tests.

- Hovering a plain `IconButton` on web turned it into a solid disc with the glyph hidden (the state colour was
  mixed into the word `transparent`). Fixed at the root in `getStateColor`.
- `CircularProgress` made React warn about a `collapsable` attribute on web.
- `IconButton` and `Avatar` tooltips could hide the real button from a screen reader. `Tooltip` got
  `anchorAccessible`.
- The date popover showed a stray scroll bar (a rounding error in the measured height).
- `SearchBar` pushed its clear button out of a narrow sidebar (the input could not shrink).
- The Overview "Browse components" button did nothing after the rename (`Link` passes `onPress`, `Button` listens
  to `onClick`).
- An empty `cancelText` on `AlertDialog` drew a blank button; an empty `error` on `Upload` hid its rejection
  messages; `Tree` leaked React ids into native output.

## 4. The documentation site (`apps/playground`)

### 4.1 One example per component

Before: each page showed a stage, a usage snippet generated from the controls, and sometimes a list of
examples. Now: **one example**, written like an app would write it (a contact list, an invoice table, a
profile header), running on a stage with a 360, 720 or full width switch.

- Its **code is editable**, with a "Reset to default".
- The **Properties panel is bound to the code**: at the top of every example is a `const props` literal; moving
  a control rewrites that text, typing in the editor moves the control. A prop left out means "the component's
  default".
- Until you touch the text, the stage shows the real component (nothing is evaluated, the static export is
  unchanged); after the first change the text is compiled in the browser and later control changes redraw it
  **without losing its state** (a selected table row stays selected).
- 100 examples, each a real checked file (types, lint, formatting). A test renders each one, compares the
  compiled version with the real one, and checks that every control it uses is one the panel knows.

### 4.2 Everything else on the site

- **Descriptions**: one sentence under every component title, on the gallery card and in the search; a test
  fails if a component lacks one.
- **Icons page** (`/icons`): all 7,448 icons with their names, ranked search, Contained and Outlined filters,
  a dialog on click (sizes, code point, usage), copy and download as JSON. Every icon field in the Properties
  panel opens the same search.
- **Sidebar search** fixed (layout and clear button); the Overview button fixed.
- **Galleries**: 85 components with 440 states (an overlay opens from a trigger, never on load).
- **Overlays now escape the page**: the site mounts the library's `PortalHost`, so tooltips and hover cards are
  no longer cut off by the scroll area.
- **Prop tables** are generated from the library's TypeScript and now include props a component inherits from
  another of the library's own types (so `Stack`, `Center`, `PasswordField` show their full controls).
- **Gone**: the old stage, the snippet generator and the per-component demo file.

## 5. Quality and verification

| Check                                                              | Result                                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Type-check (4 workspaces plus design-sync), lint                   | Pass                                                                                                          |
| Library tests                                                      | 1,472 tests, 70 suites (was 717, 44)                                                                          |
| Playground tests                                                   | 1,280 tests, 12 suites (was 948, 8)                                                                           |
| Package build and validation (`publint`, types)                    | Pass for `@its/glowup-ui`                                                                                     |
| Generated files (props, galleries, templates, examples, inventory) | Regenerated, stable on a second run                                                                           |
| Seen in a browser (web)                                            | Icons page and filters, gallery, sidebar search, Stack, Tree, QrCode, AlertDialog, HoverCard, Tooltip, Portal |
| Size of the change                                                 | Library: 185 files, +37,262 / −4,561. Playground: 303 files, +26,549 / −13,715.                               |

Test suites that render many pages can time out when run in parallel on a slow machine; they pass with
`--maxWorkers=2`.

## 6. Documentation and housekeeping

- **Docs pruned and organised.** Nine finished documents were removed (the library-split and npm-publishing
  plans, the NativeBase comparison, the four Phase 0 spikes, the two oldest handoffs); the master plan keeps
  each spike's outcome and points to git for the rest. `docs/README.md` is now the index.
- **New**: `docs/decisions.md` (decided versus waiting), `docs/library-roadmap.md` (the plan in section 8),
  this report.
- **Rewritten for the new components**: the library README and specification (`components.md`), the component
  inventory (115 components, 27 added, 53 updated), the per-package `CLAUDE.md` rules.
- **Changesets** for every library change: `component-api-batch-1`, `-2` and `new-components-batch-3`.

## 7. Decisions

### 7.1 Settled on 23 October and already applied

The questions raised by this report's first draft were answered the same day and the changes are in the tree:

| Question                                                                     | Answer                                                            | What changed                                                                                                                         |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Typography` default variant                                                 | `body1`                                                           | A bare `<Typography>` is body text, not 57 px. Breaking.                                                                             |
| `Select multiple`: one value shape                                           | `value[]` and `onChange(values)`                                  | `selectedValues` and `toggleOptions` are gone. `Autocomplete` keeps its own picks API on purpose (its `onChange` is the typed text). |
| `AlertDialog` and `ConfirmDialog`                                            | Fuse into `AlertDialog`                                           | `ConfirmDialog` is removed; `confirmText`/`onConfirm` are `actionText`/`onAction`; `AlertDialog` gained `icon`.                      |
| `ListItem` with `onClick` and `action`                                       | The whole row is pressable; the action never also presses the row | One pressable row; the action's click is stopped on web.                                                                             |
| `Center`, `Dialog` close icon, `Pagination` shape, `Stat` colours, `density` | Keep as they are                                                  | Nothing.                                                                                                                             |
| Rename to Solaris UI                                                         | Not now                                                           | Nothing.                                                                                                                             |
| Hooks (`useInfiniteList`, `useActiveFilters`)                                | Later, with a hooks section in the docs                           | Nothing yet.                                                                                                                         |

### 7.2 Still to take

| #   | Question                                                                                              | Why it matters                                          | Default                         |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------- |
| 1   | Do rename batch 3 now (field family, feedback), or leave the mixed vocabulary?                        | Breaking; cheaper before more apps adopt today's names. | Do it, with the field contract. |
| 2   | Truly rounded icons: add a second icon set (Material Icons Rounded)?                                  | Only tiles are rounder today; glyphs are not.           | Not started.                    |
| 3   | Should `Autocomplete` follow `Select` (`value` and `onChange(selected)`, typed text as `inputValue`)? | Consistent vocabulary, but breaks `onChange(text)`.     | Leave as is.                    |
| 4   | Who verifies on a phone, and when?                                                                    | Nothing from 10-23 has run natively.                    | Add to `/native-check`.         |

The full list is in `docs/decisions.md`.

## 8. Risks and what is not verified

- **Native.** The 16 new components, the example runner (it uses `new Function`, which a native engine may not
  provide) and the pickers are untested on iOS and Android. If the runner is missing there, the editor reports
  it and the stage keeps showing the real component.
- **Reading, not running.** The 40-odd defects in the roadmap were found by reading the code; the two that
  depend on `react-native-web` internals are marked. None is a regression from this work.
- **Two plans in one repo.** `solaris-native.md` (charts, PDF, pivot, CRM pilots) and the API migration run in
  parallel; the migration is ahead of Phase 3 as written and the matrix `crm-component-matrix.md` still cites
  old names.
- **Unreleased and breaking.** Both rename batches and the new components are in changesets but unpublished;
  the library version will move by a minor with notable breaks.

## 9. What comes next

From `docs/library-roadmap.md`, in this order:

1. **A hardening pass** on 11 high-impact defects (double Escape close, toast context and toasts under dialogs,
   keyboard and screen-reader gaps on `Slider`, `Pagination` and web ARIA state, `NumberField` truncation).
2. **Rename batch 3** with a single contract for fields (`testID`, `name`, `onBlur`, `error`, `FormControl`).
3. **`useConfirm`** and a **theme mode** (light, dark, system).
4. **Table and DataGrid converge** into one data component.
5. **App shell**, link-capable navigation items, a better toast layer and a motion layer.

## 10. Where to find things

| Need                                       | Look in                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| The index of all docs                      | `docs/README.md`                                                            |
| What changed in the API                    | `.changeset/component-api-batch-1.md`, `-2.md`, `new-components-batch-3.md` |
| A component's props and behaviour          | `packages/ui/src/components/components.md`; the live page on the docs site  |
| Every component and prop, added or changed | `docs/component-inventory.md`                                               |
| Day-by-day detail and verification         | `docs/handoff/2026-10-19.md` to `2026-10-23.md`                             |
| How the docs site works                    | `apps/playground/CLAUDE.md`                                                 |
| Decisions and open questions               | `docs/decisions.md`                                                         |
| What the library still needs               | `docs/library-roadmap.md`                                                   |
