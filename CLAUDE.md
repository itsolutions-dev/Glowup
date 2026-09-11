# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

An **npm-workspaces monorepo** with exactly two workspaces:

| Workspace         | Package                  | Role                                                                |
| ----------------- | ------------------------ | ------------------------------------------------------------------- |
| `packages/ui`     | `@its/glowup-ui`         | The product: a publishable Material You (MD3) component library.    |
| `apps/playground` | `@its/glowup-playground` | Private Expo presentation app that demos and exercises the library. |

Plus one directory that is **not** a workspace: `examples/consumer`, an Expo app that installs
`@its/glowup-ui` **from the npm registry** and is the runtime check on the published artefact
(the playground, being a workspace, always runs the local source). Never add it to the
`workspaces` array — npm would link the local package and the check would silently test
nothing; its CI job fails if `node_modules/@its/glowup-ui` is a symlink. See
`examples/consumer/README.md`.

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
npm run build          # build @its/glowup-ui with react-native-builder-bob

npm test -w @its/glowup-ui                    # only the library's component tests
npm run validate-package -w @its/glowup-ui    # publint + are-the-types-wrong on the built package
npm run release                           # changeset publish (CI does this)

# The documentation site (apps/playground)
npm run docgen -w @its/glowup-playground      # regenerate the prop tables from the library source
npm run variants -w @its/glowup-playground    # regenerate the variant galleries from .design-sync/previews
npm run export:web -w @its/glowup-playground  # static export to apps/playground/dist
```

Both generators write committed files and CI fails on a diff, so run them after touching a
component's props or a preview.

## The library/app boundary

This is the rule that keeps the split real:

- The app imports the library **only by package name**: `import { Button } from "@its/glowup-ui"`.
  Deep imports (`@its/glowup-ui/src/...`) and paths into `packages/ui` are an **ESLint error**.
- The library must never import the app — also an ESLint error.
- Inside a workspace, use **relative** imports. There is no root-relative `baseUrl` mapping
  any more; `import Button from "components/Button"` no longer resolves anywhere.
- `apps/playground/tsconfig.json` maps `@its/glowup-ui` to `packages/ui/src/index.ts` so an edit
  in the library is picked up live by Metro and `tsc`. That is the only mapping.

## packages/ui — the library

```
packages/ui/
├── src/
│   ├── index.ts        # the public API barrel; nothing else is public
│   ├── components/     # 84 components (CardParts/, List/, Modal/, Progress/,
│   │                   #   Tab/, ToggleButton/, Layout/, types.ts, *.tsx)
│   ├── components/components.md  # authoritative per-component spec, all prop defaults
│   ├── providers/      # ThemeProvider, AlertProvider, ToastProvider, theme.json
│   └── __tests__/      # the library's own component tests (jest-expo)
├── tsconfig.json       # type-check config (includes the tests)
├── tsconfig.build.json # declaration emit: excludes tests, `types: []`
└── package.json        # bob build → lib/{commonjs,module,typescript}
```

- Anything added under `src/components` must be exported from `src/index.ts` to exist for
  consumers.
- Native dependencies are **peerDependencies** (mostly optional); only `date-fns` and
  `polished` are real dependencies. The library is **navigation-agnostic**: it must never
  depend on `@react-navigation/*`. It ships navigation widgets (`AppBar`, `NavigationBar`,
  `Tabs`, `Breadcrumbs`, `Pagination`, `Stepper`) but no navigator — those live in the app,
  in `apps/playground/navigation/`.
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

The playground is also the **published documentation site**: the same Expo app runs on
device and exports to static HTML for GitHub Pages.

```
apps/playground/
├── app/               # expo-router routes — one file per URL, each prerendered
│   ├── _layout.tsx    # provider chain + SiteShell, mounted for every route
│   ├── index.tsx      # overview
│   ├── getting-started.tsx
│   ├── theming.tsx    # live token reference, read from the running theme
│   ├── templates.tsx  # whole screens composed from the kit
│   ├── +not-found.tsx # exported as 404.html by the deploy workflow
│   └── components/
│       ├── _layout.tsx  # catalogue sidebar (expanded and up) + the page
│       ├── index.tsx    # the catalogue as a filterable grid
│       └── [name].tsx   # one component: demo, controls, snippet, variants, API
├── site/              # the site's own building blocks
│   ├── breakpoints.ts   # M3 window size classes — the ONLY responsive source
│   ├── SiteShell.tsx    # top bar + navigation (scrim drawer / rail / drawer)
│   ├── CatalogueSidebar.tsx, Page.tsx, CodeBlock.tsx, PropsTable.tsx,
│   ├── PropControls.tsx, ErrorBoundary.tsx, propsData.ts, siteNav.ts,
│   └── usePersistentState.ts
├── catalogue/         # the gallery's content
│   ├── types.ts       # PropDefinition, ComponentMetadata, Category
│   ├── categories.ts  # CATEGORIES + FLAT_ORDER + TOTAL_COUNT + CATEGORY_OF
│   ├── registry/      # one module per category, merged into ComponentRegistry
│   ├── ComponentPreview.tsx  # renders the selected entry with the panel's props
│   ├── snippet.ts     # the JSX shown under the stage, built from live props
│   └── variants/      # generate.mjs + generated/ (see below) + manual.ts
├── docgen/            # extract-props.mjs + props.generated.json (see below)
├── __tests__/         # catalogue coverage only
├── navigation/        # DrawerNavigation, StackNavigation, DrawerContent — the
│                      #   app-side example of wiring AppBar into a navigator;
│                      #   shown as a snippet on /templates, not mounted by the
│                      #   site, which draws its own shell
├── i18n/              # i18next setup + locale JSON (app-side; the library is prop-driven)
├── app.config.ts      # reads GLOWUP_BASE_URL; web output is "static"
└── metro.config.js    # monorepo-aware Metro (watches the repo root)
```

### Two generated artefacts, both committed, both checked by CI

- `docgen/props.generated.json` — every exported component's prop table, read from the
  library's TypeScript with ts-morph: name, type as written, optionality, JSDoc, and the
  default taken from the destructuring pattern. `npm run docgen -w @its/glowup-playground`
  regenerates it; CI regenerates and fails on a diff. **Never hand-edit it**, and never
  hand-write a prop table beside it.
- `catalogue/variants/generated/` — the variant galleries, rewritten from
  `.design-sync/previews/*.tsx` (the authored demos) into React Native primitives by
  `catalogue/variants/generate.mjs`. The previews stay in the browser dialect because the
  design-sync converter cannot resolve `react-native`; **edit the preview, then run
  `npm run variants -w @its/glowup-playground`**. Seven previews are excluded by name in the
  generator, each with its reason; hand-written replacements go in `catalogue/variants/manual.ts`,
  which wins over the generated entry for the same component.

Adding a component to the catalogue means: an entry in the right `catalogue/registry/*.ts`
module, its name in the right group in `catalogue/categories.ts`, any special-casing in
`ComponentPreview.tsx`, and its name in the `CATALOGUE` list in
`__tests__/playground-catalogue.test.tsx` — the test pins that list against `FLAT_ORDER`, the
registry and the generated docs, so a component catalogued without a working demo fails there.
It gets its page, its props table and its URL for free.

### Responsive

`site/breakpoints.ts` holds the Material 3 window size classes (compact / medium / expanded /
large / extraLarge) and `useLayout()` is the only way to ask about width. Do not compare
`useWindowDimensions().width` to a number anywhere else: the previous screen switched layout at
960 while the drawer switched at 840, and between the two you got a permanent drawer beside a
layout that still believed it was on a phone.

## Tests

- Component behaviour is tested **in the library**: `packages/ui/src/__tests__` (jest-expo).
  `packages/ui/babel.config.js` exists only for jest (`bob build` has its own config). It
  needed `lazyImports: true` while the barrel re-exported the drawer navigator, because the
  eager transform pulled `@react-navigation/drawer` → reanimated → `react-native-worklets`
  into every test run and its native initialisers throw under jest. Since `0.5.0` removed the
  navigators, the plain preset works — don't reintroduce a dependency that brings it back.
- The playground tests only the playground: it renders every catalogue entry's demo directly
  (no router) and pins the catalogue against the registry, the categories and the generated
  prop tables.

## Publishing the documentation site

`apps/playground` is exported to static HTML (`expo-router` with `output: "static"`) and
deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `master`. Each
route — including all 84 component pages — is prerendered to its own file with its own title
and meta description, so a component URL is shareable and crawlable.

Pages serves a project site from a subpath (`/<repo>/`), so the workflow sets
`GLOWUP_BASE_URL` and `app.config.ts` feeds it to `experiments.baseUrl`. Locally the variable
is unset and the site serves from the root. The workflow also writes `.nojekyll` (Jekyll would
drop `_expo/`, where the bundle lives) and copies `+not-found.html` to `404.html`.

The repository must have Pages enabled with **GitHub Actions** as the source; Pages on a
private repository requires GitHub Enterprise Cloud.

## Releasing

Changesets. Only `@its/glowup-ui` is published; `@its/glowup-playground` is private and ignored. A
user-visible change to the library needs a changeset (`npx changeset`). On push to `master`,
`release.yml` opens a "Version Packages" PR; merging it publishes to npm.

## Code style

- Prettier: `trailingComma: "all"`, `endOfLine: "lf"`; ESLint enforces `linebreak-style: unix`.
  `.gitattributes` (`* text=auto eol=lf`) is the source of truth, so every checkout gets LF
  regardless of `core.autocrlf`. `npm run lint` gates CI.
- Icons: `@expo/vector-icons/MaterialCommunityIcons` — icon names are kebab-case strings;
  outline variants append `-outline`.
- i18n keys are UPPER_SNAKE_CASE (e.g. `t("ADD")`, `t("LOGOUT")`) and live in the app only.
