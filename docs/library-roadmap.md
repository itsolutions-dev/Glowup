# What the library still needs

A short, ordered plan of fixes and gaps for `@its/glowup-ui`, as of 2026-10-23 (HEAD `cbdefc5`).

**How it was made.** The 22 October review of all 85 components (three read-only reports) was re-checked
on 23 October against the current source, after the two rename batches and the 16 new components. Every bug
below was read in the code at the place cited; **none was run**, and the ones that depend on a device or on
`react-native-web` internals say so. Items the review raised that have since been built (upload, tree view,
inline edit, clipboard, code block, password reveal, form validation, `Visible`, dialog roles) are not listed.
Paths are relative to `packages/ui/src`. Effort: **S** under a day, **M** a few days, **L** a week or more.

Sections 1 and 2 were fixed on 30 October (below); what is left is the API work of section 3, the builds of
section 4 and the open points of section 5.

**Fixed on the afternoon of 23 October** (items from the first draft of this plan, found again by hand): hover
and focus feedback on `Button` and its siblings no longer changes the box (it shifted the page); `Tabs` no
longer re-springs on hover; `Slider` drags, clicks and takes the keyboard (`interaction` prop); `Switch` thumb
stays inside its track; the date and time popover no longer shows a scrollbar when hovering OK; `useToast()`
keeps one identity and `ToastProvider` takes `maxVisible`; a `DataGrid` keeps a column reorder when
`columns` is a new array.

**Fixed on 28 October** (each reproduced in a failing test first; the web ones also in Chromium, changeset
`app-blocking-fixes.md`): Escape closing every stacked dialog and calling `onClose` twice (#1); the picker
portal during a static render (#11); `NumberField`'s hidden 0..100 range and integer-only input (#7); `Select`'s
tick for falsy values, `PinInput` completing with blanks, `ProgressButton type`, Enter submitting a disabled form;
`Table` rows keyed by index; `Alert()` lost before the provider, overwritten by a second one, and Escape skipping
the cancel button.

## 1 and 2. Fixed on 30 October

Every item of the two lists below was reproduced in a failing test first (jsdom or headless Chrome for the web
ones, the local Android emulator with TalkBack for the native ones) and fixed; commits `28f3855`, `2d20efa`,
`07c26cf`, `513d86a`, `70ee95d`, changesets `accessibility-and-keyboard-fixes`, `web-aria-state-and-card-actions`,
`second-tier-fixes`, `toasts-above-overlays`, `data-grid-row-memo`.

- **Section 1:** toasts above an open `Dialog`, `BottomSheet` or side sheet (#3, the topmost overlay draws them in
  its own window); the current `Pagination` page focusable, `aria-current`, a `navigation` landmark (#4); every
  control's state reaches the DOM through one helper, `internal/a11yState`, in 38 components (#6); `SpeedDial` and its
  actions named, closed actions hidden and out of the tab order (#8); a pressable `Card` with `Card.Actions` is an
  action area plus an actions row (#9); `Snackbar` and `Banner` announced on iOS, `Banner` a polite `status` on
  the web (#10); `Input` submits its `Form` on the return key; one Escape closes a popover inside a `Dialog`, not both.
- **Section 2:** `Table` header `aria-sort`, named sort and reorder buttons, clickable rows stay rows on the web;
  `Snackbar` with `duration={0}` closable; `Carousel` re-snaps on resize; `Collapse` teaser readable; `Image` takes
  its natural ratio; `Grid` leaves padding and border out; light default theme outside a provider; elevation 5 no
  longer `surfaceDim`; light `surfaceContainerHighest` `#E6E0E9`; `Pagination` keeps its width; `Breadcrumbs` a
  `navigation` with `aria-current`; no `SafeAreaProvider` needed (`internal/useInsets`); a collapsed `Drawer`'s group is
  a plain item; `Link`'s external icon for http(s) only; `StatusBadge` read as its label; `FormControl disabled`
  blocks touches; `Avatar` dots and `Popover`/`BottomSheet` shadows from the theme.
- **Found on the way and fixed:** text fields named for TalkBack (`accessibilityLabelledBy`, no value copied into
  `accessibilityValue`); `FormField`'s function child typed; `DataGrid` rows memoised (a re-render with the same rows
  draws no cell).
- **Left, with their limit:** a standalone `FAB` without `label` is still named after its icon (the app must pass
  `label`); on iOS a toast over a dialog is announced but its action button is out of VoiceOver's reach until the
  dialog closes (`accessibilityViewIsModal`); the calendar's own Escape (keyboard inside the grid) is fixed but was
  not driven in a browser; a sort still redraws the `DataGrid` rows that moved; a disabled `FormControl` blocks
  touches but not Tab, unless its child gets `disabled` (as `FormField` hands it).

## 3. Make the API consistent

The first two rename batches left the field family on the old vocabulary: it still uses `onPress`, `mode`,
`onValueChange` and `multiSelect`. **Points 1 and 2 were dropped on 2026-10-28** (Alice): those names stay on purpose.

1. **Rename batch 3**: `RadioButton`, `ToggleButton`, `ToggleButtonGroup`, `ButtonGroup`, `SplitButton`,
   `Checkbox`, `Slider`, `RadioGroup`, `SpeedDialAction`, `Banner` (`type` to `severity`, `onPress` to
   `onClick`, `onDismiss` to `onClose`), `EmptyState` action, `Tooltip` action, `Link`, `Breadcrumbs`,
   `Accordion`, `Carousel`, `Popover`, `BottomSheet`, `Skeleton`. Breaking, so one changeset like the others.
2. **One field contract**: every control takes `testID`, `name`, `onBlur`, `error` (`string | boolean`), and
   reads `FormControl` for `disabled`, `invalid`, `required`. `FormField` already injects these; most
   controls ignore them.
3. One option type for `Select`, `Autocomplete` and the choice groups. (`Select multiple` is now `value[]` and `onChange(values)`; `Autocomplete` keeps `selected` / `onSelectedChange` on purpose.)
4. `ReactNode` labels on `Checkbox`, `RadioButton`, `Switch` ("I accept the Terms" with a link inside).

## 4. What to build, in order of value

| Order | Item                                                                                                                                                                                  | Why                                                                                     | Effort |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 2     | **`useConfirm()` / `Alert.confirm()`** returning a promise, on top of the single `AlertDialog`                                                                                        | The most common dialog; today every call site keeps `visible` state                     | S      |
| 3     | **Theme mode**: `mode` / `setMode` / `defaultMode`, system option, nested provider inherits                                                                                           | A settings screen cannot be built; `toggleTheme` has no "system"                        | M      |
| 4     | **`AppShell`, `Container`, `Screen`** (safe-area scroll, pull to refresh), and nav items that take an `href` or link slot                                                             | Every app, and the playground itself, hand-builds its shell and cannot use router links | M-L    |
| 5     | **Toast v2**: `toast.promise` / `update`, exit animation (`maxVisible` and drawing above native modals are done)                                                                      | Promises (saving…, saved) and a soft exit                                               | M      |
| 6     | **Motion layer**: `Fade` / `Grow` / `Slide` + one reduced-motion rule; `Backdrop`, `LoadingOverlay`                                                                                   | Four copies of mount-until-exit; only 9 files honour reduced motion                     | M      |
| 8     | **Input family**: `type` (email, tel, url), `clearable`, `showCount`, masks (`PhoneInput`, `CurrencyInput`), slider range, `Tabs` scroll and keyboard model, `Stepper` per-step state | The basics of a business form and of a wizard                                           | M each |
| 9     | **Charts** (Phase 4 of the master plan, `solaris-native.md`)                                                                                                                          | Planned as a separate package                                                           | L      |

## 5. Not code, but open

- **Native is unproven** for everything built on 10-23 (upload picker, clipboard, download, hover card
  long-press, scroll area dragging, tree actions) and for the playground's `new Function` example runner.
  The master plan's native smoke job (`/native-check`) is the place to add them.
- **Icons**: tiles are rounder; truly rounded glyphs need a second icon set (Material Icons Rounded) through
  the palette's `iconSet`, like Eva. Decision pending.
- **Docs gaps**: the `Input` tables in `README.md` and `components.md` still lack `density`,
  `decimalSeparator`, `allUpperCase` and `reserveHelperText`; `Upload.maxFiles` has no "needs `multiple`"
  rule in the playground.
- **Playground limit**: the Properties panel covers props the library declares or inherits from its own
  types; `ScrollView`/`View` props are left to the platform by design.

## Suggested order

1. ~~One hardening pass on sections 1 and 2~~ (done on 2026-10-30).
2. ~~Rename batch 3 with the field contract~~ (dropped on 2026-10-28).
3. **`useConfirm` and the theme mode**, then **the shared `Column` type and ids for `Table` and `DataGrid`**.
4. **AppShell and nav links**, then **Toast v2 and the motion layer**.
5. Charts, pivot and PDF follow the master plan, not this list.
