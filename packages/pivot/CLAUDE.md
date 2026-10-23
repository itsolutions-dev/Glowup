# packages/pivot — the pivot package

Design and plan of the first piece: `docs/superpowers/specs/2026-10-23-pivot-core-design.md` and `docs/superpowers/plans/2026-10-23-pivot-core.md`.
The wider plan is Phase 7 of `docs/solaris-native.md`. Read the design before adding anything.

- **The engine is a copy of AuraPivot 2.6.0** (`C:\Users\a.rossi\Documents\Dev\AuraPivot-master`, MIT): `src/core`, `src/options`,
  `src/localization`, `src/hooks`, `src/context`, `src/utils`, with the same file layout. **The AuraPivot repository is never
  modified.** Every difference from the original, and where the copy came from, is written in `docs/pivot-upstream.md`: change the
  copy only for a difference listed there, and list the new one in the same commit.
- **No web API in the core.** No `document`, no `navigator`, no `exceljs`, no MUI: `src/__tests__/no-web-apis.test.ts` fails if one
  comes back. The locale is always passed in (`PivotEngine.setLocale`, the `locale` argument of `formatNumberWithFormat`); a missing
  locale means `en-US` in the number and date formatters (`formatNumberWithFormat`, `formatDateValue`, the date headers); the measure
  cells (`formatMeasureValue`) and the sorts still use the runtime's locale when none is set, as in the original. Always call `setLocale`.
- **Numbers and dates do not format the same on iOS and Android** (Hermes' `Intl` differs: `formatToParts` is missing on iOS, the
  date and currency text differs). Tests and comparisons must not assume one text everywhere.
- **The grid is written inside this package**, not on the library's `DataGrid` (decision of 2026-10-23). That is a later piece.
- **Sits on top of the library.** It may import `@its/glowup-ui`, **by package name only**, and nothing else of ours; nothing below it
  imports it. ESLint enforces it (`ADDON_PACKAGES` in the root `eslint.config.js`).
- **Private until ready.** `changeset publish` publishes any non-private package whose version is not on npm yet, so this one stays
  `"private": true` until its first release (it also needs its own trusted publisher on npmjs.com, see `release.yml`).
- **Type-check and tests read the library's source** (`paths` in `tsconfig.json`); `tsconfig.build.json` clears the mapping so the
  declarations name the package.
- **Tests use `await` on every `fireEvent`, `renderHook` and `act`**: this version of Testing Library is asynchronous.
