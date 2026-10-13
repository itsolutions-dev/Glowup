# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

An **npm-workspaces monorepo** with four workspaces:

| Workspace                | Package                     | Role                                                                                  |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------------------- |
| `packages/ui`            | `@its/glowup-ui`            | The product: a publishable Material You (MD3) component library.                      |
| `packages/notifications` | `@its/glowup-notifications` | Publishable headless push notification layer over `expo-notifications`.               |
| `packages/device`        | `@its/glowup-device`        | Publishable headless device hardware (location, camera, device info) behind adapters. |
| `apps/playground`        | `@its/glowup-playground`    | Private Expo presentation app that demos and exercises the library.                   |

Plus one directory that is **not** a workspace: `examples/consumer`, an Expo app that installs
`@its/glowup-ui` and `@its/glowup-device` **from the npm registry** and is the runtime check on
the published artefacts (the playground, being a workspace, always runs the local source).
Never add it to the `workspaces` array — npm would link the local packages and the check would
silently test nothing; its CI job fails if either is a symlink in its `node_modules`. See
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
npm run build          # build the published packages with react-native-builder-bob

npm test -w @its/glowup-ui                    # only the library's component tests
npm test -w @its/glowup-notifications         # only the notifications package's tests
npm test -w @its/glowup-device                # only the device package's tests
npm run validate-package -w @its/glowup-ui    # publint + are-the-types-wrong on the built package
npm run release                           # changeset publish (CI does this)
npm run push:test -- <subscription.json>  # send a test Web Push (VAPID pair in .env.vapid.local)

# The documentation site (apps/playground)
npm run docgen -w @its/glowup-playground      # regenerate the prop tables from the library source
npm run variants -w @its/glowup-playground    # regenerate the variant galleries from .design-sync/previews
npm run icons -w @its/glowup-playground       # redraw the icon set from theme.json
npm run export:web -w @its/glowup-playground  # static export to apps/playground/dist
```

Both generators write committed files and CI fails on a diff, so run them after touching a
component's props or a preview.

## Dependencies

- `package-lock.json` is **committed**. CI, Pages and Release install with
  `npm ci --ignore-scripts`; after editing any manifest run `npm install` and commit the
  lockfile with it. Nothing in the tree needs an install script. (`examples/consumer` is the
  exception: it has no lockfile on purpose, see its README.)
- The Expo SDK owns the native versions (`node_modules/expo/bundledNativeModules.json`).
  Upgrade them together, never one by one, and do not follow `npm outdated`'s "latest" for
  them: a lone react-native or reanimated bump builds on no device.
- `apps/playground` lists `react-native-reanimated`, `react-native-worklets` and
  `react-native-gesture-handler` although it imports none of them. They are **pins**:
  expo-router depends on them, and without a direct dependency npm resolves releases outside
  the SDK (reanimated 4.7 + worklets 0.13, which expo-modules-core rejects). Keep them.
- Held back on purpose: TypeScript 7 (no JS API; typescript-eslint supports < 6.1), ESLint 10
  (eslint-plugin-import / eslint-plugin-react), Jest 30 (jest-expo depends on 29).

## The library/app boundary

This is the rule that keeps the split real:

- The app imports the library **only by package name**: `import { Button } from "@its/glowup-ui"`.
  Deep imports (`@its/glowup-ui/src/...`) and paths into `packages/ui` are an **ESLint error**.
- The library must never import the app — also an ESLint error.
- Inside a workspace, use **relative** imports. There is no root-relative `baseUrl` mapping
  any more; `import Button from "components/Button"` no longer resolves anywhere.
- `apps/playground/tsconfig.json` maps `@its/glowup-ui` to `packages/ui/src/index.ts`,
  `@its/glowup-notifications` to `packages/notifications/src/index.ts`, and
  `@its/glowup-device` plus each of its public subpaths (`/info`, `/location`, `/camera`,
  `/network`, `/battery`, `/keep-awake`, `/orientation`, `/haptics`, `/testing`) to their `src` entry, so an edit in any package is picked up live by Metro and
  `tsc`. Those are the only mappings; a new device subpath needs its own.

`packages/notifications` is independent of `packages/ui`: neither imports the other (ESLint
error), so each can ship alone and the app wires them together. `packages/device` follows the
same rule towards both: it imports neither, and neither imports it.

Rules that apply only inside one workspace live in `packages/ui/CLAUDE.md`,
`packages/notifications/CLAUDE.md`, `packages/device/CLAUDE.md` and `apps/playground/CLAUDE.md`, which load when you work under those folders.

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

## Releasing

Changesets. `@its/glowup-ui`, `@its/glowup-notifications` and `@its/glowup-device` are
published (versioned independently); `@its/glowup-playground` is private and ignored. A
user-visible change to any of them needs a changeset (`npx changeset`). Each package needs its
own trusted publisher on npmjs.com (see `release.yml`). On push to `master`,
`release.yml` opens a "Version Packages" PR; merging it publishes to npm.

## Code style

- Prettier: `trailingComma: "all"`, `endOfLine: "lf"`; ESLint enforces `linebreak-style: unix`.
  `.gitattributes` (`* text=auto eol=lf`) is the source of truth, so every checkout gets LF
  regardless of `core.autocrlf`. `npm run lint` gates CI.
- Icons: `@expo/vector-icons/MaterialCommunityIcons` — icon names are kebab-case strings;
  outline variants append `-outline`.
