# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

An **npm-workspaces monorepo** with exactly two workspaces:

| Workspace         | Package              | Role                                                                 |
| ----------------- | -------------------- | -------------------------------------------------------------------- |
| `packages/ui`     | `@glowup/ui`         | The product: a publishable Material You (MD3) component library.     |
| `apps/playground` | `@glowup/playground` | Private Expo presentation app that demos and exercises the library.  |

The library targets iOS, Android and Web through Expo + `react-native-web`. The playground is
not a shippable product and holds no product code (no API clients, auth or domain models) —
if something reusable is needed, it belongs in `packages/ui`.

## Commands

```bash
npm install            # all workspaces, from the repo root

npm start              # Expo dev server for the playground (also: npm run playground)
npm run android        # playground on Android
npm run ios            # playground on iOS
npm run web            # playground on Web

npm run lint           # ESLint across the repo (gates CI)
npm run type-check     # tsc --noEmit in every workspace + the design-sync tsconfig
npm test               # tests in every workspace
npm run build          # build @glowup/ui with react-native-builder-bob

npm test -w @glowup/ui                    # only the library's component tests
npm run validate-package -w @glowup/ui    # publint + are-the-types-wrong on the built package
npm run release                           # changeset publish (CI does this)
```

## The library/app boundary

This is the rule that keeps the split real:

- The app imports the library **only by package name**: `import { Button } from "@glowup/ui"`.
  Deep imports (`@glowup/ui/src/...`) and paths into `packages/ui` are an **ESLint error**.
- The library must never import the app — also an ESLint error.
- Inside a workspace, use **relative** imports. There is no root-relative `baseUrl` mapping
  any more; `import Button from "components/Button"` no longer resolves anywhere.
- `apps/playground/tsconfig.json` maps `@glowup/ui` to `packages/ui/src/index.ts` so an edit
  in the library is picked up live by Metro and `tsc`. That is the only mapping.

## packages/ui — the library

```
packages/ui/
├── src/
│   ├── index.ts        # the public API barrel; nothing else is public
│   ├── components/     # ~86 components (CardParts/, List/, Modal/, Navigation/,
│   │                   #   Progress/, Tab/, ToggleButton/, Layout/, types.ts, *.tsx)
│   ├── components/components.md  # authoritative per-component spec, all prop defaults
│   ├── providers/      # ThemeProvider, AlertProvider, ToastProvider, theme.json
│   └── __tests__/      # the library's own component tests (jest-expo)
├── tsconfig.json       # type-check config (includes the tests)
├── tsconfig.build.json # declaration emit: excludes tests, `types: []`
└── package.json        # bob build → lib/{commonjs,module,typescript}
```

- Anything added under `src/components` must be exported from `src/index.ts` to exist for
  consumers.
- Native/navigation dependencies are **peerDependencies** (mostly optional);
  only `date-fns` and `polished` are real dependencies.
- The playground consumes `src`, never `lib`, so the published artefact is checked separately
  by `npm run validate-package -w @glowup/ui` (also a CI step). Run it after touching
  `package.json`, the export map or anything a `.d.ts` imports.

### Theme system

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

`useTheme()` exposes `{ theme, toggleTheme }`; `getStateColor()` and `getGlowStyles()` are
exported for building theme-reactive components. The theme follows the OS color scheme and
supports a manual toggle.

### Providers

- `ThemeProvider` — Material You theme derived from `theme.json` (see above).
- `AlertProvider` — cross-platform alert: native `Alert.alert` on iOS/Android, custom Modal on
  web. Call the `Alert(title, message, buttons)` singleton; mount `AlertProviderWrapper` too.
- `ToastProvider` — imperative queued toasts via `useToast()`.

## apps/playground — the presentation app

```
apps/playground/
├── App.tsx            # ThemeProvider / SafeAreaProvider / AlertProvider / ToastProvider + drawer nav
├── index.ts           # Expo entry (registerRootComponent)
├── screens/
│   ├── Playground.tsx # gallery shell: category nav, search, live props panel, stage chrome
│   └── Start.tsx      # kitchen-sink page
├── catalogue/         # the gallery's content
│   ├── types.ts       # PropDefinition, ComponentMetadata, Category
│   ├── categories.ts  # CATEGORIES + FLAT_ORDER + TOTAL_COUNT + CATEGORY_OF
│   ├── registry/      # one module per category, merged into ComponentRegistry
│   └── ComponentPreview.tsx  # renders the selected entry with the panel's props
├── __tests__/         # catalogue coverage only
├── i18n/              # i18next setup + locale JSON (app-side; the library is prop-driven)
└── metro.config.js    # monorepo-aware Metro (watches the repo root)
```

Adding a component to the catalogue means: an entry in the right `catalogue/registry/*.ts`
module, its name in the right group in `catalogue/categories.ts`, any special-casing in
`ComponentPreview.tsx`, and its name in the `CATALOGUE` list in
`__tests__/playground-catalogue.test.tsx` — the test pins the list against the screen's own
counter, so a component catalogued without a working demo fails there.

`DrawerNavigation` (from the library) is responsive: permanent sidebar at width ≥ 840px,
slide-over below. Routes are the `APP_ROUTES` array in `App.tsx`.

## Tests

- Component behaviour is tested **in the library**: `packages/ui/src/__tests__` (jest-expo).
  `packages/ui/babel.config.js` exists only for jest and must keep `lazyImports: true` — an
  eager transform of the barrel pulls `react-native-worklets` into every test run and throws.
- The playground tests only the playground (catalogue coverage).

## Releasing

Changesets. Only `@glowup/ui` is published; `@glowup/playground` is private and ignored. A
user-visible change to the library needs a changeset (`npx changeset`). On push to `master`,
`release.yml` opens a "Version Packages" PR; merging it publishes to npm.

## Code style

- Prettier: `trailingComma: "all"`, `endOfLine: "lf"`; ESLint enforces `linebreak-style: unix`.
  `.gitattributes` (`* text=auto eol=lf`) is the source of truth, so every checkout gets LF
  regardless of `core.autocrlf`. `npm run lint` gates CI.
- Icons: `@expo/vector-icons/MaterialCommunityIcons` — icon names are kebab-case strings;
  outline variants append `-outline`.
- i18n keys are UPPER_SNAKE_CASE (e.g. `t("ADD")`, `t("LOGOUT")`) and live in the app only.
