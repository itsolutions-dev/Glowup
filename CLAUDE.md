# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

An **npm-workspaces monorepo** with nine workspaces:

| Workspace                    | Package                     | Role                                                                                                                                    |
| ---------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui`                | `@its/glowup-ui`            | The product: a publishable Material You (MD3) component library.                                                                        |
| `packages/notifications`     | `@its/glowup-notifications` | Publishable headless push notification layer over `expo-notifications`.                                                                 |
| `packages/device`            | `@its/glowup-device`        | Publishable headless device hardware (location, camera, network, biometrics, sensors…) behind adapters.                                 |
| `apps/playground`            | `@its/glowup-playground`    | Private Expo presentation app that demos and exercises the library.                                                                     |
| `packages/rfid-honeywell`    | `@its/rfid-honeywell`       | Publishable Honeywell RFID readers behind `@its/glowup-device/rfid`: Android Expo module, adapter, config plugin.                       |
| `packages/rfid-zebra`        | `@its/rfid-zebra`           | Zebra RFID readers (RFD40 Premium) behind `@its/glowup-device/rfid`, same shape. Private until phase Z2.                                |
| `packages/scanner-honeywell` | `@its/scanner-honeywell`    | Publishable Honeywell barcode scanners (the CT40's imager) behind `@its/glowup-device/scanner` (Data Collection SDK), same shape.       |
| `packages/scanner-zebra`     | `@its/scanner-zebra`        | Publishable Zebra barcode scanners (the TC22's imager) behind `@its/glowup-device/scanner`, through DataWedge's intents: no SDK.        |
| `apps/rfid-diagnostics`      | `@its/rfid-diagnostics`     | Private Android development build that runs the RFID and barcode scanner spikes on real hardware, one vendor per build (`RFID_VENDOR`). |

Plus one directory that is **not** a workspace: `examples/consumer`, an Expo app that installs
`@its/glowup-ui`, `@its/glowup-device`, `@its/rfid-honeywell` and `@its/scanner-honeywell` **from the npm registry** and is
the runtime check on the published artefacts (the playground, being a workspace, always runs the
local source). Never add it to the `workspaces` array — npm would link the local packages and the
check would silently test nothing; its CI job fails if any of them is a symlink in its
`node_modules`. See
`examples/consumer/README.md`.

The library targets iOS, Android and Web through Expo + `react-native-web`. The playground is
not a shippable product and holds no product code (no API clients, auth or domain models) —
if something reusable is needed, it belongs in `packages/ui`.

## Commands

```bash
npm install            # all workspaces, from the repo root

npm start              # Expo dev server for the playground
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
npm test -w @its/rfid-honeywell               # only the Honeywell RFID package's tests
npm test -w @its/rfid-zebra                   # only the Zebra RFID package's tests
npm test -w @its/scanner-honeywell            # only the Honeywell barcode scanner package's tests
npm test -w @its/scanner-zebra                # only the Zebra barcode scanner package's tests
npm run validate-package -w @its/glowup-ui    # publint + are-the-types-wrong on the built package
npm run release                           # changeset publish (CI does this)
npm run push:test -- <subscription.json>  # send a test Web Push (VAPID pair in .env.vapid.local)
npm run packed -w @its/rfid-diagnostics -- <dir>  # the RFID diagnostics app on the packed tarballs, outside the repo

# The documentation site (apps/playground)
npm run docgen -w @its/glowup-playground      # regenerate the prop tables from the library source
npm run variants -w @its/glowup-playground    # regenerate the variant galleries from .design-sync/previews
npm run templates -w @its/glowup-playground   # re-embed the templates' source after editing one
npm run icons -w @its/glowup-playground       # redraw the icon set from theme.json
npm run export:web -w @its/glowup-playground  # static export to apps/playground/dist
```

These generators write committed files and CI fails on a diff (the templates' through
their test), so run them after touching a component's props, a preview or a template.

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
  `/network`, `/battery`, `/keep-awake`, `/orientation`, `/haptics`, `/biometrics`, `/secure-store`, `/sensors`, `/media-picker`, `/media-library`, `/background-location`, `/bluetooth`, `/rfid`, `/scanner`, `/testing`) to their `src` entry, so an edit in any package is picked up live by Metro and
  `tsc`. Those are the only mappings; a new device subpath needs its own.

`packages/notifications` is independent of `packages/ui`: neither imports the other (ESLint
error), so each can ship alone and the app wires them together. `packages/device` follows the
same rule towards both: it imports neither, and neither imports it.

RFID vendor packages (`packages/rfid-*`, `@its/rfid-*`) implement `@its/glowup-device/rfid`:
they import only its `/rfid` (and `/testing` in tests), never its root entry, and the device
package never imports them (all ESLint errors). Barcode scanner vendor packages
(`packages/scanner-*`, `@its/scanner-*`) follow the same rules with `/scanner`. Their `tsconfig.json` and Jest map those two
subpaths to the device package's `src`, since CI type-checks and tests before it builds. The
vendors' SDKs they wrap **never enter the repository**: Honeywell's licence lets it travel only
inside an app's build, and Zebra's comes from its support portal, not a public repository
(`.gitignore` blocks `honeywell_rfid_sdk*.aar`, `DataCollection*.aar`, `rfidapi3*.aar` and
Zebra's Scanner SDK, `barcode_scanner_library*.aar`, which no package uses). `@its/scanner-zebra`
wraps no SDK: it drives DataWedge, Zebra's scanning service, through intents. `apps/rfid-diagnostics/tsconfig.json` maps `@its/glowup-device`,
its `/rfid`, `/scanner` and `/testing`, `@its/rfid-honeywell`, `@its/rfid-zebra`, `@its/scanner-honeywell` and `@its/scanner-zebra` to their `src`, as the
playground does. The diagnostics app depends on every vendor; its `app.config.ts` applies the
`RFID_VENDOR` vendor's plugins (Honeywell's RFID and scanner packages, or Zebra's RFID one: its
scanner package has none) and excludes the other vendor's packages from autolinking (a vendor's
module does not build without its SDK).

Rules that apply only inside one workspace live in `packages/ui/CLAUDE.md`,
`packages/notifications/CLAUDE.md`, `packages/device/CLAUDE.md`, `packages/rfid-honeywell/CLAUDE.md`,
`packages/rfid-zebra/CLAUDE.md`, `packages/scanner-honeywell/CLAUDE.md`, `packages/scanner-zebra/CLAUDE.md` and `apps/playground/CLAUDE.md`, which load when you work under those folders.

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

Changesets. `@its/glowup-ui`, `@its/glowup-notifications`, `@its/glowup-device`,
`@its/rfid-honeywell`, `@its/scanner-honeywell` and `@its/scanner-zebra` are published (versioned
independently), each with `publishConfig` (`access: public`, `provenance: true`);
`@its/glowup-playground` and `@its/rfid-diagnostics` are private and ignored; `@its/rfid-zebra`
stays private until its spike on a real RFD40 (phase Z1) is through, as `@its/rfid-honeywell` did,
and as the scanner packages did until their runs on a CT40 (phase C2) and a TC22 (phase ZB2). A
user-visible change to any of them needs a changeset (`npx changeset`). Each package needs its
own trusted publisher on npmjs.com (see `release.yml`). On push to `master`, `release.yml` opens a
"Version Packages" PR; merging it publishes to npm.

## Code style

- Prettier: `trailingComma: "all"`, `endOfLine: "lf"` (ESLint reports it via `eslint-plugin-prettier`).
  `.gitattributes` (`* text=auto eol=lf`) is the source of truth, so every checkout gets LF
  regardless of `core.autocrlf`. `npm run lint` gates CI.
- Icons: `@expo/vector-icons/MaterialCommunityIcons` — icon names are kebab-case strings;
  outline variants append `-outline`.
