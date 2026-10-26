# Pivot, pezzo 1: impalcatura e core — piano di lavoro

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `packages/pivot` (`@its/glowup-pivot`, privato) contiene il motore di AuraPivot 2.6.0, senza interfaccia, con i suoi test in jest nella nostra CI.

**Architecture:** si copiano i file di AuraPivot con la stessa struttura (`src/core`, `src/options`, `src/localization`, `src/hooks`, `src/context`, `src/utils`), si portano i test da vitest a jest e si fanno solo le differenze elencate nel progetto, ognuna registrata in `docs/pivot-upstream.md`. Il pacchetto si costruisce copiando l'impalcatura di `packages/charts`.

**Tech Stack:** TypeScript, jest-expo, `@testing-library/react-native`, react-native-builder-bob. Nessuna dipendenza nuova.

**Spec:** `docs/superpowers/specs/2026-10-23-pivot-core-design.md`

## Global Constraints

- Sorgente: `C:\Users\a.rossi\Documents\Dev\AuraPivot-master\AuraPivot-master` (versione 2.6.0, **senza `.git`**). La repo AuraPivot non si modifica mai.
- Il pacchetto resta `"private": true`; nessun changeset; nessun push (lo fa Alice).
- Il pacchetto importa solo `@its/glowup-ui` di ciò che è nostro; il core non importa nemmeno quello. Niente `exceljs`, MUI, `react-virtuoso`, DOM, `navigator`.
- Stile: Prettier `trailingComma: "all"`, doppi apici, LF; in AuraPivot si usano apici singoli: `npx prettier --write` sui file copiati.
- `package-lock.json` si aggiorna con `npm install` e si committa insieme al manifesto.
- In jest, ogni `fireEvent` e ogni `renderHook` / `act` si aspettano con `await` (questa versione di Testing Library è asincrona).
- Ogni differenza dall'originale va in `docs/pivot-upstream.md` (Task 5).
- Commit con riga finale `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

- `formatNumberWithFormat(value, section)` oggi non ha un parametro locale e i separatori «System» vengono sempre dal browser: su Hermes sono sempre `en-US`, quindi un report in italiano formatta all'americana (Task 3: parametro `locale`, test con `it-IT`).
- Un locale non passato (`undefined`) senza `navigator`: deve dare `en-US`, non un'eccezione (Task 3).
- `Intl.NumberFormat.prototype.formatToParts` assente (iOS): i separatori non devono cadere in silenzio su `,` e `.` quando il locale è `it-IT` (Task 3: test che toglie `formatToParts`).
- Un locale non valido (`"xx_YY"`) non deve far crashare la formattazione (Task 3).
- Il core copiato non deve contenere `exceljs`, `document.` né `navigator` (Task 3: test che li cerca nei sorgenti; fallisce finché `navigator` è nel formattatore).

---

### Task 1: Impalcatura di `packages/pivot` e collegamento al monorepo

**Files:**

- Create: `packages/pivot/package.json`, `tsconfig.json`, `tsconfig.build.json`, `babel.config.js`, `jest.setup.js`, `CLAUDE.md`, `README.md`, `src/index.ts`
- Modify: `package.json` (script `build`), `.github/workflows/ci.yml` (riga 50, `validate-package`), `apps/playground/tsconfig.json` (`paths`), `apps/playground/package.json` (dipendenza), `CLAUDE.md` della radice, `package-lock.json`

**Interfaces:**

- Produces: workspace `@its/glowup-pivot` con `npm test -w @its/glowup-pivot`, `type-check`, `build`; entry `src/index.ts` (vuoto per ora: `export {};`).

- [ ] **Step 1: Copiare i file di configurazione di `packages/charts`** (`babel.config.js`, `jest.setup.js`, `tsconfig.json`, `tsconfig.build.json`) in `packages/pivot/`. In `tsconfig.build.json` togliere l'esclusione `src/vendor/**/*.js`.
- [ ] **Step 2: Scrivere `packages/pivot/package.json`** dal modello di `packages/charts/package.json`: nome `@its/glowup-pivot`, versione `0.0.0`, `private: true`, descrizione «Pivot tables for Expo apps, built on @its/glowup-ui: engine copied from AuraPivot», `directory: packages/pivot`, parole chiave `pivot`, `pivot-table`; stessi `exports`, `files`, `scripts`, `react-native-builder-bob`, `jest`, `publishConfig`. `peerDependencies`: `@its/glowup-ui >=0.11`, `react >=19`, `react-native >=0.86` (niente `react-native-svg`). `devDependencies`: quelle di charts senza `react-native-svg`.
- [ ] **Step 3: `src/index.ts`** con `export {};` e commento «the engine is added by the next tasks».
- [ ] **Step 4: Collegare.** Aggiungere `-w @its/glowup-pivot` a `validate-package` in `ci.yml` e `--workspace @its/glowup-pivot` a `build` in `package.json`; in `apps/playground/tsconfig.json` il mapping `"@its/glowup-pivot": ["../../packages/pivot/src/index.ts"]` accanto a quello di charts; `"@its/glowup-pivot": "*"` nelle dipendenze del playground. Nel `CLAUDE.md` della radice: riga `packages/pivot` nella tabella dei workspace (privato fino al primo rilascio), `@its/glowup-pivot` nell'elenco dei mapping, `packages/pivot/CLAUDE.md` nell'elenco dei file per workspace, `npm test -w @its/glowup-pivot` nei comandi.
- [ ] **Step 5: `packages/pivot/CLAUDE.md` e `README.md`**, brevi, sul modello di quelli di charts: il pacchetto copia il motore di AuraPivot, la repo AuraPivot non si tocca, ogni differenza sta in `docs/pivot-upstream.md`, nessun DOM/`navigator`/`exceljs` nel core, i confini di import (`ADDON_PACKAGES`), privato fino al primo rilascio.
- [ ] **Step 6: Verificare.** `npm install` (aggiorna il lockfile, nessuno script), poi `npm run lint`, `npm run type-check -w @its/glowup-pivot`, `npm test -w @its/glowup-pivot` (passa senza test), `npm run build -w @its/glowup-pivot`, `npm run type-check -w @its/glowup-playground`. Atteso: tutti verdi.
- [ ] **Step 7: Commit** `feat(pivot): scaffold packages/pivot` con il lockfile.

### Task 2: Copiare il core, senza l'esportazione Excel, con i test in jest

**Files:**

- Create: `packages/pivot/src/core/**` (da `pivot-core/`, escluso `export/`)
- Modify: `src/core/PivotEngine.ts` (tolto `exportExcel` e il suo import), `src/core/index.ts` (tolto `exportMatrixToExcel`)

**Interfaces:**

- Produces: `src/core/index.ts` con `PivotEngine` (default e nominato), `normalizeDataset`, `getFieldCaption`, `expandHierarchies`, `AGGREGATIONS`, `applyAggregation`, `formatMeasureValue`, `buildTree`, `flattenTreeCompact`, `findNodeByKey`, `applyFilters`, `computeMatrix`, `resolveCellStyle`, `formatNumberWithFormat`; i tipi di `types.ts`.

- [ ] **Step 1: Copiare** `pivot-core/` in `src/core/` **senza** `export/` (`cp -r`, poi rimuovere `export`). Prima di toccare nulla, calcolare e annotare l'hash di provenienza (comando al Task 5, Step 1): la sorgente non cambia, ma l'annotazione serve per il Task 5.
- [ ] **Step 2: Togliere l'esportazione Excel:** in `PivotEngine.ts` l'import di `./export/ExcelExporter` (riga 32) e il metodo `exportExcel(filename?: string): Promise<void>` (riga ~1265); in `index.ts` la riga `export { exportMatrixToExcel }`.
- [ ] **Step 3: Portare i test:** in ogni `*.test.ts` sotto `src/core` togliere la riga `import … from 'vitest'`, sostituire `vi.` con `jest.`; se un test dell'engine prova `exportExcel`, toglierlo. `npx prettier --write packages/pivot/src`.
- [ ] **Step 4: Verificare.** `npm test -w @its/glowup-pivot`: i test del core passano (il test dell'intlCaching che legge `navigator.language` può passare qui e si adatta nel Task 3). Lint e type-check del pacchetto verdi.
- [ ] **Step 5: Commit** `feat(pivot): copy the AuraPivot 2.6.0 core without the Excel exporter`.

### Task 3: Locale esplicito e separatori senza `formatToParts`

**Files:**

- Modify: `src/core/format/CellFormatter.ts`, `src/core/format/DateFormatter.ts`, `src/core/format/intlCaching.test.ts`
- Test: `src/core/format/locale.test.ts`, `src/__tests__/no-web-apis.test.ts`

**Interfaces:**

- Consumes: `PivotEngine` e `formatNumberWithFormat` del Task 2.
- Produces: `formatNumberWithFormat(value: number | null | undefined, section: FormatSection | null | undefined, locale?: string): string`; con `locale` assente il locale è `'en-US'` (mai `navigator`). `resolveLocale(explicit)` di `DateFormatter.ts` ricade su `'en-US'`.

- [ ] **Step 1: Scrivere i test che falliscono** in `src/core/format/locale.test.ts`:
  - `formatNumberWithFormat(1234.56, {}, "it-IT")` è `"1.234,56"`; con `"en-US"` è `"1,234.56"`; senza locale è `"1,234.56"`.
  - con `Intl.NumberFormat.prototype.formatToParts` messo a `undefined` (`jest.spyOn` / assegnazione e ripristino): `formatNumberWithFormat(1234.56, {}, "it-IT")` resta `"1.234,56"` (i separatori si ricavano da `format(12345.6)`).
  - un locale non valido (`"xx_YY"`) non lancia e dà un testo che contiene `1234` o `1,234`.
  - `currencySymbol: "System"` con `"it-IT"` usa `€` (oggi `getSystemCurrency` usa il browser).
  - una data formattata senza `locale` non lancia (ricade su `en-US`).
  - `src/__tests__/no-web-apis.test.ts`: legge con `fs` ogni `.ts` non di test sotto `src/core` e afferma che nessun file contiene `exceljs`, `document.` o `navigator`.
- [ ] **Step 2: Eseguirli e vedere che falliscono** (`npm test -w @its/glowup-pivot -- locale`): il terzo parametro non esiste.
- [ ] **Step 3: Implementare in `CellFormatter.ts`:** togliere `getBrowserLocale`; `getSystemSeparators(locale: string)` e `getSystemCurrency(locale: string)` ricevono il locale; i separatori si ricavano da `getNumberFormat(locale).format(12345.6)` (il primo carattere non cifra è il gruppo, l'ultimo non cifra è il decimale; se il formato non ha gruppo, `','`/`'.'` come ora), dentro lo stesso `try/catch`; la cache resta per locale; `formatNumberWithFormat` prende `locale = 'en-US'` come terzo parametro. In `DateFormatter.ts` `resolveLocale` ricade su `'en-US'` senza leggere `navigator`.
- [ ] **Step 4: Adattare `intlCaching.test.ts`** (il test «output uses the system locale separators» leggeva `navigator.language`): deve passare `"it-IT"` e confrontare con `"1.234,56"`.
- [ ] **Step 5: Verificare.** Tutti i test del pacchetto passano, compreso `no-web-apis.test.ts`; lint e type-check verdi.
- [ ] **Step 6: Commit** `feat(pivot): pass the locale explicitly, no navigator, separators without formatToParts`.

### Task 4: Opzioni, localizzazione, hook, contesto e API pubblica

**Files:**

- Create: `src/options/**`, `src/localization/**` (senza `dictionaries.test.ts`), `src/hooks/**`, `src/context/**`, `src/utils/**` (da AuraPivot), `src/index.ts` (riscritto), `src/__tests__/exports.test.ts`
- Modify: `src/hooks/usePivotMatrix.test.tsx` (riscritto per React Native)

**Interfaces:**

- Consumes: `src/core/index.ts` del Task 2.
- Produces: da `src/index.ts`: tutto ciò che esporta `src/core/index.ts` (compreso `AGGREGATIONS` del core: quello di `options/optionsSchema.ts` non si esporta, ha lo stesso nome), più `usePivotMatrix` e `useEngineVersion` (export di default dei loro file, riesportati con nome), `PivotProvider` e `usePivot` (di `context/PivotContext.tsx`), `mergeLocalization` e il tipo `LocalizationDictionary`, i dizionari `en.json` e `it.json` come `localizationEn` e `localizationIt`, `optionsToEngine`, `engineToOptions` e `DEFAULT_OPTIONS`.

- [ ] **Step 1: Copiare** `options/`, `localization/`, `hooks/`, `context/`, `utils/` nelle cartelle omonime di `src/`; non copiare `localization/dictionaries.test.ts`. Gli import `../pivot-core/...` diventano `../core/...`.
- [ ] **Step 2: Portare i test:** come nel Task 2 Step 4 (`vitest` → `jest`). Per `hooks/usePivotMatrix.test.tsx`: togliere la riga `// @vitest-environment happy-dom`, importare `act` e `renderHook` da `@testing-library/react-native`, e aspettare con `await` ogni `renderHook` e ogni `act`.
- [ ] **Step 3: Scrivere il test che fallisce** `src/__tests__/exports.test.ts`: importa `../index` e afferma che `PivotEngine`, `usePivotMatrix`, `useEngineVersion`, `formatNumberWithFormat`, `PivotProvider`, `usePivot`, `mergeLocalization`, `localizationEn`, `localizationIt`, `optionsToEngine`, `engineToOptions` e `DEFAULT_OPTIONS` sono definiti, e che un `PivotEngine` con `setData` di 3 righe e `setSlice` (una riga, una misura `sum`) produce da `processMatrix()` una matrice con almeno una cella.
- [ ] **Step 4: Eseguirlo e vedere che fallisce** (`src/index.ts` esporta solo `{}`).
- [ ] **Step 5: Scrivere `src/index.ts`** con gli export elencati sopra, solo quelli.
- [ ] **Step 6: Verificare.** `npm test -w @its/glowup-pivot` (tutti i test passano, compreso quello degli hook in React Native), `npm run lint`, `npm run type-check -w @its/glowup-pivot`, `npm run build -w @its/glowup-pivot`, `npm run validate-package -w @its/glowup-pivot`, `npm run type-check -w @its/glowup-playground`. Atteso: verdi.
- [ ] **Step 7: Commit** `feat(pivot): options, localization, hooks, context and the public API`.

### Task 5: Documenti, provenienza e verifica finale

**Files:**

- Create: `docs/pivot-upstream.md`
- Modify: `docs/solaris-native.md` (Fase 7 e stato), `docs/work-split.md` (A3, A6 e tabella delle attese), `docs/handoff/2026-10-23.md`

- [ ] **Step 1: Calcolare l'hash di provenienza** dalla cartella di AuraPivot: `find pivot-core options localization hooks context utils -type f ! -path 'pivot-core/export/*' | sort | xargs sha256sum | sha256sum` (e annotare anche l'elenco dei file).
- [ ] **Step 2: Scrivere `docs/pivot-upstream.md`** sul modello di `docs/charts-upstream.md`: origine (AuraPivot 2.6.0, MIT, © IT Solutions S.r.l., percorso, nessun `.git`, hash e comando), tabella cartelle copiate → destinazione, **differenze volute** numerate: (1) niente `export/ExcelExporter`, niente `PivotEngine.exportExcel` né `exportMatrixToExcel` nel barrel (tornano nel pezzo 5, solo web); (2) `formatNumberWithFormat` ha il terzo parametro `locale` e i separatori e la valuta «System» vengono da lì, locale assente = `en-US`, `navigator` non letto; `DateFormatter.resolveLocale` uguale; (3) separatori da `format(12345.6)` invece di `formatToParts`; (4) test portati a jest, `dictionaries.test.ts` non portato (usa `import.meta.glob` e legge i componenti), test dell'hook riscritto per React Native, `ExcelExporter.test.ts` non copiato; (5) import `../pivot-core` → `../core`; (6) Prettier applicato (stile, nessun cambio di logica). Aggiungere «come aggiornare la copia».
- [ ] **Step 3: Aggiornare i piani:** in `docs/solaris-native.md` Fase 7 e in `docs/work-split.md` (A6 e la riga «A6 aspetta B5»): la griglia sta dentro `packages/pivot`, non dipende dalla `DataGrid` di `ui`; lo stato dei pezzi 1–5.
- [ ] **Step 4: Aggiornare l'handoff di oggi** (`docs/handoff/2026-10-23.md`): pezzo 1 del pivot, cosa è stato fatto e verificato (solo jest, lint, type-check, build, `validate-package`), cosa non è verificato (nessuna prova su dispositivo in questo pezzo) e il prossimo passo (pezzo 2: griglia).
- [ ] **Step 5: Verifica finale su tutto il repo:** `npm run lint`, `npm run type-check`, `npm test`, `npm run build`. Atteso: tutti verdi (controllare che i test degli altri workspace non siano cambiati).
- [ ] **Step 6: Commit** `docs(pivot): provenance, differences from AuraPivot and the plans`.
