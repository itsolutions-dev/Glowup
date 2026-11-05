# packages/charts — the charts package

Plan and decisions: `docs/charts-package-plan.md` (it changes D7 of `docs/solaris-native.md`). Read it before adding anything.

- **No third-party dependency in `package.json`.** Charts are drawn with `react-native-svg` (a peer, already one of the
  library's). Scales and shapes are **d3 source copied into `src/vendor/d3/`** (ISC licence: each package keeps its `LICENSE` file next to its code,
  versions and wanted differences in `docs/charts-upstream.md`). Do not add `d3-*`, `victory`, `recharts`, Skia or `visx`
  to the manifest. Update the copy by hand and rarely, and write the change in `docs/charts-upstream.md`.
- **`src/vendor` is JavaScript as it came.** It is excluded from Prettier and ESLint; edit it only for a difference listed in
  `docs/charts-upstream.md`. A hand-written `index.d.ts` types what we use. The package's public API never exposes d3's
  types: `src/core/` wraps them in typed functions of ours.
- **Sits on top of the library.** It may import `@its/glowup-ui`, **by package name only**. It imports neither
  `@its/glowup-device` nor `@its/glowup-notifications` nor another high-level package (`pdf`, `pivot`), and nothing below it
  imports it. ESLint enforces all of it (`ADDON_PACKAGES` in the root `eslint.config.js`).
- **Colours come from theme tokens, never written by hand.** Series take `theme.charts.categorical` (28/10, validated
  with the `dataviz` skill's script against the light and dark surfaces of every palette) and every chart accepts `colors`.
- **Private until ready.** `changeset publish` publishes any non-private package whose version is not on npm yet, so this one
  stays `"private": true` until its first release (it also needs its own trusted publisher on npmjs.com, see `release.yml`).
- **Type-check and tests read the library's source** (`paths` in `tsconfig.json`): CI runs both before the build, and
  `packages/ui/lib` is build output. `tsconfig.build.json` clears the mapping so the declarations name the package.
- **Documentation.** The prop tables of `apps/playground` are generated from `packages/ui` only; this package's props are
  documented by hand (README) until the generator covers it.
- **Tests use `await` on every `fireEvent`**: this version of Testing Library is asynchronous, and an unawaited event overlaps
  `act()` and poisons the tests after it.
