# packages/ui — the library

- Anything added under `src/components` must be exported from `src/index.ts` to exist for
  consumers.
- Native dependencies are **peerDependencies**, and every one of them is required except
  `react-dom` (web only, and always there with `react-native-web`). An "optional" peer that a
  barrel-reachable module imports is not optional — Metro resolves every static import — which
  is why `expo-localization` (replaced by `Intl`) and `expo-status-bar` (the `StatusBar`
  component moved into the playground) are gone. `polished` is the only real dependency.
  The library is **navigation-agnostic**: it must never
  depend on `@react-navigation/*`. It ships navigation widgets (`AppBar`, `NavBar`, `Drawer`,
  `Tabs`, `Breadcrumbs`, `Pagination`, `Stepper`) but no navigator — that belongs to the
  consuming app.
- Source maps are **not published**. `sourceMaps: false` on bob's babel targets drops the
  `.js.map` files; bob's typescript target hardcodes `--declarationMap`, so `npm run build`
  chains the repo-root `scripts/strip-declaration-maps.mjs` to delete the `.d.ts.map` files and the
  comments pointing at them. Don't "restore" either half without removing `!**/*.map` from
  the package's `files` too, or the tarball will reference maps it does not ship.
- The playground consumes `src`, never `lib`, so the published artefact is checked separately:
  `npm run validate-package -w @its/glowup-ui` (a CI step) validates the tarball's manifest
  and types statically, and `examples/consumer` exercises the published package at runtime
  (its own CI workflow, `consumer-smoke.yml`, chains off Release, so it runs on every push to
  master, plus weekly and on demand — never on a PR, which cannot change what is already
  published). Run validate-package
  after touching `package.json`, the export map or anything a `.d.ts` imports.
- **The form store lives outside React state.** `internal/formStore.ts` holds values, errors and
  the dirty / touched / submitting flags, and each field subscribes to its own slice (`useSlice`
  in `Form.tsx`). Never mirror a value in component state or in the `Form` context's value: a
  keystroke must re-render its own field and nothing else (`form-engine.test.tsx` counts the
  renders, one in a hundred fields).
- **`useId()` must not reach native output.** The playground's "compiles to the same screen" test
  (`examples.test.tsx`) renders an example twice and compares the JSON, and two instances never
  share an id. Ids go on the web only, as in `Tree` (`id={isWeb ? id : undefined}`).
- **The QR encoder is the library's own** (`internal/qr.ts`): no encoder dependency, and not to be
  swapped for one (it draws with `react-native-svg`, a peer the library already has). It is held to reference encoders' matrices in `__tests__/__fixtures__/qr-vectors.json`;
  "it still scans" is not a test.
- **`copy`, `save` and `onPick` are adapters because the library depends on no native module.**
  The app brings `expo-clipboard`, `expo-file-system` or a picker; web has a default, and on native
  a trigger is drawn only when the app passed one. Don't import an Expo module to give it a default.
- **Tests** live in `src/__tests__` (jest-expo). `babel.config.js` exists only for jest (`bob build`
  has its own config). It needed `lazyImports: true` while the barrel re-exported the drawer
  navigator, because the eager transform pulled `@react-navigation/drawer` → reanimated →
  `react-native-worklets` into every test run and its native initialisers throw under jest. Since
  `0.5.0` removed the navigators, the plain preset works — don't reintroduce a dependency that
  brings it back.

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

Colour sets live in `providers/palettes.ts`: `palettes` is the baseline, the two hand-authored
brand sets `databeasy` and `inxpire` (`providers/brandPalettes.ts`, written out literally, never derived
or adjusted) and the nineteen named Material hues, each built by `createPalette(seed)`;
`useTheme().setPalette()` swaps them live. A palette can also carry an optional `typography`
(per-variant overrides merged over `theme.json`'s scale) and `iconSet` (`"eva"` draws the Eva
glyphs vendored in `providers/evaIcons.ts`, mapped from the Material names; unmapped names stay
Material). The brand sets use both — Roboto for `databeasy`, Geist and Eva for `inxpire` — so every
component draws icons through `components/Glyph.tsx`, never `@expo/vector-icons` directly. The
library only _names_ a font (expo-font stays the app's job: the playground's
`site/usePaletteFonts.ts`).
The tone math is in `providers/tonal.ts`, internal and not re-exported from the barrel.
The status roles (`success`, `warning`, `info`, `neutral`, four tokens each) live in `theme.json` like `error`:
fixed hues kept off the seed, identical in every palette, which `createPalette` and the brand sets
take from there rather than author.

`useTheme()` exposes `{ theme, toggleTheme }`; `getStateColor()` and `getGlowStyles()` are
exported for building theme-reactive components. The theme follows the OS color scheme and
supports a manual toggle.

## Providers

- `ThemeProvider` — Material You theme derived from `theme.json` (see above). It also provides
  `onInteractionFeedback` through its own context (`providers/InteractionFeedback.tsx`): a
  stable `emit` reading the latest handler from a ref, so an inline handler re-renders nothing
  and stays out of the theme's value. A control that reports feedback takes `feedback?: boolean`
  (default true), calls `useInteractionFeedback(feedback)` and emits **before** its handler,
  only on a press that does something. The library plays no haptic itself and must not depend on
  a haptics module: `@its/glowup-device/haptics` is wired in by the app.
- `AlertProvider` — cross-platform alert: native `Alert.alert` on iOS/Android, custom `Dialog` on
  web. Call the `Alert(title, message, buttons)` singleton; `AlertProvider` wires it up
  (`AlertProviderWrapper` is a deprecated pass-through).
- `ToastProvider` — imperative queued toasts via `useToast()` (`position` sets where they appear).
