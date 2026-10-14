# Glowup

A **Material You (Material Design 3)** UI component library for **React Native + Web**, built
with Expo, two headless packages for what an app needs beside its UI (**push notifications**
and **device hardware**), and a presentation app that showcases and exercises all of them.

**→ [Live documentation and component gallery](https://itsolutions-dev.github.io/Glowup/)** —
every component on its own page, with a live demo, its variants and a generated API reference,
plus live pages for notifications and every device capability.

The repo is an **npm-workspaces monorepo** with four workspaces:

| Workspace                | Package                     | What it is                                                                                                                                    |
| ------------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui`            | `@its/glowup-ui`            | The publishable component library (this is the product).                                                                                      |
| `packages/notifications` | `@its/glowup-notifications` | Publishable headless push notifications over `expo-notifications`: permissions, tokens, taps, channels, Web Push.                             |
| `packages/device`        | `@its/glowup-device`        | Publishable headless device hardware: location, camera, network, battery, orientation, haptics, biometrics, secure storage, sensors and more. |
| `apps/playground`        | `@its/glowup-playground`    | Private Expo app that demos the packages on iOS, Android and Web, and exports to the static documentation site.                               |

One directory is deliberately **not** a workspace: `examples/consumer` installs
`@its/glowup-ui` and `@its/glowup-device` from the npm registry and is the runtime check on the
published packages — see [`examples/consumer/README.md`](examples/consumer/README.md).

> The playground was previously called `apps/mobile`. It was renamed because it is **not
> mobile-only** — it runs on web too — and its job is to exercise the library, not to be a
> shippable mobile product.

## Quick start

```bash
npm install        # install all workspaces (run once, from the repo root)
npm start          # start the playground (Expo dev server) — no need to cd anywhere
```

`npm start` at the repo root launches the playground and opens on the site's **overview**;
`/components` is the reference. Platform shortcuts, all runnable from the root:

```bash
npm run playground   # same as npm start
npm run android      # open on Android
npm run ios          # open on iOS
npm run web          # open in the browser
```

Each of these proxies into the `@its/glowup-playground` workspace, so you never have to
`cd apps/playground` yourself.

## The packages

The three packages are published and versioned independently, and none imports another
(ESLint enforces it): an app installs only what it uses and wires them together itself — for
example, `@its/glowup-device`'s `hapticFeedback` plugs into `@its/glowup-ui`'s
`ThemeProvider onInteractionFeedback`.

### `@its/glowup-ui` — the component library

`packages/ui/src` is the published source; its public surface is the barrel `src/index.ts`.
The library's own README carries the installation instructions, the layout of the source and
the **full component reference** (every component, its props and a usage snippet):

- [`packages/ui/README.md`](packages/ui/README.md) — installation, usage, component reference
- [`packages/ui/src/components/components.md`](packages/ui/src/components/components.md) —
  authoritative per-component spec with every prop default
- [`packages/ui/CHANGELOG.md`](packages/ui/CHANGELOG.md) — release notes

### `@its/glowup-notifications` — push notifications

Headless and built on `expo-notifications`: it renders nothing and knows no navigator or
backend. It covers the parts every app writes again:

- permission state and request (provisional on iOS), push token fetched once allowed;
- what to show while the app is in the foreground, and taps — including the one that launched
  the app;
- local notifications, notification actions, badge and delivered notifications;
- Android channels and typed payloads;
- **Web Push** with a VAPID key (`npm run push:test` sends a test push from the repo);
- `/testing`, an in-memory `expo-notifications` for the app's own tests.

See [`packages/notifications/README.md`](packages/notifications/README.md) and its
[`CHANGELOG.md`](packages/notifications/CHANGELOG.md).

### `@its/glowup-device` — device hardware

One subpath per capability, each behind an **adapter** the app can replace through
`DeviceAdaptersProvider`. Every capability's Expo module is an **optional** peer: import a
subpath and you install only its modules — an app that reads device info never installs
`expo-camera`.

| Subpath         | What it does                                                                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/info`         | Model, OS, device type and app version.                                                                                                                                                            |
| `/location`     | Permission, current position and position watching; no read ever prompts.                                                                                                                          |
| `/camera`       | `CameraView` for photos, video and barcode / QR scanning, with camera and microphone permissions.                                                                                                  |
| `/network`      | Connection type and online state (`useIsOnline`).                                                                                                                                                  |
| `/battery`      | Level, charging state and Low Power Mode.                                                                                                                                                          |
| `/keep-awake`   | Keeps the screen on while a component is mounted (Screen Wake Lock on web).                                                                                                                        |
| `/orientation`  | Interface orientation and stacked orientation locks.                                                                                                                                               |
| `/haptics`      | Haptic feedback, and `hapticFeedback` for `@its/glowup-ui`'s `ThemeProvider`.                                                                                                                      |
| `/biometrics`   | Face ID / Touch ID / fingerprint authentication, and `useAppLock` to lock the app after it has been in the background.                                                                             |
| `/secure-store` | Keychain / Keystore values (`useSecureStore`, `useSecureValue`) and protected items that need biometrics to read.                                                                                  |
| `/sensors`      | Accelerometer, gyroscope, magnetometer, barometer, light sensor and device motion, normalised to SI units on every platform; physical orientation (`useDeviceOrientation`); the motion permission. |
| `/testing`      | In-memory adapters for every capability, so tests never mock Expo modules.                                                                                                                         |

The package also ships a **config plugin** (`"@its/glowup-device"` in `app.config.ts`) that
sets each listed capability's purpose strings and Android permissions, and nothing for the
capabilities you do not list. Every hook is safe in the static web export (server snapshots,
no browser globals at module scope).

See [`packages/device/README.md`](packages/device/README.md) for the API of every capability,
[`packages/device/CHANGELOG.md`](packages/device/CHANGELOG.md), and
[`docs/device-package-plan.md`](docs/device-package-plan.md) for the design and its trade-offs.

## What's in `apps/playground`

The presentation app: a private Expo app whose only job is to exercise the packages on iOS,
Android and web. It consumes them through their package names, exactly as an external
consumer would.

```
apps/playground/
├── app/               # expo-router routes — overview, getting started, theming,
│                      #   templates, /components and /components/[name],
│                      #   /notifications and /device/* (one page per capability)
├── site/              # the site's shell: breakpoints, navigation, page scaffold,
│                      #   code block, props table, prop controls, permission panels
├── catalogue/         # the gallery's data: component registry, categories, demos,
│                      #   snippet builder and the generated variant galleries
├── docgen/            # prop tables extracted from the library's TypeScript
├── __tests__/         # catalogue coverage test (the packages' own tests live in packages/*)
├── scripts/           # draws the icon set from the theme's colours
├── assets/            # generated app icons + splash
├── public/            # copied to the export root (og-image.png)
├── app.config.ts      # Expo config and plugins; web output is "static", base path from env
└── metro.config.js    # monorepo-aware Metro (watches repo root, resolves the packages from source)
```

The site is English only. Every route is a real URL, prerendered to its own HTML file with its
own title, meta description and share card. ⌘/Ctrl+K opens a command palette over the whole
catalogue; `[` and `]` step through it; `?` lists the rest. A component page carries a live demo with a width selector, generated controls,
a copyable snippet, the curated variant gallery and the API reference — the last two generated
from the library source and from `.design-sync/previews`, both committed and checked by CI.
The notifications and device pages run the real hooks on the device or in the browser.

The app deliberately contains no product code: no API clients, auth or domain models. If a
screen needs something reusable, it belongs in one of the packages.

## Root scripts

```bash
npm start / npm run playground   # run the playground app
npm run android | ios | web      # run the playground on a platform
npm run lint                     # ESLint across the repo
npm run type-check               # tsc --noEmit across all workspaces
npm test                         # tests across all workspaces
npm run build                    # build the three published packages (react-native-builder-bob)
npm run release                  # publish the packages (changeset publish; CI does this)
npm run push:test -- <subscription.json>   # send a test Web Push (VAPID pair in .env.vapid.local)

npm run docgen -w @its/glowup-playground      # regenerate the prop tables from the library source
npm run variants -w @its/glowup-playground    # regenerate the variant galleries
npm run icons -w @its/glowup-playground       # redraw the icon set from theme.json
npm run export:web -w @its/glowup-playground  # static export of the docs site

npm test -w @its/glowup-ui                    # only the library's component tests
npm test -w @its/glowup-notifications         # only the notifications package's tests
npm test -w @its/glowup-device                # only the device package's tests
npm run validate-package -w @its/glowup-ui    # publint + are-the-types-wrong on a built package
                                              #   (same script in the other two packages)
```

## The documentation site

Published at **<https://itsolutions-dev.github.io/Glowup/>**.

`apps/playground` is exported to static HTML and deployed to GitHub Pages by
`.github/workflows/pages.yml` on every push to `master`. Pages serves a project site from a
subpath, so the workflow passes the repository name as `GLOWUP_BASE_URL`; locally the variable
is unset and the site serves from the root.

```bash
npm run export:web -w @its/glowup-playground             # → apps/playground/dist
GLOWUP_BASE_URL=/Glowup npm run export:web -w @its/glowup-playground   # as Pages serves it
```

Enable it once in the repository: **Settings → Pages → Build and deployment → Source: GitHub
Actions**. Pages on a private repository requires GitHub Enterprise Cloud.

## Releasing the packages

Versioning and publishing use [Changesets](https://github.com/changesets/changesets).
`@its/glowup-ui`, `@its/glowup-notifications` and `@its/glowup-device` are published and
versioned independently; `@its/glowup-playground` is private and ignored. A user-visible change
to a package needs a changeset (`npx changeset`). On push to `master`,
`.github/workflows/release.yml` opens a "Version Packages" PR; merging it publishes to npm
through trusted publishing (no npm token). See `.changeset/README.md` for details.

## Conventions

- **Imports**: inside a workspace use relative paths; the app reaches the packages only by
  name — `import { Button } from "@its/glowup-ui"`, `import { useBattery } from
"@its/glowup-device/battery"`. Deep imports (`@its/glowup-ui/src/...`, or a path into
  `packages/*`) are a lint error, as is any import of the app from a package or of one package
  from another.
- **Line endings are LF**, enforced by `.gitattributes` (`* text=auto eol=lf`), Prettier
  (`endOfLine: "lf"`) and ESLint (`linebreak-style: unix`).
- Prettier `trailingComma: "all"`.
- Icons: `@expo/vector-icons/MaterialCommunityIcons`, kebab-case names, `-outline` suffix for
  outline variants.
- Tests: each package tests itself (`npm test -w <package>`); the playground only tests the
  playground.
