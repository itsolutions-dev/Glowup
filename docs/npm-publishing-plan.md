# Plan: Publish the Glowup component library to npm

## 0. Current state (audit)

- This repo is a single Expo app. `components/` (~40 components + 6 sub-folders),
  `providers/ThemeProvider.tsx` + `theme.json`, and `providers/AlertProvider.tsx` form a
  de-facto Material You component library, but they're not packaged — they're just app
  source files.
- All internal imports are **bare, root-relative** (`import Button from "components/Button"`),
  resolved only via `tsconfig.json`'s `baseUrl: "."`. This works for the app's TypeScript
  compiler and Metro (which also honors `baseUrl`), but it will **not** resolve at runtime
  for an external consumer's bundler. This is the single biggest blocker and has to be fixed
  before anything can be published.
- `react-native-paper` is a declared dependency but is not imported anywhere — dead weight,
  worth dropping regardless of this plan.
- `providers/AuthProvider.tsx` and `hooks/useWebAuthn.ts` are app-specific (real API calls,
  token storage) — not library material.
- No build step exists yet: the app runs everything straight from TS source via Metro/Babel.
  A published package needs its own compiled output (CJS/ESM + `.d.ts`).

## 1. Target architecture: npm workspaces monorepo

Convert this repo into an npm-workspaces monorepo rather than splitting into two repos, since
CLAUDE.md already treats this app as "doubling as a component library" — keeping the app
next to the package lets the app dogfood the package on every change.

```
Glowup/
├── apps/
│   └── mobile/              ← current app (App.tsx, screens/, store/, api/, i18n/, AuthProvider…)
├── packages/
│   └── ui/                  ← the publishable package (npm name TBD, e.g. @glowup/ui)
│       ├── src/
│       │   ├── components/  ← moved from components/, minus Navigation glue that's app-specific
│       │   ├── theme/       ← ThemeProvider.tsx, theme.json, getStateColor, getGlowStyles
│       │   ├── AlertProvider.tsx
│       │   └── index.ts     ← single public entry re-exporting everything
│       ├── package.json
│       └── tsconfig.json
├── package.json              ← workspaces root
└── tsconfig.base.json
```

Root `package.json` gains `"workspaces": ["apps/*", "packages/*"]`. The app depends on the
package via `"@glowup/ui": "workspace:*"`, so local development always exercises the exact
code that will be published — no more copy-drift between "the library" and "the app".

**Migration mechanics:** use `git mv` for every relocated file so history is preserved, do it
in one focused commit per logical group (components, theme, providers), and keep the app
building after each step rather than one big-bang move.

## 2. What moves into `packages/ui`, what stays in the app

| Item | Destination | Notes |
|---|---|---|
| `components/*.tsx` (Accordion…Typography) | `packages/ui/src/components/` | Generic M3 components — the core of the library |
| `components/List`, `Modal`, `Progress`, `Tab`, `ToggleButton` | `packages/ui/src/components/` | Same — no app coupling found |
| `components/types.ts` | `packages/ui/src/` | Shared prop/type helpers |
| `providers/ThemeProvider.tsx`, `theme.json` | `packages/ui/src/theme/` | Design-system core; `Theme` type becomes the package's main export |
| `providers/AlertProvider.tsx` | `packages/ui/src/` | Cross-platform alert, no app coupling |
| `components/Navigation/DrawerNavigation.tsx`, `StackNavigation.tsx`, `DrawerContent.tsx` | `packages/ui/src/components/Navigation/` | Keep, but audit: they take a `routes` prop array already, so they're reusable — just double-check nothing hardcodes app route names |
| `components/Navigation/Route.ts`, `User.ts` | `packages/ui/src/components/Navigation/` | Generic types, fine to ship |
| `components/LanguageSelector.tsx` | **Needs a decision, see §5 (i18n)** | Currently the only component touching translation infra |
| `providers/AuthProvider.tsx` | Stays in `apps/mobile` | Real endpoints, token storage — app-specific |
| `hooks/useWebAuthn.ts` | Stays in `apps/mobile` | Passkey/biometric flow tied to this app's auth |
| `screens/*`, `store/`, `api/`, `i18n/` (translation JSON) | Stays in `apps/mobile` | App content, not library |
| `screens/Playground.tsx` | Stays in app, but becomes the **library's live demo** — point Storybook/docs at the same component usage (see §6) |
| `common/themes.ts` | Delete | CLAUDE.md already calls this an obsolete duplicate of `theme.json` |
| `react-native-paper` dependency | Remove from root `package.json` | Unused |

## 3. Fix the import problem

Every file in the moved set imports siblings as `import X from "components/X"`. Two options:

- **A — Rewrite to relative imports** (`import X from "./X"` / `"../Button"`) inside
  `packages/ui/src`. Mechanical, one-time codemod (a small ts-morph or jscodeshift script, or
  even careful `sed` given the naming is consistent), verified by `tsc --noEmit` afterward.
- **B — Keep root-relative imports and rely on the bundler config** to resolve them even
  post-publish. Rejected: this leaks a `baseUrl`-style requirement onto every consumer's
  Metro/webpack config, which is fragile and non-standard for a published package.

**Recommendation: A.** Do the rewrite as its own commit, immediately after the `git mv`, so
`tsc --noEmit` is the only thing gating it — no logic changes bundled in.

## 4. Package tooling

Use **`react-native-builder-bob`** to build `packages/ui` — it's the standard for RN
component libraries (used by react-native-paper, gluestack, etc.), and produces:

- `lib/commonjs/` and `lib/module/` (ESM) output
- `lib/typescript/` (`.d.ts`)
- A `src` field for Metro-based consumers (Expo/RN apps resolve straight to source with better
  Fast Refresh, falling back to compiled output for other bundlers)

`packages/ui/package.json` sketch:

```jsonc
{
  "name": "@glowup/ui",
  "version": "0.1.0",
  "main": "lib/commonjs/index.js",
  "module": "lib/module/index.js",
  "types": "lib/typescript/src/index.d.ts",
  "source": "src/index.ts",
  "files": ["lib", "src", "!**/__tests__", "!**/*.test.*"],
  "sideEffects": false,
  "scripts": {
    "prepare": "bob build",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": ">=19",
    "react-native": ">=0.86",
    "@expo/vector-icons": ">=15",
    "react-native-svg": ">=15",
    "react-native-safe-area-context": ">=5",
    "@react-navigation/native": ">=7",
    "@react-navigation/drawer": ">=7",
    "@react-navigation/native-stack": ">=7"
  },
  "devDependencies": {
    "react-native-builder-bob": "^0.x"
  }
}
```

Why peer deps and not bundled dependencies: every one of these (icons, svg, navigation,
safe-area) is a **native module** that must be autolinked once in the consumer's app. If the
library bundled its own copy, consumers would get duplicate-native-module errors. Only pure-JS
helpers with no native surface (e.g. `date-fns`, `polished` if still used) can safely be real
`dependencies`.

Reanimated/gesture-handler: check whether any moved component actually imports them (BottomSheet,
Carousel, SpeedDial are worth double-checking) — if yes, add to peerDependencies too; if the
usage is only inside `apps/mobile`, leave them out of the package entirely.

## 5. Decouple from i18n

`LanguageSelector` and any component calling `useTranslation()`/`t("KEY")` directly assume the
**consumer's** i18next instance already has those exact keys (`UPPER_SNAKE_CASE`) loaded. That's
an invisible contract external consumers won't know about and can't satisfy easily.

Options, cheapest first:
1. **Prop-driven text** — change these components to accept label/text props with sensible
   English defaults, instead of calling `t()` internally. The app keeps its own wrapper that
   passes translated strings in. This is the standard pattern for shared UI libraries and is
   the recommended fix here.
2. If translation must live inside the library, ship the library's own minimal i18n resource
   bundle, namespaced (e.g. `glowup-ui:ADD`) so it can't collide with consumer keys.

Do this audit (`grep -rn "useTranslation\|t(\"" packages/ui/src`) before the first publish —
it's a small number of components based on the current codebase.

## 6. Docs / demo

`screens/Playground.tsx` already exercises the components — reuse it rather than building docs
from scratch:
- Short term: keep Playground in `apps/mobile`, link to it from the package README as "run the
  example app to see every component."
- Better, if time allows: add `packages/ui/example/` (a minimal Expo app scaffolded with
  `create-expo-app`, depending on the workspace package) so `npm pack`/publish can be smoke-tested
  in isolation from the full `apps/mobile` app. This is also what most RN library templates
  (`create-react-native-library`) generate by default — worth considering as the scaffold tool
  instead of hand-assembling `packages/ui`.
- Optional: adopt Storybook (`@storybook/react-native`) later once the API is stable; not a
  blocker for v0.1.0.

## 7. Versioning & CI

- Add **Changesets** (`@changesets/cli`) at the repo root for semver-aware, changelog-generating
  releases of `@glowup/ui` — standard for monorepos with one publishable package.
- GitHub Actions:
  - `ci.yml`: on every PR/push — `npm ci`, `npm run lint`, `npm run type-check`, `npm test`
    (root + workspaces), `npm run build -w packages/ui`.
  - `release.yml`: on push to `master` — run `changesets/action`, which opens/updates a
    "Version Packages" PR and, once merged, publishes to npm and tags the release. Requires an
    `NPM_TOKEN` repo secret.
- Decide the npm scope now (e.g. `@glowup` or `@itsolutions-dev`) — verify availability on
  npmjs.com and reserve it before wiring the workflow.

## 8. Phased rollout

1. **Scaffold** — add npm workspaces, create `apps/mobile` + `packages/ui` skeletons, move
   `App.tsx`/`index.ts`/screens/etc. into `apps/mobile` with zero other changes; confirm
   `npm start` still works from the new location.
2. **Migrate components** — `git mv` components/providers per the table in §2 into
   `packages/ui/src`; keep the app importing them via a temporary relative path if needed to
   land this step without breaking the app.
3. **Fix imports & wire the workspace dependency** — apply the relative-import codemod (§3),
   add `"@glowup/ui": "workspace:*"` to `apps/mobile/package.json`, update app imports to
   `import { Button } from "@glowup/ui"`, delete the now-unused root `components`/`providers`
   duplicates.
4. **Build tooling** — add `react-native-builder-bob`, get `npm run build -w packages/ui`
   producing `lib/`, get `tsc --noEmit` clean across both workspaces.
5. **i18n decoupling** — apply §5 to `LanguageSelector` (and any other offenders found by the
   grep).
6. **CI + versioning** — add lint/type-check/test/build workflow, add Changesets, do a dry-run
   `npm publish --dry-run` from `packages/ui`.
7. **First release** — reserve the npm scope, add `NPM_TOKEN`, merge the first Changesets
   "Version Packages" PR → publishes `@glowup/ui@0.1.0`.
8. **Iterate** — every component change now goes through the workspace package; app development
   and library development are the same activity going forward.

## 9. Open decisions for you

- **Package name / npm scope** — pick and confirm availability.
- **Navigation components in or out** — `DrawerNavigation`/`StackNavigation` pull in
  `@react-navigation/*` as peer deps; if you'd rather keep the library navigation-agnostic,
  they can stay app-side instead (moved to `apps/mobile/components/Navigation`).
- **Example app vs. reusing Playground** — worth the extra scaffold now, or defer to a later
  release once the API has stabilized?
