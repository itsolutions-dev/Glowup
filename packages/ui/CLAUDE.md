# packages/ui — the library

- Anything added under `src/components` must be exported from `src/index.ts` to exist for
  consumers.
- Native dependencies are **peerDependencies**, and every one of them is required except
  `react-dom` (web only, and always there with `react-native-web`). An "optional" peer that a
  barrel-reachable module imports is not optional — Metro resolves every static import — which
  is why `expo-localization` (replaced by `Intl`) and `expo-status-bar` (the `StatusBar`
  component moved into the playground) are gone. `polished` is the only real dependency.
  The library is **navigation-agnostic**: it must never
  depend on `@react-navigation/*`. It ships navigation widgets (`AppBar`, `NavigationBar`,
  `Tabs`, `Breadcrumbs`, `Pagination`, `Stepper`) but no navigator — that belongs to the
  consuming app.
- Source maps are **not published**. `sourceMaps: false` on bob's babel targets drops the
  `.js.map` files; bob's typescript target hardcodes `--declarationMap`, so `npm run build`
  chains `scripts/strip-declaration-maps.mjs` to delete the `.d.ts.map` files and the
  comments pointing at them. Don't "restore" either half without removing `!**/*.map` from
  the package's `files` too, or the tarball will reference maps it does not ship.
- The playground consumes `src`, never `lib`, so the published artefact is checked separately:
  `npm run validate-package -w @its/glowup-ui` (a CI step) validates the tarball's manifest
  and types statically, and `examples/consumer` exercises the published package at runtime
  (its own CI workflow, `consumer-smoke.yml`, chains off Release, so it runs on every push to
  master, plus weekly and on demand — never on a PR, which cannot change what is already
  published). Run validate-package
  after touching `package.json`, the export map or anything a `.d.ts` imports.

## Theme system

All colors, typography, spacing and shape tokens live in `packages/ui/src/providers/theme.json`
— the runtime source of truth. The public `Theme` type spells the tokens out explicitly
(`ThemeColorTokens`, `ThemeSpacingTokens`, `ThemeShapeTokens`, `TypographyVariant`) instead of
deriving them with `typeof themeConfig`: a public type derived from the JSON makes the emitted
`.d.ts` import `theme.json`, which is not shipped with the declarations. A type-level guard
(`_ThemeTokensInSync` in `ThemeProvider.tsx`) fails `npm run type-check` if the explicit types
and `theme.json` drift apart — **when you add or remove a token, update both.**

**Styling pattern used throughout:** theme-reactive styles via `useMemo`:

```tsx
const styles = useMemo(() => makeStyles(theme), [theme]);
// ...
const makeStyles = (theme: Theme) => StyleSheet.create({ ... });
```

Colour sets live in `providers/palettes.ts`: `palettes` is the baseline plus the nineteen named
Material hues, each built by `createPalette(seed)`; `useTheme().setPalette()` swaps them live.
The tone math is in `providers/tonal.ts` and the fixed success roles (Button's `tone="success"`)
in `providers/successRoles.ts` — both internal, not re-exported from the barrel.

`useTheme()` exposes `{ theme, toggleTheme }`; `getStateColor()` and `getGlowStyles()` are
exported for building theme-reactive components. The theme follows the OS color scheme and
supports a manual toggle.

## Providers

- `ThemeProvider` — Material You theme derived from `theme.json` (see above).
- `AlertProvider` — cross-platform alert: native `Alert.alert` on iOS/Android, custom Modal on
  web. Call the `Alert(title, message, buttons)` singleton; `AlertProvider` wires it up
  (`AlertProviderWrapper` is a deprecated pass-through).
- `ToastProvider` — imperative queued toasts via `useToast()`.
