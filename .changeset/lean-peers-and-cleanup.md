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
- `Carousel` no longer calls `onIndexChange` (or scrolls) from inside a state updater,
  which ran twice under StrictMode. `Popover` cancels its pending animation frame.
  `BottomSheet` no longer replays its entrance when the window is resized.

**Breaking — theme aliases.** `theme.colors.accent`, `.text`, `.onAccent` and
`.onSurfaceContainer` are removed; use `primary`, `onSurface`, `onPrimary` and `onSurface`.
