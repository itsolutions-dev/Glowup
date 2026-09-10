# Plan: component library separate from the playground

## Why this document exists

The request was "make the components a separate project from the playground: a component
library plus a presentation app". An audit found that the **split already existed** —
`docs/npm-publishing-plan.md` records its execution — and that what was missing was the
work that makes the separation real rather than structural. This document records the audit,
the decisions taken, and the phases executed.

## 0. Audit (verified, not assumed)

The repo was already an npm-workspaces monorepo:

| Workspace         | Package              | State at audit                                                |
| ----------------- | -------------------- | ------------------------------------------------------------- |
| `packages/ui`     | `@glowup/ui` v0.3.0  | 86 exported components + 3 providers, bob build (CJS/ESM/d.ts) |
| `apps/playground` | `@glowup/playground` | Expo app consuming the library, all 86 components demoed       |

`type-check`, `lint`, `test` and `build` were all green. Changesets, CI and a release
workflow were in place. `npm view @glowup/ui` returned **404** — nothing has been published.

The gaps were these:

1. `CLAUDE.md` still described the *pre-migration flat layout* (`App.tsx` at the root,
   `components/`, `common/themes.ts`, root-relative imports via `baseUrl`), so it actively
   guided contributors to write imports that no longer resolve.
2. Nothing enforced the boundary: `apps/playground/tsconfig.json` still carried the flat
   repo's `"*": ["./*"]` mapping, and dead commented-out imports still referenced
   `components/...` and `providers/AlertProvider`.
3. `react-dom` was imported by `DateTimePicker.web.tsx` but declared nowhere — a packaging
   bug for any consumer.
4. The library had **no tests of its own** (`"test": "echo \"no package tests yet\""`); the
   tests that exercise its components lived in the app.
5. The **component reference lived in the root README** (1100 of its 1180 lines). An npm
   consumer of `@glowup/ui` got a 4 KB README that still announced "Status: 0.1.0".
6. Nothing exercised the **published artefact**: the app consumes `packages/ui/src`, so a
   broken export map or `.d.ts` could ship unnoticed.
7. The playground still contained the original product's code — Firestore client, work-order
   model and context, login/password screens, `AuthProvider`, WebAuthn service and hook,
   `.env` with `API_URL` — and its Expo app was still named `ANT`.
8. i18n was dead in the app: `import "./i18n"` sat inside a block comment while `App.tsx`
   and `Start.tsx` called `useTranslation()`, so the UI rendered raw keys (`LOGOUT`).
9. `screens/Playground.tsx` was a 3508-line monolith (it *was* already a per-component
   gallery with search and a live props panel — the problem was file size, not design).

## 1. Decisions

- **Stay a monorepo.** Two repositories would only add the constraint of versioned
  consumption, in exchange for two CI pipelines, local linking, and every cross-cutting
  change split across two PRs. The logical separation — a published package with a public
  API, its own build, versioning and peer deps — is what matters, and it already exists.
  Revisit only if the library gains external contributors.
- **Delete the product leftovers** in the playground rather than keeping them as a demo. The
  presentation app demonstrates the library; product code belongs to the product. History
  keeps them.
- Executed on branch `claude/confident-bardeen-tiok11`.

## 2. Phase 1 — make the boundary real

- `CLAUDE.md` rewritten around the monorepo: the two workspaces, the import rules, the
  library layout, the theme-token guard, where tests live, how releases work.
- Removed the legacy `"*": ["./*"]` and dead `@/*` mappings from
  `apps/playground/tsconfig.json`; `@glowup/ui` → `packages/ui/src/index.ts` is now the only
  path mapping. App-internal imports are relative.
- ESLint now enforces the boundary in both directions (`no-restricted-imports`): the app may
  not deep-import `@glowup/ui/*` or reach into `packages/ui`, and the library may not import
  the app.
- Declared `react-dom` as an optional peer dependency of `@glowup/ui`.
- Re-enabled the i18n initialisation in `App.tsx`, and restored the `ToggleButtonGroup` demo
  in `Start.tsx` that was commented out (as single-select, matching its `value: string`).

## 3. Phase 2 — the library stands on its own

- **Tests moved into the library**: `packages/ui/src/__tests__` (31 tests) with its own
  `jest-expo` config, setup file and devDependencies; `"test": "jest"` replaces the stub.
  `packages/ui/babel.config.js` exists only for jest and must keep `lazyImports: true` — an
  eager transform of the barrel pulls `react-native-worklets` into every test run, whose
  native initialisers throw under jest. The playground keeps only its catalogue test (85).
- **Documentation moved to the package**: the full component reference and the library layout
  now live in `packages/ui/README.md` (72 KB, what npm consumers see); the root README is a
  4.7 KB monorepo guide that points at it. Corrected the stale `0.1.0` status, the CRLF claim
  (the repo is LF), and the root-relative import convention.
- **The published artefact is now validated**: `npm run validate-package -w @glowup/ui` runs
  `publint` + `@arethetypeswrong/cli`, wired into CI after the build step.

  It immediately caught a real bug: the emitted `lib/typescript/providers/ThemeProvider.d.ts`
  imported `./theme.json`, which bob's typescript target does not emit — so consumers'
  `Theme` type failed to resolve (and would have needed `resolveJsonModule` even if it had).
  Fixed by spelling the public token types out (`ThemeColorTokens`, `ThemeSpacingTokens`,
  `ThemeShapeTokens`, `TypographyVariant`) instead of deriving them from the JSON import.
  `theme.json` remains the runtime source of truth, and a type-level guard
  (`_ThemeTokensInSync`) fails `type-check` if the two drift — verified by adding a token and
  watching `tsc` fail. attw is now green on all four resolution modes.

## 4. Phase 3 — the playground becomes a presentation app

- **Removed** `api/`, `models/`, `store/`, `providers/AuthProvider.tsx`, `hooks/useWebAuthn.ts`,
  `services/WebAuthnService.ts`, the login/forgot/change-password screens and `.env`; dropped
  the `axios`, `expo-secure-store` and `@react-navigation/bottom-tabs` dependencies and the
  `expo-secure-store` plugin; `App.tsx` lost the auth stack; the Expo app is now
  `Glowup Playground` (`glowup-playground`) instead of `ANT`.
- **Split the monolith.** `screens/Playground.tsx` went from 3508 to ~760 lines and is now
  only the shell (category nav, search, props panel, stage chrome). The catalogue moved to
  `apps/playground/catalogue/`: `types.ts`, `categories.ts`, `registry/` (one module per
  navigator category, merged into `ComponentRegistry`) and `ComponentPreview.tsx`, which owns
  the demo-only state that used to sit in the screen. The extraction was mechanical and the
  85-test catalogue suite passed unchanged, which is what proves it behaviour-preserving.
- **Evaluated reusing the `.design-sync/previews/` compositions** as the gallery's demo
  source: **rejected.** Those 87 files are browser-only (plain `<div>` and
  `React.CSSProperties`, authored for the Claude Design web pipeline) and carry no prop
  metadata, so they cannot render on native and cannot drive a live props panel. The two
  catalogues serve different targets; the overlap is intentional, not duplication to remove.

## 5. Still open (not code — decisions and secrets)

- **Reserve the `@glowup` npm scope** (or pick another name) and add an `NPM_TOKEN` repo
  secret. Until then `release.yml` cannot publish and `npm view @glowup/ui` stays 404.
- **Navigation components in or out of the library**: `DrawerNavigation` / `StackNavigation`
  pull `@react-navigation/*` in as peers. Keeping them is convenient and already exercised;
  moving them app-side would make the library navigation-agnostic. Unresolved since
  `docs/npm-publishing-plan.md` §9.
- **`publint` suggestions left unapplied** on purpose: `"type": "commonjs"` would make Node
  treat `lib/module/*.js` as CJS (harmless today, since the export map only exposes the CJS
  build, but a trap if the map ever exposes ESM), and `engines.node` is a breaking-ish
  constraint worth choosing deliberately.
