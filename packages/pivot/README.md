# @its/glowup-pivot

Pivot tables for Expo apps, built on `@its/glowup-ui`. The engine is a copy of AuraPivot's (`docs/pivot-upstream.md`); the grid, the
field panel and the rest are written here, a piece at a time. Not published yet (`"private": true`).

Design and plan: `docs/superpowers/specs/2026-10-23-pivot-core-design.md` and `docs/superpowers/specs/2026-10-23-pivot-grid-design.md`. Wider plan: Phase 7 of `docs/solaris-native.md`.

## State

- **Piece 1 (engine only, no screen):** the engine, its options, the localization dictionaries, the hooks and the context are in
  `src/`, with the original's tests running under jest. Checked in jest only; not on a phone (the engine itself ran on Hermes in the
  spike, `docs/spike-0.1-pivot-core.md`).
- **Piece 2 (read-only grid, web):** `PivotGrid` (`engine`, `height`, `localization`) shows the report: header, first two columns kept in view,
  rows and column groups that open and close, rows virtualized, numbers formatted with the engine's locale. `usePivotGrid` and
  `buildGridModel` are exported for other renderers. Checked in jest; looked at in Chrome at 1280 and 390 px; in the iOS and Android app it only says it is not
  available.
- **Piece 3 (the same grid on iOS and Android):** two scrolls, one inside the other, and the header and the column of labels moved by the native animation. Checked in jest, on the local Android emulator (header fixed while the rows scroll, a tap on an arrow after the scroll, scrolling sideways) and by `/native-check` in CI (iPhone, Android 14 and 15): **read the CI screenshots, not only the lines**.
- Not here yet: the field panel, filters, calculated fields, conditional formats, drill-through and export.
