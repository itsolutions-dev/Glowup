# Decisions

What has been decided and should not be re-proposed, and what is waiting for a yes or no. Written on
2026-10-23 from the handoffs of 15–23 October (the earlier ones were removed; the master plan keeps Q1–Q6
and D1–D17 in full). When a pending item is answered, move it up.

## Decided

**Scope and structure** (master plan, closed 2026-10-15)

- Web is the first target. `/dnd` is deferred. Expo SDK current and previous.
- Charts, pivot and PDF are three separate packages. CRM-specific components live in the CRM repo and link
  through npm. The composite components get a `composite-ui` subpath.

**Components**

- `decimalSeparator` is a prop of the app, never taken from the device language; default `"."`.
- `BottomSheet` takes `actions`, not `footer`, like `Dialog`.
- `CaptionValue` stays. There is no `FilterButton` (use `badge`); the hover "×" that clears filters is the app's.
- Not built for lack of evidence in the CRM: `multiple` and `uppercase` on `Autocomplete`, `overline` and
  `dividers` on `Dialog`, `BottomSheet` snap points, `DataGrid` percentage widths, row actions, group rows and
  `renderRow`.
- `Calendar`, `ClockPicker` and `ClockDial` are internal; the public ones are `DatePicker`, `TimePicker`,
  `DateTimePicker` with `variant="static"` for the inline surface.

**API migration** (rename batches 1 and 2, `.changeset/component-api-batch-*.md`)

- Each batch changes only the components it lists; the rest keep their old names until their own batch.
- `onClick`, `variant`, `color`, `onChange`, `multiple` are the vocabulary.
- `Typography` keeps the Material 3 names as aliases next to `h1`…`caption`.
- `Autocomplete.onSelect` is folded into `onSelectedChange`; `fullWidth` is `true` by default on `Input`,
  `Select`, `Autocomplete`.
- `IconButton.title` and `Avatar.name` use the library `Tooltip` (hover and focus on web, long press on
  native), not the browser `title`.
- `SideSheet` is `Drawer position="right"`; `TopAppBar` is `AppBar`; `Modal` is `Dialog`.

**Answered on 2026-10-23** (the first batch of questions)

- `Typography` without a `variant` is `body1`, not `h1`. Done; breaking, in `typography-default-body1.md`.
- `Select multiple` takes `value[]` and `onChange(values)`; `selectedValues` and `toggleOptions` are gone. Done
  (`select-multiple-value.md`). `Autocomplete` is not part of it: its `onChange` is the typed text and its
  picks go through `selected` / `onSelectedChange`, arrays when `multiple`.
- `ConfirmDialog` is fused into `AlertDialog` and removed (`alert-dialog-replaces-confirm-dialog.md`):
  `confirmText`/`onConfirm` are `actionText`/`onAction`, `dismissable` is `disableBackdropClick` and
  `disableEscapeKeyDown`, and `AlertDialog` gained `icon`.
- `Center` stays (a thin `Box` wrapper).
- A `ListItem` with `onClick` is pressable as a whole row; a press on its `action` never also presses the
  row (`list-item-pressable-row.md`).
- Kept as they are: the `Dialog` header close icon and the pickers' native-style dialog on mobile; the rounded
  square `Pagination`; the `Stat` trend colours (`success` up, `error` down).
- `density` stays a choice of the app, not set from the window width inside the library.
- No rename to Solaris UI for now.
- Hooks (`useInfiniteList`, `useActiveFilters`, where they live and how they are documented) are decided
  later, with a dedicated hooks section in the docs.

**Applied on the afternoon of 2026-10-23** (twelve changes the maintainer found by hand)

- `Table` and `DataGrid` stay two separate components; `DataGrid` takes `Table`'s props (`tableTitle`, `width`,
  `height`, `rowsPerPage` with a pager, `hover`, `selected`, `onClick`). `selected` is indices into `data` only.
- The date and time pickers take `showOkButton` (default `true`). Off: the time picker sets and closes after the
  minute, `datetime` after day, hour and minute, a range after its second end. Multiple selection and typed entry
  keep OK; `variant="static"` ignores it.
- `ListItem` has `variant`: `standard` (transparent, like the docs sidebar), `outlined`, `contained`. The default
  is `contained` (it is what the row looked like); the row now has a constant 1 px border, 2 px taller than before.
  `ListSection` takes `gap` and `showDividers`.
- `ToastProvider` takes `maxVisible` (default `1`): that many toasts show together, the rest queue.
- `Slider` takes `interaction` (`both` default, `drag`, `click`) and the keyboard.
- Hover, press and focus feedback never changes a control's box: a halo (`getFocusRing`) replaces the border that
  used to appear on hover.
- `Editable` keeps its width between display and edit mode, `fullWidth` fills the container in both.
- Docs site: component code is collapsed to the component's own lines with "Show full code"; the page has a sticky
  "On this page" list with the active section and a back-to-top button; the gallery cards show a large preview and
  two lines of description.

**Applied on 2026-10-26**

- `Input` is single-line; multi-line text is its own component, `InputArea`. `rows` is a fixed height with a
  scrollbar and wins over the rest; `minRows` / `maxRows` make it grow with its text (no `maxRows`: without limit;
  no `minRows`: from one line); nothing given is 4 fixed lines. `InputArea` has no prefix, suffix or uncontrolled mode.

**Documentation site** (playground)

- A component page is **one** example bound to its props: the Properties panel reads and writes a
  `const props` literal in the example's code. No separate stage, usage block or list of examples.
- The library's `PortalHost` is mounted at the site root, as the library asks of an app.
- Generated files (`docgen`, variants, templates, examples, inventory) are committed and never hand-edited.

## Waiting for a yes or no

| Question                                                                                                                                                                    | Default if nobody answers                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Rounded icon glyphs through a second icon set (Material Icons Rounded) via the palette's `iconSet`?                                                                         | Not started.                                            |
| `QrCode` uses fixed colours in the example rather than theme tokens (a light code on dark scans badly). Keep?                                                               | Keep.                                                   |
| `Autocomplete` follows `Select` (`value` and `onChange(selected)`, the typed text moving to `inputValue` and `onInputChange`)? It would break its current `onChange(text)`. | Leave as is.                                            |
| Rename batch 3 (the field family and feedback pieces still on `onPress`, `mode`, `onValueChange`, `multiSelect`): now, or later?                                            | Later, with the field contract in `library-roadmap.md`. |
