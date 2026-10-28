# What the library still needs

A short, ordered plan of fixes and gaps for `@its/glowup-ui`, as of 2026-10-23 (HEAD `cbdefc5`).

**How it was made.** The 22 October review of all 85 components (three read-only reports) was re-checked
on 23 October against the current source, after the two rename batches and the 16 new components. Every bug
below was read in the code at the place cited; **none was run**, and the ones that depend on a device or on
`react-native-web` internals say so. Items the review raised that have since been built (upload, tree view,
inline edit, clipboard, code block, password reveal, form validation, `Visible`, dialog roles) are not listed.
Paths are relative to `packages/ui/src`. Effort: **S** under a day, **M** a few days, **L** a week or more.

About 24 distinct defects are still open (28 October), 6 of them high. Nothing here is a regression from the recent work:
they were found by reading, and they were already there.

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

## 1. Fix first: wrong behaviour and accessibility blockers (all small unless noted)

| #   | Where                                                            | Problem                                                                                                                                                                                                                            | Effort |
| --- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 3   | `providers/ToastProvider.tsx:150-171`                            | The toast host is an ordinary View: a toast raised while a Dialog, BottomSheet or Drawer is open appears under the scrim.                                                                                                          | M      |
| 4   | `components/Pagination.tsx:148,176`                              | The current page is `disabled`: announced as disabled and out of the tab order. The container is a `menubar`.                                                                                                                      | S      |
| 6   | 35+ files (Checkbox, RadioButton, Chip, Select, Slider, Rating…) | `accessibilityState` and `accessibilityValue` never reach the DOM; only Accordion, LinearProgress, Switch, Tabs and Tree set `aria-*`. A web screen reader hears no checked, selected or value state. One shared helper fixes all. | M      |
| 8   | `components/SpeedDial.tsx`, `components/FAB.tsx:138`             | Icon-only buttons are named "<icon> FAB"; closed SpeedDial rows stay focusable.                                                                                                                                                    | S      |
| 9   | `components/Card.tsx:36-127`                                     | A pressable Card is a button on web and its `Card.Actions` buttons nest inside it (the JSDoc example does this).                                                                                                                   | M      |
| 10  | `components/Snackbar.tsx:232`, `components/Banner.tsx:56`        | iOS never announces them (the live region is Android only); Banner is assertive on load.                                                                                                                                           | S      |

Also small: `Input` never submits a form on native `onSubmitEditing` (`Input.tsx`); a date picker open inside a
`Dialog` closes on Escape and the dialog closes with it (the picker on keydown, the Modal on keyup).

## 2. Correctness, second tier

- **Table / DataGrid**: the sort header has no role, label or `aria-sort` (`:487`); a clickable row becomes a button that nests
  buttons (`:379`).
- **Overlays and feedback**: a toast with `duration <= 0` and no `onClose` can never be dismissed (`Snackbar.tsx:211`).
- **Layout and content**: `Carousel` does not re-snap on rotation or resize (`:55`); `Collapse` hides its
  visible teaser from assistive tech (`:107`); `Image` with neither `height` nor `ratio` draws nothing
  (`:96`); `Grid` sizes items from the container width including padding (`Layout/Grid.tsx:217`).
- **Theme**: a component outside a provider silently renders dark (`ThemeProvider.tsx:162`); elevation 5
  uses `surfaceDim`, which in dark mode is darker than elevation 0 (`internal/elevation.ts:33`); light
  `surfaceContainerHighest` is nearly `surfaceContainerHigh` (`theme.json:31`).
- **Navigation**: `Pagination` window width changes with the page; `Breadcrumbs` is a `menubar` with no `aria-current`;
  `AppBar`, `Toolbar`, `FAB`, `SpeedDial` and `SideOverlay` throw without a `SafeAreaProvider`; a group
  `DrawerItem` in a collapsed `Drawer` still toggles.
- **Small**: hard-coded colours (Avatar status dots, popover and sheet shadows), `Link` treats `mailto:`
  and `tel:` as external, `StatusBadge` prefixes an English word, `FormControl disabled` only dims (nothing reads `useFormControl`).

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
| 5     | **Toast v2**: render above native modals, `toast.promise` / `update`, exit animation (`maxVisible` is done)                                                                           | Toasts are hidden behind dialogs                                                        | M      |
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

1. **One hardening pass** on section 1 (about a week of small fixes), with a test per fix. It removes every
   high-severity item and most of the accessibility debt.
2. ~~Rename batch 3 with the field contract~~ (dropped on 2026-10-28).
3. **`useConfirm` and the theme mode**, then **the shared `Column` type and ids for `Table` and `DataGrid`**.
4. **AppShell and nav links**, then **Toast v2 and the motion layer**.
5. Charts, pivot and PDF follow the master plan, not this list.
