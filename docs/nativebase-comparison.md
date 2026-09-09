# Glowup vs. NativeBase — coverage audit

Audit of the Glowup component library against [NativeBase](https://nativebase.io/), the gap list
it produced, and the work done on this branch.

## Method

`nativebase.io` and `docs.nativebase.io` are blocked by this environment's network egress policy,
so the inventory was taken from the library's own source of truth instead — the public export
barrels on `master`:

- `src/components/primitives/index.ts`
- `src/components/composites/index.ts`

That is a stronger source than the docs sidebar anyway: it is the actual shipped API.

### One thing worth knowing before you copy anything from it

NativeBase's own README opens with **"⛔️ DEPRECATED"**. The library is in maintenance mode and
GeekyAnts now points new projects at [gluestack-ui](https://ui.gluestack.io/). So treat it as a
reference for *API surface and DX ideas*, not as a project to converge on. The gaps below were
worth closing on their merits — layout primitives and form plumbing are genuinely missing from
Glowup — but "NativeBase has it" is not by itself a reason to add something.

## Inventory

**NativeBase (65 exports).** Primitives: Box, Button, Checkbox, Column, Flex, Heading, Hidden,
Icon, Image, Input, Link, List, Overlay, Pressable, Radio, Row, Select, Slider, Spinner, Stack,
Switch, Text, TextArea, View, VisuallyHidden, ZStack. Composites: Accordion, Actionsheet, Alert,
AlertDialog, AppBar, AspectRatio, Avatar, Backdrop, Badge, Breadcrumb, Card, Center,
CircularProgress, Code, Collapse, Container, Divider, Drawer, Fab, FormControl, IconButton, KBD,
Menu, Modal, NumberInput, PinInput, Popover, Progress, SimpleGrid, Skeleton, Stat, Tabs, Tag,
TextField, Toast, Tooltip, Transitions, Typeahead, Wrap.

## Already covered (different name, same job)

| NativeBase | Glowup | Note |
|---|---|---|
| Switch | `Toggle` | |
| Tag | `Chip` | Glowup's also does selected/filter states |
| Heading / Text | `Typography` | One component, M3 variant scale |
| Progress | `LinearProgress` | plus `CircularProgress` |
| Drawer | `DrawerNavigation` | responsive permanent/slide-over |
| Actionsheet | `BottomSheet` | |
| AlertDialog | `ConfirmDialog` | |
| Alert | `Banner` | M3 banner rather than an inline alert box |
| Toast | `Snackbar` | the imperative API was the real gap — see below |
| NumberInput | `NumericInput` | |
| TextArea / TextField | `Input` | `multiline` + `numberOfLines` |
| Radio | `RadioButton` / `RadioGroup` | |
| Breadcrumb | `Breadcrumbs` | |
| Fab | `FAB` | plus `SpeedDial` |
| Backdrop / Overlay | inside `Modal` / `BottomSheet` | not a standalone export |
| View / Pressable / Icon / Text | re-export `react-native` / `@expo/vector-icons` | no wrapper worth the indirection |

## Gaps closed on this branch

### Layout primitives — the real gap

This was NativeBase's clearest advantage. Every Glowup screen was hand-rolling
`StyleSheet.create({ row: { flexDirection: "row", gap: 8 } })`, which is how magic numbers get
into a design system. The new primitives read spacing, shape and color straight off the theme:

| New | Replaces / NativeBase equivalent |
|---|---|
| `Box` | Box — token-driven `p`/`m`/`bg`/`radius`/`gap` utility props |
| `Stack`, `HStack`, `VStack` | Stack / Row / Column |
| `Center` | Center |
| `Spacer` | (none) — fixed or flexible gap |
| `Grid` | SimpleGrid / Wrap — `columns` or responsive `minChildWidth` |
| `AspectRatio` | AspectRatio |

`Grid` chunks its children into explicit rows instead of letting them wrap. Wrapping plus a
container `gap` overflows (`n × 100/n% + gap > 100%`) and silently drops to one column per row;
chunking also keeps a short final row at column width instead of stretching it.

### Forms

- **`FormControl`** — label / helper / error / required / disabled for controls that have no such
  props of their own (Checkbox, RadioGroup, Slider, composites). Shares its state through
  `useFormControl()`.
- **`PinInput`** — OTP / PIN entry. Typing advances, Backspace retreats, and pasting a whole code
  into any cell fills the row (`maxLength` is deliberately *not* set — a longer string has to
  reach `onChangeText` for paste and SMS autofill to work).
- **`Autocomplete`** — NativeBase's Typeahead. Accent-insensitive matching, `description` lines,
  arrow/Enter/Escape navigation on web, `loading` state for server-side filtering. The list
  renders inside the field's own container rather than in a modal, because a modal steals focus
  from the input and you cannot keep typing.

### Actions, media, data

- **`IconButton`** — M3 standard / filled / tonal / outlined, three sizes, toggle `selected`
  state. `Button` with only an icon comes out pill-shaped and label-padded.
- **`Link`** — `href` via `Linking.openURL`, `underline="always" | "hover" | "none"`, automatic
  external-link icon.
- **`Image`** — `react-native`'s Image plus the three things every app rewrites around it: a
  skeleton placeholder, a fallback for broken sources, and token-driven radius. `alt` is
  **required**.
- **`Stat`** — labelled metric with a signed delta, trend arrow, and `invertTrendColors` for
  metrics where down is good.
- **`Collapse`** — animates between `collapsedHeight` and the *measured* content height, so it
  survives text reflow without a hardcoded height.

### Feedback

- **`ToastProvider` + `useToast()`** — this is where NativeBase's `useToast` was genuinely better
  than a bare `Snackbar` component: no `visible` state to thread through every screen.
  `toast.show()` / `.success()` / `.error()` / `.hide()`, a FIFO queue so a burst of events plays
  back in order, and an `id` to collapse repeats (a retry loop, a poll) instead of stacking them.

## Deliberately not ported

| NativeBase | Why not |
|---|---|
| `Code`, `KBD` | Documentation-site components. `Typography` + `Box` covers them in two lines. |
| `Hidden`, `VisuallyHidden` | `Hidden`'s responsive props belong to a breakpoint system Glowup does not have; RN's `accessibilityElementsHidden` already covers the other. |
| `Container` | A max-width wrapper — one `Box` with `width`/`alignSelf`. |
| `Flex`, `ZStack` | `Box` covers Flex; ZStack is `position: "absolute"` children, rarely worth an export. |
| `Transitions` (Fade/Slide/ScaleFade) | Would need a considered animation story across the whole kit, not a one-off. Left for its own change. |
| `Alert` as a separate inline box | `Banner` already occupies that slot in M3. Adding both would give two answers to one question. |
| `List` | `ListItem` + `FlatList` is the RN-idiomatic composition. |

## What Glowup has that NativeBase does not

`DataGrid`, `DateTimePicker` / `DatePicker` / `TimePicker` / `Calendar` / `TimeSelect`, `Carousel`,
`Rating`, `Pagination`, `Stepper`, `SpeedDial`, `EmptyState`, `SearchBar`, `StatusBadge`,
`ToggleButtonGroup`, `LanguageSelector`, `IconBadge`, `DrawerNavigation` / `StackNavigation`,
`Paper`, and the whole Material You token system (`getStateColor`, `getGlowStyles`, dynamic
light/dark).

Worth stating plainly: **NativeBase ships no date picker, time picker or calendar at all** — its
docs push you to a third-party library. So the date/time work below has no NativeBase counterpart
to compare against; it was audited against Material Design 3's date-picker spec and against WCAG
keyboard requirements instead.

---

# Date & time picker — audit and rewrite

The previous implementation had a working happy path and a set of problems that only show up in
real forms.

## Defects found

| # | Where | Problem |
|---|---|---|
| 1 | `DateTimePicker.web.tsx` | Month names, weekday names, "Oggi", "Mese precedente" and "Chiudi calendario" were **hardcoded Italian string arrays**, in a library that already resolved the device locale and ships i18n. A Japanese or US user got Italian labels. |
| 2 | same | Week start hardcoded to Monday, so US/JP/BR calendars were laid out wrong. |
| 3 | same | `mode="time"` and `mode="datetime"` fell back to an invisible native `<input>` stretched over the field. Two different visual languages in one component, and no styled surface at all for time. |
| 4 | same | Popover positioned once, in `position: fixed` coordinates, with no scroll or resize listener — it detached from its field the moment anything scrolled. |
| 5 | same | No flip or clamp: a field near the bottom or right edge opened a calendar off-screen. |
| 6 | both | No `minimumDate` / `maximumDate` and no per-day predicate, so "no past dates" and "weekdays only" were not expressible. |
| 7 | both | `value: Date` was required and non-nullable — no way to render an empty field, and no way to clear one. |
| 8 | both | No `error` / `helperText` / `required`, so pickers could not be validated like `Input` fields. |
| 9 | both | Calendar was mouse-only: no arrow-key navigation, no Enter, no Escape, no `role="dialog"`. |
| 10 | both | Field chrome was duplicated between the two platform files and drifted; `wrapper` carried a hardcoded `marginBottom: 20` instead of a spacing token. |
| 11 | `DateTimePicker.web.tsx` | `fromInputValue` fed `NaN` into `setFullYear`/`setHours` on malformed input. Gone with the native input. |
| 12 | `DateTimePicker.web.tsx` | Year picker was a fixed ±5 window with no paging. |

## What replaced it

```
DateTimePicker.shared.ts    locale metadata (Intl), date maths, props, English default labels
DateTimePicker.field.tsx    the field chrome, shared by both platforms
Calendar.tsx                cross-platform month grid + month/year views + keyboard nav
TimeSelect.tsx              cross-platform hour/minute (+ day period) columns
DateTimePicker.web.tsx      field + anchored popover
DateTimePicker.tsx          field + OS modal, or the same surface in an RN Modal
DatePicker.tsx              mode="date"
TimePicker.tsx              mode="time"
```

Everything locale-dependent now comes from `Intl`, memoized per locale:

- month and weekday names — `Intl.DateTimeFormat`
- week start — `Intl.Locale#getWeekInfo`, falling back to a CLDR region table on older Hermes
- 12h vs 24h and the AM/PM labels — `Intl.DateTimeFormat(...).resolvedOptions().hour12`
- day accessibility labels — `Intl.DateTimeFormat(locale, { dateStyle: "full" })`

Chrome strings (`Today`, `OK`, `Cancel`, `Previous month`, …) default to English and are
overridable via `labels`, so an i18n app passes `t()` values in.

### New props

`minimumDate`, `maximumDate`, `isDateDisabled`, `error`, `helperText`, `required`, `clearable` +
`onClear`, `placeholder`, `minuteInterval`, `locale`, `firstDayOfWeek`, `variant`, `labels`,
`style`, `testID`. `value` widened to `Date | null`.

`onChange` deliberately stays `(date: Date) => void` — widening it to `Date | null` would have
broken every existing handler under `strictFunctionTypes`. Clearing goes through `onClear`.

### Keyboard (web)

Arrows move by day/week, `PageUp`/`PageDown` by month (`Shift` for a year), `Home`/`End` jump to
the ends of the week, `Enter`/`Space` select, `Escape` closes. Escape is owned by the picker, not
the Calendar, so it also works in `mode="time"` where no Calendar is rendered.

### `variant`

`auto` (default) uses the OS picker on iOS/Android and the in-house popover on web. It switches to
the in-house surface automatically when `isDateDisabled` is set, because the OS pickers cannot
express a per-day predicate. `native` and `inline` force the choice.

`minuteInterval` is typed as `1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30` — the set the OS
pickers accept — so `native` and `inline` stay interchangeable.

## Other components fixed

- **`Input`** — `dynamicStyles` was left behind by a debugging session:

  ```tsx
  // BISECT-TEST: glow disabled
  const dynamicStyles = useMemo(
    () => ({ borderWidth: 1, borderColor: theme.colors.outlineVariant }),
    [theme],
  );
  ```

  The focus ring and the error border were dead code for every `Input` in the library — a field
  with an `error` message rendered a normal grey border. Now `getGlowStyles(theme, isFocused, error)`.
- **`Snackbar`** — `icon` was typed `string` and cast with `as any` at the call site; now
  `MaterialCommunityIconsGlyphs`, so a typo is a compile error.
- **`PressableState`** — gained the `focused` flag react-native-web provides.
- **`.gitignore`** — dropped the `docs/` entry, which was hiding this file and had already been
  worked around once for `docs/npm-publishing-plan.md`.

## Verification

- `npm run type-check` clean in both workspaces.
- `npm run build` (`react-native-builder-bob`) clean — commonjs, module and typescript targets.
- `npx expo export --platform web` bundles with no errors.
- Exported bundle driven in headless Chromium: calendar opens anchored, arrow keys + Enter select
  the expected day, Escape closes, `mode="datetime"` renders calendar + time columns, and with the
  browser locale set to `it-IT` the calendar comes up as "settembre", Monday-first, with "Oggi" —
  from `Intl`, not from a hardcoded array. No console errors.

`npm run lint` still fails repo-wide, before and after this change: the working tree is LF while
`eslint.config.js` sets `linebreak-style: ["error", "windows"]` and `.prettierrc` sets
`endOfLine: "crlf"`. That is a checkout-configuration issue (Windows `core.autocrlf`), not
something this change introduces or should paper over. New files were verified with those two
rules disabled and are clean — including `react-hooks/refs` and `react-hooks/set-state-in-effect`,
which the existing `Toggle.tsx` still trips.
