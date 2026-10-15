# Provenance

Copy of `pivot-core/` from AuraPivot 2.6.0 (https://github.com/itsolutions-dev/AuraPivot, MIT,
Copyright (c) 2026 IT Solutions S.r.l.; see `LICENSE`), taken on 2026-10-15 for spike 0.1 of
`docs/solaris-native.md`. The AuraPivot repository was not modified.

Changes from the original: the `*.test.ts` files were removed, and `export/ExcelExporter.ts` was replaced by a
stub. Nothing else is touched.

Throwaway: it exists so the native smoke workflow can run the engine on a real Hermes. Phase 7 creates
`packages/pivot` properly. Delete this folder, its route (`app/spike-pivot-hermes.tsx`) and the ESLint ignore
when the spike is closed.
