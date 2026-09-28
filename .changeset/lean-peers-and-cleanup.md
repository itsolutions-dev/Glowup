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
