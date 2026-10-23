# @its/glowup-pivot

Pivot tables for Expo apps, built on `@its/glowup-ui`. The engine is a copy of AuraPivot's (`docs/pivot-upstream.md`); the grid, the
field panel and the rest are written here, a piece at a time. Not published yet (`"private": true`).

Design and plan: `docs/superpowers/specs/2026-10-23-pivot-core-design.md`. Wider plan: Phase 7 of `docs/solaris-native.md`.

## State

- **Piece 1 (engine only, no screen):** the engine, its options, the localization dictionaries, the hooks and the context are in
  `src/`, with the original's tests running under jest. Checked in jest only; not on a phone (the engine itself ran on Hermes in the
  spike, `docs/spike-0.1-pivot-core.md`).
- Not here yet: the grid, the field panel, filters, calculated fields, conditional formats, drill-through and export.
