---
"@its/glowup-ui": minor
---

**Breaking — removed components.** Six exports that were either app code or a thin
wrapper over another component are gone:

| Removed                | Use instead                                                                    |
| ---------------------- | ------------------------------------------------------------------------------ |
| `TimeSelect`           | `TimePicker` / `ClockPicker` (it was already deprecated and unused internally) |
| `NumericInput`         | `<Input type="number" precision={…} prefix={…} suffix={…} />`                  |
| `IconBadge`            | `IconButton` next to a `Badge`                                                 |
| `LanguageSelector`     | app code: it hard-coded four languages and their flags                         |
| `DrawerPreferenceItem` | `ListItem` with the control in `trailing`                                      |
| `StatusBar`            | `expo-status-bar` directly: `<StatusBar style={theme.isDark ? "light" : "dark"} />` |

**Peer dependencies are now honest.** `expo-localization`, `expo-status-bar` and
`react-native-svg` were declared optional, but the barrel imported all three statically, so
an app without them failed to bundle. `expo-localization` is dropped (the device locale now
comes from `Intl`, which every other date helper already used), `expo-status-bar` is dropped
with `StatusBar`, and `react-native-svg` is now a required peer. `date-fns` is no longer a
dependency: only `isToday`/`isYesterday`/`isTomorrow` were used.

**Supply chain.** Releases are published from GitHub Actions through npm trusted publishing
with provenance, and the manifest now carries `repository`, `homepage` and `bugs`.

**Fixes.**

- `Calendar` (web) no longer takes the keyboard from the whole page: it listened on
  `document` in the capture phase, so while any calendar was on screen no input could
  receive a space, and Enter on a dialog button picked a day instead. It now handles keys
  only while focus is inside it; the date pickers move focus into it on open (new
  `autoFocus` prop), so their keyboard navigation works as before.
- `ThemeProvider` memoises `theme` and the context value. It built a new theme on every
  render, which invalidated every component's memoised styles.
- `Collapse` animates closing (the children were removed before the animation ran), and
  `Accordion` is built on it instead of the app-wide `LayoutAnimation`.
- `Input type="number"`: `precision` applies after extra decimal points are merged
  (`"1.2.34"` at precision 2 was `"1.234"`).
- `Link` opens only `http`, `https`, `mailto` and `tel` URLs by default; anything else —
  `javascript:`, `intent:`, another app's deep link — is ignored. New `allowedSchemes` to
  permit your own app's scheme.
- `Tooltip` (web) opens on hover and on keyboard focus of the control it wraps. It listened
  through a `Pressable`, which react-native-web does not notify when its child is itself
  pressable (a `Button`, an `IconButton` — the usual anchor): hover never opened it, and focus
  did only on the wrapper, an extra tab stop. The tip now has `role="tooltip"`.
- `Calendar` (web) takes focus back when you return to the days from the month or year view,
  so the arrow keys keep working after picking a year.
- `Carousel` no longer calls `onIndexChange` (or scrolls) from inside a state updater,
  which ran twice under StrictMode. `Popover` cancels its pending animation frame.
  `BottomSheet` no longer replays its entrance when the window is resized.

**Breaking — `Toggle` knobs.** `trackBorderWidth`, `animationDuration`,
`thumbOffSizeRatio` and `thumbOnSizeRatio` are removed (nothing set them; the switch keeps
its geometry). `width` and `height` stay.

**Smaller changes.**

- `AlertProvider` wires up `Alert()` itself; `AlertProviderWrapper` is now a deprecated
  pass-through (keep it or drop it — both work).
- `StatusBadge` takes its colours from the theme (error container, and fixed success and
  warning hues) instead of hard-coded hex pairs, so it follows the palette and the scheme.
- Every component's props type is exported (`ButtonProps`, `InputProps`, `ModalProps`…).
- `getSafePosition` (a Popover internal) is no longer exported.
- The nineteen Material palettes are built on first use instead of at import (about
  1,400 tone searches the app paid for on startup even when it used one palette).

**Breaking — theme aliases.** `theme.colors.accent`, `.text`, `.onAccent` and
`.onSurfaceContainer` are removed; use `primary`, `onSurface`, `onPrimary` and `onSurface`.

**New components** (Material 3 and M3 Expressive, no new dependencies):

- `NavigationRail` — the side-mounted counterpart of `NavigationBar`, same item shape.
- `NavigationDrawer` with `DrawerItem` and `DrawerSection` — `variant="standard"` (inline)
  or `"modal"` (slides in over a scrim; Escape and Android back close it).
- `TopAppBar` — navigator-agnostic top app bar: `small`, `center`, `medium`, `large`,
  `leading`/`actions` slots, `elevated`. `AppBar` is now a thin react-navigation adapter
  over it, with the same props.
- `ButtonGroup` — standard or connected M3 Expressive button group, single or multi select.
- `SplitButton` — a primary action plus a `Menu` of related ones.
- `Toolbar` — docked or floating (standard/vibrant, horizontal/vertical, optional FAB).
- `SideSheet` — modal or standard side sheet, with back, close and an action row.
- `ChipGroup` — filter chips with single (optionally `required`) or multi selection.
- `Table`, `TableHead`, `TableRow`, `TableHeaderCell`, `TableCell` — the primitives
  `DataGrid` is built from, now public, with table/row/columnheader/cell roles.

**Additions to existing components:** `Modal` `fullScreen`; `CircularProgress` `progress`
(determinate ring over a track), `decorative`, `accessibilityLabel`; `Tooltip`
`variant="rich"` with `title` and `action`; `Typography` forwards every `Text` prop
(`numberOfLines`, `selectable`, `testID`…); `Chip` `accessibilityRole`. Props types are
exported for `AppBar`, `CircularProgress`, `Tooltip` and `Typography`.
