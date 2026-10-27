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
- **The grid is written inside this package**, not on the library's `DataGrid` (decision of 2026-10-23). `src/grid/model.ts`
  (`buildGridModel`) is the pure part: it turns an engine matrix into one header row (a cell per column leaf: `col.caption` already
  carries the path and the measure), the visible rows and the cell texts, with the rules of AuraPivot's compact grid
  (`components/PivotTable/PivotTable.tsx` there, not copied): change a rule only to follow AuraPivot, and test it in
  `src/grid/model.test.ts`. `usePivotGrid` keeps the model of the _latest matrix_ (it never pairs an old matrix with a new slice while
  a large dataset recomputes). `PivotGrid.web.tsx` is one DOM `div` that scrolls on both axes, with `position: sticky` on the header and
  the first two columns and only the rows in view mounted (`grid/windowing.ts`, fixed row height): **do not nest a `FlatList`**,
  `sticky left` would bind to its vertical scroller. The widths follow the container (`gridSizes` in `grid/layout.ts`, measured with `onLayout`): the number columns share what the fixed ones leave, and under 600 px the label column shrinks (about 40% of the width) so the numbers stay in view; a row's cells take its height, never a height of their own, or they hide its bottom border. `PivotGrid.tsx` is the iOS and Android grid: no `position: sticky` there, so the numbers scroll on two axes (a horizontal scroll holding a vertical one) and two animated values with the **native driver** (`Animated.event` on the scrolls, `Animated.multiply(offset, -1)`) move the header (clipped in its box) with the horizontal offset and the column of labels (clipped in its own) with the vertical one, so nothing runs in JavaScript between the finger and the screen. The window of rows moves only when it changes (functional `setState`, `sameRange`). No refs in render (the lint rule `react-hooks/refs` forbids them): values and events are made with `useState`/`useMemo`, as in the ui library. **Three rules learnt on Android (2026-10-26), each with its test:** an arrow keeps its press wherever the finger moves (`pressRetentionOffset={Infinity}`): `measure()` reads the JavaScript tree, where the native animation's offset is missing, so after a scroll the measured arrow is as far from the finger as the grid has scrolled; a number fills its cell (`alignSelf: "stretch"`, `textAlign: "right"`, one line), since sized to its digits it wrapped at density 1; with a screen reader on, no rows are kept above and below the view, because React Native clips by drawing and Android still reports rows clipped out of sight. **Known limit:** only the area of the numbers takes a drag; the header and the column of labels follow it but do not scroll the grid when touched (decided 2026-10-26: documented, not changed). What the two grids draw alike lives in `grid/parts.tsx`. **No Reanimated and no Gesture Handler**: the library does not ask for them.
- **The toolbar and the export** (`toolbar` on `PivotGrid`, `grid/PivotFrame.tsx`; spec `docs/superpowers/specs/2026-10-27-pivot-toolbar-xlsx-design.md`): the `.xlsx` is written here, never with `exceljs` (`src/export/zip.ts` a stored zip, `xlsx.ts` the sheet from the `GridModel`, so the file holds what the grid shows); its colours are AuraPivot's, not the theme's. `save.web.ts` downloads, `save.ts` shares through `expo-file-system` + `expo-sharing`, **optional peers loaded with `import()` at the tap** (a missing one is a `PivotExportError`, shown under the toolbar). Tests read the file back with `export/__fixtures__/readZip.ts`. Reset restores the layout the engine had when the grid appeared, never its data.
- **Sits on top of the library.** It may import `@its/glowup-ui`, **by package name only**, and nothing else of ours; nothing below it
  imports it. ESLint enforces it (`ADDON_PACKAGES` in the root `eslint.config.js`).
- **Private until ready.** `changeset publish` publishes any non-private package whose version is not on npm yet, so this one stays
  `"private": true` until its first release (it also needs its own trusted publisher on npmjs.com, see `release.yml`).
- **Type-check and tests read the library's source** (`paths` in `tsconfig.json`); `tsconfig.build.json` clears the mapping so the
  declarations name the package.
- **Tests use `await` on every `fireEvent`, `renderHook` and `act`**: this version of Testing Library is asynchronous.
