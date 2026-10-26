si # Pivot, pezzo 2: griglia in sola lettura — piano di lavoro

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@its/glowup-pivot` esporta `PivotGrid`: sul web una griglia in sola lettura (intestazione e prime due colonne sempre visibili, righe virtualizzate, apertura e chiusura di righe e di gruppi di colonne), con una pagina `/pivot` nel playground.

**Architecture:** un modello senza grafica (`buildGridModel`, funzione pura) legge la matrice del motore e produce intestazione, righe e celle col testo da mostrare, con le regole di `components/PivotTable/PivotTable.tsx` di AuraPivot; un hook (`usePivotGrid`) lo tiene aggiornato sopra `usePivotMatrix`; il disegno web usa un solo contenitore che scorre con `position: sticky` e una finestra di righe calcolata a mano; il nativo mostra per ora una riga di testo.

**Tech Stack:** TypeScript, React Native (react-native-web), `@its/glowup-ui` per tema e tipografia, jest-expo con `@testing-library/react-native`. Nessuna dipendenza nuova.

**Spec:** `docs/superpowers/specs/2026-10-23-pivot-grid-design.md` (pezzo 1: `docs/superpowers/specs/2026-10-23-pivot-core-design.md`).

## Global Constraints

- Il pacchetto importa solo `@its/glowup-ui` di ciò che è nostro; resta `"private": true`; nessun push da parte di Claude; **un solo commit alla fine** (Task 5), come da regola di Alice (commit solo a fine di una grande implementazione).
- Stile del repo: Prettier (doppi apici, virgola finale, LF), `npm run lint` senza errori; colori e tipografia dai token del tema (`useTheme()`, `theme.colors.*`, `theme.typography.*`), mai scritti a mano; test con `await` su ogni `render`, `renderHook`, `act` e `fireEvent`.
- Il core non usa `document`, `navigator`, `exceljs` (`src/__tests__/no-web-apis.test.ts` vale solo per `src/core`); il codice di griglia può usare elementi DOM **solo** nei file `*.web.tsx`.
- La griglia non ricalcola la matrice: la dà `usePivotMatrix`. L'apertura di un nodo è `engine.toggleExpanded(nodeKey)`; il nodo è `leaf.nodeKey || leaf.key`.
- Si legge da una foglia di colonna una sola riga di intestazione (nessuno span): `col.caption` contiene già percorso e misura.
- Costanti di layout (modificabili dal costruttore, definite in `src/grid/layout.ts`): `ROW_HEIGHT = 32`, `HEADER_HEIGHT = 36`, `INDENT = 16`, `CHEVRON_WIDTH = 32`, `LABEL_WIDTH = 240`, `CELL_WIDTH = 120`, `DEFAULT_HEIGHT = 480`.
- Il file `pivot.xlsx` di Alice e i suoi dati non entrano nella repo: dati inventati con la stessa forma.

## Review Focus

- Nessun dato (`engine` senza `setData`, o filtri che svuotano tutto): niente eccezione, `model` nullo o senza righe, la griglia mostra «No data to display» (`grid.empty`) (Task 1, 3).
- Misure sulle righe: le righe hanno `key` diversi ma lo stesso `nodeKey`; l'`key` di React è `key`, l'apertura usa `nodeKey`; la freccia compare solo sulla prima misura (Task 1).
- Un dataset con 10.000 righe visibili: nel DOM restano montate solo le righe della finestra più il margine (Task 3).
- Aprire un nodo con più di 5.000 righe di dati: `usePivotMatrix` passa da `loading`; il modello resta quello di prima finché non arriva la matrice nuova (Task 2).
- Una cella con errore di formula (`cell.error`): non mostra un numero e non fa crollare la griglia; ha un'etichetta accessibile con il messaggio (Task 1, 3).
- Una cella senza valore (`null`) o assente: testo vuoto, non `"null"` né `NaN` (Task 1).

---

### Task 1: Il modello della griglia

**Files:**

- Create: `packages/pivot/src/grid/layout.ts`, `packages/pivot/src/grid/model.ts`, `packages/pivot/src/grid/model.test.ts`

**Interfaces:**

- Produces (`src/grid/layout.ts`): le costanti di layout dei Global Constraints.
- Produces (`src/grid/model.ts`):
  - `interface GridColumn { key: string; nodeKey: string; label: string; isTotal: boolean; canToggle: boolean; isExpanded: boolean }`
  - `interface GridCell { key: string; text: string; value: number | null; error: string | null }`
  - `interface GridRow { key: string; nodeKey: string; label: string; depth: number; indent: number; isTotal: boolean; isGrandTotal: boolean; isSubtotal: boolean; canToggle: boolean; isExpanded: boolean; cells: GridCell[] }`
  - `interface GridModel { columns: GridColumn[]; rows: GridRow[] }`
  - `interface GridModelInput { matrix: ComputedMatrix; slice: InternalSlice; format: FormatSnapshot; metadata?: Record<string, { caption?: string }>; locale?: string; localization?: LocalizationDictionary }`
  - `buildGridModel(input: GridModelInput): GridModel`
  - tipi `ComputedMatrix` e `AxisLeaf` da `../core/matrix/MatrixComputer`, `InternalSlice` e `FormatSnapshot` da `../core/PivotEngine`, `getValuesSection` da `../core/format/CellFormatter`, `formatNumberWithFormat` dallo stesso file.

Regole di `buildGridModel` (contratto di parità con AuraPivot, da `PivotTable.tsx`):

1. **Misure nascoste:** si scartano le foglie di riga e di colonna con `measureKey` nell'insieme di `measureKeyOf(m)` delle `slice.measures` con `hidden`. Se l'unica misura visibile (aggregazione diversa da `formula`) è `currentRatio`, si scarta anche la foglia del totale generale di colonna (`isTotal && depth === -1`).
2. **Didascalia del totale generale:** se `matrix.measuresOnColumns`, `grid.total || "Total"`; altrimenti, senza misure, `grid.grandTotal || "Grand Total"`; altrimenti le didascalie delle misure unite da `" · "`, ognuna `m.grandTotalCaption || m.caption || metadata?.[m.uniqueName]?.caption || m.uniqueName`. `grid` è la sezione `grid` di `localization` (assente = vuota).
3. **Etichetta di riga:** `isTotal && !measureKey` → didascalia del totale generale; `isSubtotal` → `(grid.subtotalCaptionTemplate || "{member} Total").replace("{member}", memberCaption ?? caption)`, più `" — " + measureCaption` se c'è; altrimenti `caption`.
4. **Rientro e frecce:** `indent = Math.max(0, depth) * INDENT`. `showNodeControls = measureKey == null || isFirstMeasure === true`. Riga: `canToggle = children.length > 0 && showNodeControls && !isTotal && !isSubtotal`. Colonna: `canToggle = children.length > 0 && !isTotal && showNodeControls`. `isExpanded = leaf.isExpanded !== false`. `isGrandTotal = isTotal && depth === -1`.
5. **Testo di una cella** (riga `r`, colonna `c`; la cella è `matrix.cells.get(r.key + "::" + c.key)`): `agg = cell?.measureKey?.split(":")[1]`; `section = getValuesSection(format, cell?.measureKey)`; se `agg` è `ratioTotal` o `currentRatio`, c'è `section` e `format.valuesByMeasure` non ha un override con la chiave `percentage` (per `measureKey` o per `uniqueName`), `section = { ...section, percentage: true }`. Testo vuoto se `agg === "currentRatio" && c.isTotal`, o `r.totalsHidden || c.totalsHidden`, o `cell` assente; altrimenti `formatNumberWithFormat(cell.value, section, locale) || cell.formattedValue`. `error = cell?.error || null`, `value = cell?.value ?? null`.

- [ ] **Step 1: Scrivere i test che falliscono** in `src/grid/model.test.ts`, con un `PivotEngine` vero (`setLocale("en-US")`, dati `site/cat/flag/n/v` come `[{site:"A",cat:"x",flag:"t",n:5,v:1},{site:"A",cat:"y",flag:"f",n:7,v:2},{site:"B",cat:"x",flag:"t",n:11,v:3}]` preceduti dalla riga dei metadati), un helper `model(slice, format?)` che chiama `buildGridModel({ matrix: e.processMatrix(), slice: e.getSlice(), format: e.getFormat(), metadata: e.getMetadata(), locale: e.getLocale() })`. I test (nome → asserzioni):
  - `"rows nest, with the grand total first"`: righe `site` poi `cat`, colonne `flag`, misura `n` somma, tutto espanso → etichette di riga `["Total","A","x","y","B","x"]`, `depth` `[-1,0,1,1,0,1]`, `indent` `[0,0,16,16,0,16]`, `isGrandTotal` solo il primo; colonne `["Total","f","t"]`.
  - `"cells carry the formatted text of their intersection"`: stessa slice → la riga «A» ha testi `["12","7","5"]` (colonne `Total`, `f`, `t`) e la riga «Total» `["23","7","16"]`.
  - `"only a node with children can toggle, and the nodeKey is the toggle key"`: «A» e «B» `canToggle: true`, `x`/`y`/«Total» `false`; `nodeKey` di «A» = `"__root__|site:A"`.
  - `"measures on columns put the measure in every column caption"`: righe `site`, colonne `flag` e `Measures`, misure `n` e `v` → le didascalie delle colonne sono `["Sum Total of Count","Sum Total of Value","f — Sum Total of Count","f — Sum Total of Value","t — Sum Total of Count","t — Sum Total of Value"]`.
  - `"measures on rows repeat a node per measure but only the first owns the arrow"`: righe `site` e `Measures`, colonne `flag` → le righe di «A» sono due con `key` diversi e stesso `nodeKey`; `canToggle` vero solo sulla prima.
  - `"a collapsed column group can be expanded"`: colonne `flag` e `cat`, `expands: { expandAll: false, expandedMembers: ["__root__","__root__|flag:t"] }` → la colonna `f` ha `canToggle: true` e `isExpanded: false`; la colonna `t` ha `isExpanded: true`.
  - `"a hidden measure leaves no column"`: misure `n` e `v` con `v` `hidden: true`, `Measures` sulle colonne → nessuna colonna con `v` nella didascalia.
  - `"totals after: header clone, children, subtotal, grand total last"`: `format` `{ layout: { totalsRowsPosition: "after" } }` → l'ultima riga è il totale generale; una riga di subtotale ha etichetta `"A Total"` e `canToggle: false`; la riga di intestazione del gruppo (`totalsHidden`) ha tutte le celle con testo vuoto.
  - `"the numbers follow the locale it is given"`: stesso modello con `locale: "it-IT"` e un formato `valuesByMeasure["n:sum"] = { numberOfDecimals: 1 }` → il testo della cella `5` è `"5,0"`; con `"en-US"` `"5.0"`.
  - `"a ratio measure is a percentage unless the format says otherwise"`: misura `n` con aggregazione `ratioTotal` e il formato `values` di default → il testo della cella del totale contiene `"%"`.
  - `"a missing cell and a null value are empty text"`: costruire a mano una matrice ridotta (`cells` vuota) → `text` `""` per ogni cella, mai `"null"` né `"NaN"`.
  - `"a cell with a formula error keeps the message and shows no number"`: una cella `{ value: null, formattedValue: "", error: "boom", ... }` inserita a mano → `error: "boom"`, `text: ""`.
  - `"no rows at all is an empty model, not an error"`: engine con `setData([meta])` (nessuna riga di dati) → `buildGridModel` non lancia e `rows` ha al più il totale generale.
- [ ] **Step 2: Eseguirli e vedere che falliscono** (`npm test -w @its/glowup-pivot -- src/grid/model`): `buildGridModel` non esiste. Atteso: FAIL «Cannot find module» o «is not a function».
- [ ] **Step 3: Implementare** `layout.ts` e `model.ts` con le firme sopra e le regole 1–5 (`section(localization, "grid")` si scrive in `model.ts` come funzione locale: `(t: unknown, name: string): Record<string, string>`, assente = `{}`). Il testo `"Total"` ecc. vengono dal dizionario, mai scritti due volte.
- [ ] **Step 4: Eseguirli e vedere che passano**; poi `npm run lint`, `npm run type-check -w @its/glowup-pivot`. Atteso: verdi (0 errori; gli avvisi del codice copiato restano).

### Task 2: L'hook `usePivotGrid`

**Files:**

- Create: `packages/pivot/src/grid/usePivotGrid.ts`, `packages/pivot/src/grid/usePivotGrid.test.tsx`

**Interfaces:**

- Consumes: `buildGridModel`, `GridModel` (Task 1); `usePivotMatrix(engine)` → `{ matrix: ComputedMatrix | null; loading: boolean }` e `useEngineVersion(engine)` → `number` (src/hooks).
- Produces: `usePivotGrid(engine: PivotEngine | null, localization?: LocalizationDictionary): { model: GridModel | null; loading: boolean; toggle: (nodeKey: string) => void }`. `toggle` chiama `engine.toggleExpanded(nodeKey)`. Il modello si ricostruisce quando cambiano `matrix`, la versione dell'engine o `localization`; `slice`, `format`, `metadata` e `locale` si leggono dall'engine al momento della costruzione.

- [ ] **Step 1: Scrivere i test che falliscono** (`await renderHook`, `await act`):
  - `"returns null while there is no engine"`: `usePivotGrid(null)` → `model` nullo, `loading` falso.
  - `"builds the model of the engine"`: engine con tre righe e righe `site` → `model.rows.map(r => r.label)` uguale a `["Total","A","B"]`.
  - `"toggle collapses a node and the model follows"`: `toggle("__root__|site:A")` (con `site` e `cat` espansi) dentro `await act` → le etichette non contengono più `"x"` e `"y"` sotto «A».
  - `"keeps the last model while a large dataset recomputes"`: con i timer finti di jest (`jest.useFakeTimers()`, ripristinati in `finally`), un engine con 10 righe; `setData` di 5.001 righe in `await act` → `loading` vero e `model` identico (stesso oggetto) a prima; poi `jest.runOnlyPendingTimers()` in `await act` → `loading` falso e `model` diverso.
- [ ] **Step 2: Eseguirli e vedere che falliscono** (`npm test -w @its/glowup-pivot -- usePivotGrid`): `usePivotGrid` non esiste.
- [ ] **Step 3: Implementare** `usePivotGrid(engine, localization)` con `useMemo` sul modello e `useCallback` su `toggle`.
- [ ] **Step 4: Eseguirli e vedere che passano**; lint e type-check verdi.

### Task 3: `PivotGrid` (web, nativo) e finestra di righe

**Files:**

- Create: `packages/pivot/src/grid/windowing.ts`, `packages/pivot/src/grid/windowing.test.ts`, `packages/pivot/src/PivotGrid.web.tsx`, `packages/pivot/src/PivotGrid.tsx`, `packages/pivot/src/__tests__/pivotGrid.web.test.tsx`
- Modify: `packages/pivot/src/index.ts`

**Interfaces:**

- Consumes: `usePivotGrid`, `GridModel`, `GridRow`, `GridColumn`, costanti di `layout.ts` (Task 1–2), `PivotEngine`, `LocalizationDictionary`.
- Produces: `visibleRange(args: { scrollTop: number; viewportHeight: number; rowHeight: number; count: number; overscan?: number }): { start: number; end: number }` (`end` escluso, `overscan` predefinito 5); `interface PivotGridProps { engine: PivotEngine; localization?: LocalizationDictionary; height?: number }` (altezza del contenitore, predefinita `DEFAULT_HEIGHT`); `PivotGrid` come export di default di `PivotGrid.web.tsx` e di `PivotGrid.tsx`; da `src/index.ts`: `PivotGrid`, `type PivotGridProps`, `usePivotGrid`, `buildGridModel` e i tipi `GridModel`, `GridRow`, `GridColumn`, `GridCell`.

- [ ] **Step 1: Test della finestra (falliscono)** in `windowing.test.ts`: `visibleRange({scrollTop:0,viewportHeight:100,rowHeight:10,count:1000,overscan:0})` → `{start:0,end:10}`; con `scrollTop:500` e `overscan:2` → `{start:48,end:62}`; `scrollTop` oltre la fine (`50000`) con `count:1000` → `end` uguale a `1000` e `start` non negativo; `count:0` → `{start:0,end:0}`; `viewportHeight:0` → intervallo vuoto.
- [ ] **Step 2: Eseguirli e vedere che falliscono**, implementare `visibleRange` in `windowing.ts` (aritmetica sui limiti: `start = max(0, floor(scrollTop/rowHeight) - overscan)`, `end = min(count, ceil((scrollTop+viewportHeight)/rowHeight) + overscan)`, intervallo vuoto se `count` o `viewportHeight` sono zero), eseguire di nuovo: passano.
- [ ] **Step 3: Test del componente web (falliscono)** in `src/__tests__/pivotGrid.web.test.tsx`, importando `../PivotGrid.web`, con `ThemeProvider` e un engine con dati inventati (sedi A e B, categorie `x` e `y`, colonna `flag`, misura `n`):
  - `"shows the header and the rows"`: `findByText("Total")`, `"A"`, `"x"` e i testi `"12"` e `"23"` presenti.
  - `"opens and closes a row with its arrow"`: premere il controllo con etichetta accessibile `"Collapse"` della riga «A» → `x` e `y` spariscono; ora `"Expand"` → tornano.
  - `"opens and closes a column group"` (colonne `flag` e `cat`, un gruppo chiuso con `expandedMembers`) → premere `"Expand"` dell'intestazione mostra la sua colonna figlia.
  - `"sticky: the container scrolls on both axes and the first two columns stick"`: l'elemento host `div` ha `overflow: "auto"` e l'altezza della prop `height`; la cella dell'etichetta della prima riga ha `position: "sticky"` e `left` uguale a `CHEVRON_WIDTH`; la cella della freccia `left: 0`; l'intestazione `top: 0`.
  - `"mounts only the rows of the window"`: dataset con 10.000 righe `site` (dati generati nel test) e `height` 320 → il numero di righe montate è minore di 60; dopo aver chiamato `onScroll` del `div` con `{ currentTarget: { scrollTop: 100000 } }` (dentro `act`) compare un'etichetta di una riga lontana (per esempio la riga numero 3.000) e sparisce la prima.
  - `"a cell with a formula error is announced, not counted"`: engine con un campo calcolato che dà errore, o una matrice finta tramite `jest.mock("../grid/usePivotGrid")` che restituisce un modello con una cella `error: "boom"` → la cella ha `accessibilityLabel` contenente `"boom"` e il testo del numero è assente.
  - `"no data shows the empty message"`: engine senza righe di dati → compare `"No data to display"`.
  - `"native: a short message instead of the grid"` (in un test a parte che importa `../PivotGrid`): il testo contiene `"not available"`.
- [ ] **Step 4: Eseguirli e vedere che falliscono** (`npm test -w @its/glowup-pivot -- pivotGrid.web`): moduli mancanti.
- [ ] **Step 5: Implementare `PivotGrid.web.tsx`.** Il contenitore è un elemento DOM `div` creato con `createElement("div", { style: { overflow: "auto", height, position: "relative" }, onScroll })` (solo in questo file); `onScroll` legge `event.currentTarget.scrollTop` in uno stato. Dentro: una `View` di larghezza `CHEVRON_WIDTH + LABEL_WIDTH + colonne * CELL_WIDTH`; l'intestazione (`HEADER_HEIGHT`) con `position: "sticky", top: 0, zIndex: 3`; sopra le righe visibili uno spaziatore alto `start * ROW_HEIGHT`, sotto uno alto `(count - end) * ROW_HEIGHT`; ogni riga alta `ROW_HEIGHT`, con la cella della freccia (`position: "sticky", left: 0`, sfondo opaco) e quella dell'etichetta (`left: CHEVRON_WIDTH`, rientro `indent`) e le celle dei numeri allineate a destra. Frecce come `Pressable` con `accessibilityRole="button"` e `accessibilityLabel` `grid.collapseChildren || "Collapse"` / `grid.expandChildren || "Expand"`, che chiamano `toggle(nodeKey)`. Colori dai token (`theme.colors.surface`, `surfaceContainerHigh` per l'intestazione, `primaryContainer` e `onPrimaryContainer` per le righe di totale, `outlineVariant` per i bordi, `error` per le celle con errore), testo con `theme.typography.bodyMedium`/`labelLarge`. `position: "sticky"` non è nel tipo `ViewStyle`: usare un cast circoscritto con un commento. Con `model` nullo o senza righe, mostrare `grid.loading || "Processing…"` se `loading`, altrimenti `grid.empty || "No data to display"`.
- [ ] **Step 6: `PivotGrid.tsx` (nativo):** una `Typography` con il testo «The pivot grid is not available on this platform yet.» (nessuna logica); aggiornare `src/index.ts` con gli export.
- [ ] **Step 7: Eseguire i test** (`npm test -w @its/glowup-pivot`): tutti verdi; `npm run lint`, `npm run type-check -w @its/glowup-pivot`, `npm run build -w @its/glowup-pivot`, `npm run validate-package -w @its/glowup-pivot`.

### Task 4: Pagina `/pivot` nel playground

**Files:**

- Create: `apps/playground/app/pivot.tsx`, `apps/playground/site/samplePivot.ts`, `apps/playground/__tests__/pivot-page.test.tsx`
- Modify: `apps/playground/site/siteNav.ts`

**Interfaces:**

- Consumes: `PivotGrid`, `PivotEngine`, `localizationEn` da `@its/glowup-pivot`; `Page`, `Section` di `site/Page`; `CodeBlock` di `site/CodeBlock`.
- Produces: `samplePivotEngine(): PivotEngine` in `site/samplePivot.ts`: dati inventati con la forma del report del CRM (almeno 6 sedi con nomi inventati, 4 categorie sotto ogni sede, un campo booleano come colonna, misura somma di un conteggio), `setLocale("en-US")`, `setSlice` con righe `site` e `category`, colonne `flag`, totali in alto, tutto espanso.

- [ ] **Step 1: Test che fallisce** `__tests__/pivot-page.test.tsx` (stesso involucro di `pdf-page.test.tsx`: `SafeAreaProvider` a 1280 × 900 e `ThemeProvider`): la pagina mostra il titolo `"Pivot"` e le sezioni `"Live"` e `"Use it"`; in jest la piattaforma è nativa, quindi compare il messaggio di `PivotGrid.tsx` («not available»). Test a parte `samplePivotEngine`: le etichette di riga del modello contengono il totale e almeno una sede, e il totale generale è la somma delle sedi.
- [ ] **Step 2: Eseguirlo e vedere che fallisce** (`npm test -w @its/glowup-playground -- pivot-page`): moduli mancanti.
- [ ] **Step 3: Implementare** `samplePivot.ts`, `app/pivot.tsx` (come `app/pdf.tsx`: `Page` con `eyebrow="Companion package"`, descrizione «@its/glowup-pivot shows a pivot table, with the engine of AuraPivot copied into the package. On the web it is a read-only grid; on a phone it is not available yet. This page is not published yet.», banner informativo, `Section` «Live» con `PivotGrid` in un `Paper` alto 480 e un interruttore di locale `en-US` / `it-IT` che chiama `engine.setLocale`, `Section` «Use it» con `CodeBlock` d'installazione e d'uso) e la voce di `site/siteNav.ts` (`href: "/pivot"`, `label: "Pivot"`, `icon: "table-large"`, `summary: "A pivot table with the engine of AuraPivot, read-only for now."`).
- [ ] **Step 4: Eseguirlo e vedere che passa**; poi `npm test -w @its/glowup-playground` (tutto: 787 + i nuovi), `npm run lint`, `npm run type-check -w @its/glowup-playground`.

### Task 5: Documenti, verifica finale e commit

**Files:**

- Modify: `packages/pivot/CLAUDE.md`, `packages/pivot/README.md`, `apps/playground/CLAUDE.md`, `docs/solaris-native.md` (stato dei pezzi), `docs/work-split.md` (se serve), `docs/handoff/2026-10-23.md`
- Create: nessuno

- [ ] **Step 1: Documenti.** `packages/pivot/CLAUDE.md`: la griglia web è un solo contenitore `div` con `position: sticky` e finestra di righe a mano (una `FlatList` non va: `sticky left` non si aggancia al contenitore orizzontale), le regole di `buildGridModel` vengono da `PivotTable.tsx` di AuraPivot, il nativo non c'è ancora; `README.md`: stato del pezzo 2; `apps/playground/CLAUDE.md`: una riga sulla pagina `/pivot`; `docs/solaris-native.md`: pezzo 2 fatto per il web, resta il disegno nativo; `docs/handoff/2026-10-23.md`: sezione del pezzo 2 (cosa fatto, verificato in jest, **non verificato in Chrome né su dispositivo**, prossimo passo: guardare `/pivot` in Chrome a 1280 e 390 px e poi il disegno nativo).
- [ ] **Step 2: Verifica su tutto il repo, una voce per volta** (non in parallelo: i test del playground vanno in timeout con la macchina carica): `npm run lint`, `npm run type-check`, `npm run build`, `npm test`. Atteso: tutti verdi; se un test del playground va in timeout da 30 s, rilanciare quel workspace da solo prima di concludere.
- [ ] **Step 3: Commit unico** `feat(pivot): read-only grid for the web and the /pivot page` con tutti i file (nessun push).
