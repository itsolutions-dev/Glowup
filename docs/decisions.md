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

**Documentation site** (playground)

- A component page is **one** example bound to its props: the Properties panel reads and writes a
  `const props` literal in the example's code. No separate stage, usage block or list of examples.
- The library's `PortalHost` is mounted at the site root, as the library asks of an app.
- Generated files (`docgen`, variants, templates, examples, inventory) are committed and never hand-edited.

## Waiting for a yes or no

| Question                                                                                                                                                                                 | Default if nobody answers            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `Typography` default `variant`: keep `h1` (57 px) or `body1`?                                                                                                                            | Keep `h1` (no behaviour change).     |
| `Select multiple` and `Autocomplete multiple`: move both to `value[]` + `onChange(values)`?                                                                                              | Leave as is until rename batch 3.    |
| `AlertDialog` and `ConfirmDialog` overlap: keep both or fuse?                                                                                                                            | Keep both.                           |
| `Center` came back as a thin `Box` wrapper (it was removed on 22 Oct for `Box variant="centered-flex"`): keep?                                                                           | Keep.                                |
| `ListItem` with `onClick` and `action`: icon and texts are the button and the action sits beside them. Should the whole row be pressable?                                                | As is.                               |
| `Dialog`'s header close icon replaces the "Close" text button. Keep? And the pickers' dialog on mobile is the native centred card; should it get the Material Cancel and OK layout back? | As is.                               |
| `Pagination` default shape is a rounded square (`circular` is the old circle). Keep?                                                                                                     | Keep.                                |
| `Stat` trend defaults are `success` up and `error` down (were `primary`). Keep?                                                                                                          | Keep.                                |
| Set `density` automatically from the window width inside the library, or leave it to the app?                                                                                            | Leave it to the app.                 |
| Where do `useInfiniteList` and `useActiveFilters` live (library or CRM), and how are hooks documented (docgen covers components only)?                                                   | CRM; hooks documented in the README. |
| Rename the package to Solaris UI (names and paths are still Glowup)?                                                                                                                     | Not now.                             |
| Rounded icon glyphs through a second icon set (Material Icons Rounded) via the palette's `iconSet`?                                                                                      | Not started.                         |
| `QrCode` uses fixed colours in the example rather than theme tokens (a light code on dark scans badly). Keep?                                                                            | Keep.                                |
