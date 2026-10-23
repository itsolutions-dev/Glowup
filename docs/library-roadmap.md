# What the library still needs

A short, ordered plan of fixes and gaps for `@its/glowup-ui`, as of 2026-10-23 (HEAD `cbdefc5`).

**How it was made.** The 22 October review of all 85 components (three read-only reports) was re-checked
on 23 October against the current source, after the two rename batches and the 16 new components. Every bug
below was read in the code at the place cited; **none was run**, and the ones that depend on a device or on
`react-native-web` internals say so. Items the review raised that have since been built (upload, tree view,
inline edit, clipboard, code block, password reveal, form validation, `Visible`, dialog roles) are not listed.
Paths are relative to `packages/ui/src`. Effort: **S** under a day, **M** a few days, **L** a week or more.

About 40 distinct defects are still open, 10 of them high. Nothing here is a regression from the recent work:
they were found by reading, and they were already there.

## 1. Fix first: wrong behaviour and accessibility blockers (all small unless noted)

| #   | Where                                                                          | Problem                                                                                                                                                                                                                            | Effort |
| --- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `components/Dialog/Dialog.tsx:249,299,364`, `internal/SideOverlay.tsx:131,249` | On web, Escape fires `onClose` twice (a document key listener plus the Modal's own), and with stacked dialogs every one closes. _(the Modal side was not re-read)_                                                                 | S      |
| 2   | `providers/ToastProvider.tsx:125-140`                                          | `queue` sits in the context value, so `useToast()` changes identity on every toast and an effect that depends on it loops; every consumer re-renders per toast.                                                                    | S      |
| 3   | `providers/ToastProvider.tsx:150-171`                                          | The toast host is an ordinary View: a toast raised while a Dialog, BottomSheet or Drawer is open appears under the scrim.                                                                                                          | M      |
| 4   | `components/Pagination.tsx:148,176`                                            | The current page is `disabled`: announced as disabled and out of the tab order. The container is a `menubar`.                                                                                                                      | S      |
| 5   | `components/Slider.tsx:172-183`                                                | Not keyboard-operable: no focus, no key handling, `role=adjustable` without a value on web.                                                                                                                                        | M      |
| 6   | 35+ files (Checkbox, RadioButton, Chip, Select, Slider, Rating…)               | `accessibilityState` and `accessibilityValue` never reach the DOM; only Accordion, LinearProgress, Switch, Tabs and Tree set `aria-*`. A web screen reader hears no checked, selected or value state. One shared helper fixes all. | M      |
| 7   | `components/NumberField.tsx:32-33,50,117`                                      | Integer only (a step of 0.5 truncates) and `min`/`max` silently default to 0 and 100.                                                                                                                                              | S      |
| 8   | `components/SpeedDial.tsx`, `components/FAB.tsx:138`                           | Icon-only buttons are named "<icon> FAB"; closed SpeedDial rows stay focusable.                                                                                                                                                    | S      |
| 9   | `components/Card.tsx:36-127`                                                   | A pressable Card is a button on web and its `Card.Actions` buttons nest inside it (the JSDoc example does this).                                                                                                                   | M      |
| 10  | `components/Snackbar.tsx:232`, `components/Banner.tsx:56`                      | iOS never announces them (the live region is Android only); Banner is assertive on load.                                                                                                                                           | S      |
| 11  | `components/DateTimePicker.web.tsx:196`                                        | `createPortal` during render when `defaultOpen` seeds the picker open: a likely throw in the static export.                                                                                                                        | S      |

Also small and worth doing in the same pass: `Select` hides the tick for option values `0`, `""` and `false`
(`Select.tsx:440`); `PinInput` pads with spaces, so a later cell can fire `onComplete` with blanks
(`PinInput.tsx:109`); `ProgressButton` does not forward `type`, so it cannot submit a Form
(`ProgressButton.tsx:305`); `Form` Enter on web ignores a disabled standalone submit button
(`Form.tsx:385`); `Input` never submits a form on native `onSubmitEditing` (`Input.tsx`).

## 2. Correctness, second tier

- **Table / DataGrid**: rows keyed by index so cell state follows position after a sort (`Table.tsx:203`);
  the sort header has no role, label or `aria-sort` (`:487`); a clickable row becomes a button that nests
  buttons (`:379`); a column reorder is lost when `columns` is a new array (`DataGrid.tsx:78`).
- **Overlays and feedback**: `Alert()` before the provider mounts is dropped with a warning, a second web
  `Alert()` overwrites the first, and closing by Escape skips the cancel button (`AlertProvider.tsx:46-128`);
  a toast with `duration <= 0` and no `onClose` can never be dismissed (`Snackbar.tsx:211`).
- **Layout and content**: `Carousel` does not re-snap on rotation or resize (`:55`); `Collapse` hides its
  visible teaser from assistive tech (`:107`); `Image` with neither `height` nor `ratio` draws nothing
  (`:96`); `Grid` sizes items from the container width including padding (`Layout/Grid.tsx:217`).
- **Theme**: a component outside a provider silently renders dark (`ThemeProvider.tsx:162`); elevation 5
  uses `surfaceDim`, which in dark mode is darker than elevation 0 (`internal/elevation.ts:33`); light
  `surfaceContainerHighest` is nearly `surfaceContainerHigh` (`theme.json:31`).
- **Navigation**: `Tabs` hover/press adds a border and halo that shifts layout (`Tab/Tabs.tsx:227`);
  `Pagination` window width changes with the page; `Breadcrumbs` is a `menubar` with no `aria-current`;
  `AppBar`, `Toolbar`, `FAB`, `SpeedDial` and `SideOverlay` throw without a `SafeAreaProvider`; a group
  `DrawerItem` in a collapsed `Drawer` still toggles.
- **Small**: hard-coded colours (Avatar status dots, popover and sheet shadows), `Link` treats `mailto:`
  and `tel:` as external, `StatusBadge` prefixes an English word, `Slider` first touch uses a stale track
  position, `FormControl disabled` only dims (nothing reads `useFormControl`).

## 3. Make the API consistent

The first two rename batches left the field family on the old vocabulary: it still uses `onPress`, `mode`,
`onValueChange` and `multiSelect`.

1. **Rename batch 3**: `RadioButton`, `ToggleButton`, `ToggleButtonGroup`, `ButtonGroup`, `SplitButton`,
   `Checkbox`, `Slider`, `RadioGroup`, `SpeedDialAction`, `Banner` (`type` to `severity`, `onPress` to
   `onClick`, `onDismiss` to `onClose`), `EmptyState` action, `Tooltip` action, `Link`, `Breadcrumbs`,
   `Accordion`, `Carousel`, `Popover`, `BottomSheet`, `Skeleton`. Breaking, so one changeset like the others.
2. **One field contract**: every control takes `testID`, `name`, `onBlur`, `error` (`string | boolean`), and
   reads `FormControl` for `disabled`, `invalid`, `required`. `FormField` already injects these; most
   controls ignore them.
3. **One multi-select shape** (`Select`, `Autocomplete`: `value[]` and `onChange(values)`), one option type.
4. `Typography` defaults to `h1` (57 px, no heading role): `body1` is the likelier intent. Decide, then change.
5. `ReactNode` labels on `Checkbox`, `RadioButton`, `Switch` ("I accept the Terms" with a link inside).

## 4. What to build, in order of value

| Order | Item                                                                                                                                                                                  | Why                                                                                                | Effort   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| 1     | **`Table` and `DataGrid` converge**: one `Column` type, `getRowId`, selection, client sort, `loading`, row click, paging on the grid, sticky column                                   | The biggest gap for real admin data; the two still differ on `alignment`/`align` and `label` types | L        |
| 2     | **`useConfirm()` / `Alert.confirm()`** returning a promise, plus `loading` on `ConfirmDialog`; decide the `AlertDialog` / `ConfirmDialog` overlap                                     | The most common dialog; today every call site keeps `visible` state                                | S-M      |
| 3     | **Theme mode**: `mode` / `setMode` / `defaultMode`, system option, nested provider inherits                                                                                           | A settings screen cannot be built; `toggleTheme` has no "system"                                   | M        |
| 4     | **`AppShell`, `Container`, `Screen`** (safe-area scroll, pull to refresh), and nav items that take an `href` or link slot                                                             | Every app, and the playground itself, hand-builds its shell and cannot use router links            | M-L      |
| 5     | **Toast v2**: render above native modals, `toast.promise` / `update`, queue limit, exit animation                                                                                     | One toast at a time, hidden behind dialogs                                                         | M        |
| 6     | **Motion layer**: `Fade` / `Grow` / `Slide` + one reduced-motion rule; `Backdrop`, `LoadingOverlay`                                                                                   | Four copies of mount-until-exit; only 9 files honour reduced motion                                | M        |
| 7     | **Small data pieces**: `AvatarGroup`, `Skeleton` presets, `Stat.loading` and `Sparkline`, `Timeline`, a virtualised `List`                                                            | One-line loading and dashboard states                                                              | S-M each |
| 8     | **Input family**: `type` (email, tel, url), `clearable`, `showCount`, masks (`PhoneInput`, `CurrencyInput`), slider range, `Tabs` scroll and keyboard model, `Stepper` per-step state | The basics of a business form and of a wizard                                                      | M each   |
| 9     | **Charts** (Phase 4 of the master plan, `solaris-native.md`)                                                                                                                          | Planned as a separate package                                                                      | L        |

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
2. **Rename batch 3 with the field contract**, because it is breaking and cheaper to do before more consumers
   adopt the current names.
3. **`useConfirm` and the theme mode**, then **Table / DataGrid convergence** as its own project.
4. **AppShell and nav links**, then **Toast v2 and the motion layer**.
5. Charts, pivot and PDF follow the master plan, not this list.
