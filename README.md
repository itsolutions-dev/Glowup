# Glowup

A **Material You (Material Design 3)** UI component library for **React Native + Web**, built
with Expo, plus a presentation app that showcases and exercises every component.

The repo is an **npm-workspaces monorepo** with two workspaces:

| Workspace         | Package              | What it is                                                       |
| ----------------- | -------------------- | ---------------------------------------------------------------- |
| `packages/ui`     | `@its/glowup-ui`         | The publishable component library (this is the product).         |
| `apps/playground` | `@its/glowup-playground` | Private Expo presentation app that demos the library on iOS, Android and Web. |

> The playground was previously called `apps/mobile`. It was renamed because it is **not
> mobile-only** — it runs on web too — and its job is to exercise the library, not to be a
> shippable mobile product.

## Quick start

```bash
npm install        # install all workspaces (run once, from the repo root)
npm start          # start the playground (Expo dev server) — no need to cd anywhere
```

`npm start` at the repo root launches the playground and opens straight on the **Component
Playground** screen. Platform shortcuts, all runnable from the root:

```bash
npm run playground   # same as npm start
npm run android      # open on Android
npm run ios          # open on iOS
npm run web          # open in the browser
```

Each of these proxies into the `@its/glowup-playground` workspace, so you never have to
`cd apps/playground` yourself.

## The library

`packages/ui/src` is the published source; its public surface is the barrel `src/index.ts`.
The library's own README carries the installation instructions, the layout of the source and
the **full component reference** (every component, its props and a usage snippet):

- [`packages/ui/README.md`](packages/ui/README.md) — installation, usage, component reference
- [`packages/ui/src/components/components.md`](packages/ui/src/components/components.md) —
  authoritative per-component spec with every prop default
- [`packages/ui/CHANGELOG.md`](packages/ui/CHANGELOG.md) — release notes

Nothing outside `packages/ui` may be imported by the library, and the playground reaches it
only through the package name `@its/glowup-ui` — both directions are enforced by ESLint.

## What's in `apps/playground`

The presentation app: a private Expo app whose only job is to exercise `@its/glowup-ui` on iOS,
Android and web. It consumes the library through the package name, exactly as an external
consumer would.

```
apps/playground/
├── App.tsx            # root: ThemeProvider / SafeAreaProvider / AlertProvider / ToastProvider + drawer nav
├── index.ts           # Expo entry (registerRootComponent)
├── screens/
│   ├── Playground.tsx # the gallery shell: category nav, search, live props panel
│   └── Start.tsx      # kitchen-sink page — many components on one scroll
├── catalogue/         # the gallery's data: component registry, categories, demos
├── __tests__/         # catalogue coverage test (the library's own tests live in packages/ui)
├── i18n/              # i18next setup + locale JSON
├── assets/            # icons, splash
├── app.json           # Expo config
└── metro.config.js    # monorepo-aware Metro (watches repo root, resolves @its/glowup-ui from source)
```

The app deliberately contains no product code: no API clients, auth or domain models. If a
screen needs something reusable, it belongs in `packages/ui`.

## Root scripts

```bash
npm start / npm run playground   # run the playground app
npm run android | ios | web      # run the playground on a platform
npm run lint                     # ESLint across the repo
npm run type-check               # tsc --noEmit across all workspaces
npm test                         # tests across all workspaces
npm run build                    # build the @its/glowup-ui library (react-native-builder-bob)
npm run release                  # publish @its/glowup-ui (changeset publish)

npm test -w @its/glowup-ui                    # only the library's component tests
npm run validate-package -w @its/glowup-ui    # publint + are-the-types-wrong on the built package
```

## Releasing the library

Versioning and publishing use [Changesets](https://github.com/changesets/changesets). Only
`@its/glowup-ui` is published; `@its/glowup-playground` is private and ignored. On push to `master`,
`.github/workflows/release.yml` opens a "Version Packages" PR; merging it publishes to npm.
See `.changeset/README.md` for details.

## Conventions

- **Imports**: inside a workspace use relative paths; the app reaches the library only as
  `import { Button } from "@its/glowup-ui"`. Deep imports (`@its/glowup-ui/src/...`, or a path into
  `packages/ui`) are a lint error, as is any import of the app from the library.
- **Line endings are LF**, enforced by `.gitattributes` (`* text=auto eol=lf`), Prettier
  (`endOfLine: "lf"`) and ESLint (`linebreak-style: unix`).
- Prettier `trailingComma: "all"`.
- Icons: `@expo/vector-icons/MaterialCommunityIcons`, kebab-case names, `-outline` suffix for
  outline variants.
- i18n keys are `UPPER_SNAKE_CASE` (e.g. `t("LOGOUT")`).
- Tests: components are tested in `packages/ui` (`npm test -w @its/glowup-ui`); the playground
  only tests the playground.
