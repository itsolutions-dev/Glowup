# Pivot, pezzo 3: griglia per iOS e Android — piano di lavoro

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `PivotGrid` disegna la griglia anche nell'app iOS e Android: intestazione e prime due colonne ferme mentre si scorre (animazione nativa), righe virtualizzate, apertura e chiusura di righe e gruppi di colonne, e un controllo in `/native-check` che la CI legge su iPhone e Android.

**Architecture:** il modello (`buildGridModel`), l'hook (`usePivotGrid`), `gridSizes` e `visibleRange` restano quelli del web. Il disegno nativo sta in `src/PivotGrid.tsx`: un corpo che scorre su due assi (uno scorrimento orizzontale che ne contiene uno verticale), e due riquadri che tagliano (intestazione e etichette) spostati da due `Animated.Value` con `useNativeDriver`, alimentati dallo scorrimento del corpo. Ciò che è uguale al web si sposta in un modulo condiviso.

**Tech Stack:** TypeScript, React Native (`Animated`, `ScrollView`), `@its/glowup-ui` per tema e tipografia, jest-expo con `@testing-library/react-native`, `scripts/android-interact.mjs` (adb). Nessuna dipendenza nuova.

**Spec:** `docs/superpowers/specs/2026-10-23-pivot-native-grid-design.md` (pezzo 2: `docs/superpowers/specs/2026-10-23-pivot-grid-design.md`).

## Global Constraints

- Il pacchetto importa solo `@its/glowup-ui` di ciò che è nostro; resta `"private": true`; nessuna dipendenza nuova (niente Reanimated, niente Gesture Handler); nessun push da parte di Claude; **un solo commit alla fine** (Task 4).
- Stile del repo: Prettier (doppi apici, virgola finale, LF), `npm run lint` senza errori; colori e tipografia dai token del tema; test con `await` su `render`, `renderHook`, `act` e `fireEvent`.
- `buildGridModel`, `usePivotGrid`, `visibleRange` non cambiano di comportamento; si può **aggiungere** `sameRange` a `windowing.ts`. Il web non cambia di aspetto: i test di `pivotGrid.web.test.tsx` restano com'erano e passano.
- Costanti e larghezze: quelle di `src/grid/layout.ts` (`ROW_HEIGHT`, `HEADER_HEIGHT`, `INDENT`, `gridSizes`). Una cella dei numeri è larga `max(sizes.cell, floor((width - chevron - label) / colonne))` quando la larghezza è misurata, `sizes.cell` altrimenti.
- Android: lo scorrimento verticale interno ha `nestedScrollEnabled`; iOS: `directionalLockEnabled` su tutti e due. `scrollEventThrottle={16}`.
- Il driver nativo di `Animated` non è provato da jest: i test dicono che le parti sono al loro posto, non che si muovono; lo dicono la CI e l'emulatore.

## Review Focus

- Un tocco su una freccia **dopo** uno scorrimento in verticale (Android: le viste spostate dall'animazione nativa hanno avuto problemi di tocco): passo dello script Android in `/native-check` e prova sull'emulatore (Task 3, 4).
- 10.000 righe: si montano solo quelle della finestra più il margine (Task 2).
- Nessun dato / caricamento: i messaggi, senza eccezioni (Task 2).
- Contenitore stretto (telefono): le colonne fisse si riducono con `gridSizes` e restano numeri in vista (Task 2).
- Un evento di scorrimento che non cambia l'intervallo di righe non fa ridisegnare la finestra (Task 1, 2).
- Dopo uno scorrimento fino in fondo, chiudere un gruppo accorcia il contenuto: le ultime righe restano montate, la finestra non resta vuota (Task 2).
- Cella con errore di formula: nessun numero, `accessibilityLabel` col messaggio, uguale al web (Task 1, 2).

---

### Task 1: Parti in comune e `sameRange`

**Files:**

- Create: `packages/pivot/src/grid/parts.tsx`, `packages/pivot/src/grid/parts.test.tsx`
- Modify: `packages/pivot/src/grid/windowing.ts`, `packages/pivot/src/grid/windowing.test.ts`, `packages/pivot/src/PivotGrid.web.tsx`

**Interfaces:**

- Consumes: `GridRow`, `GridCell` (`grid/model`), `useTheme` di `@its/glowup-ui`.
- Produces (`grid/windowing.ts`): `sameRange(a: { start: number; end: number }, b: { start: number; end: number }): boolean`.
- Produces (`grid/parts.tsx`): `type ThemeColors = ReturnType<typeof useTheme>["theme"]["colors"]`; `rowColors(row: { isTotal: boolean }, colors: ThemeColors): { background: string; color: string }` (totale: `primaryContainer` e `onPrimaryContainer`; altrimenti `surface` e `onSurface`); `cellLabel(cell: { error: string | null }, grid: Record<string, string>): string | undefined` (`"<grid.formulaError || 'Formula error'>: <error>"` o `undefined`); `messageText(loading: boolean, grid: Record<string, string>): string` (`grid.loading || "Processing…"` se `loading`, altrimenti `grid.empty || "No data to display"`); `ToggleArrow(props: { item: { canToggle: boolean; isExpanded: boolean; nodeKey: string }; size: number; color: string; collapse: string; expand: string; onToggle: (nodeKey: string) => void })` che dà `null` se `!canToggle`, altrimenti un `Pressable` con `accessibilityRole="button"`, `accessibilityLabel` `collapse` o `expand`, e un `Text` `"▾"`/`"▸"` del colore dato, largo `size`.

- [ ] **Step 1: Test che falliscono.** `windowing.test.ts`: `sameRange({start:0,end:10},{start:0,end:10})` è vero; con `end` o `start` diversi è falso. `parts.test.tsx`: `rowColors({isTotal:true}, colors)` dà i colori di totale e `{isTotal:false}` quelli normali (con `colors` preso da `useTheme` dentro un `renderHook` con `ThemeProvider`, o da un oggetto con quei quattro token); `cellLabel({error:"boom"}, {})` è `"Formula error: boom"`, con `{formulaError:"Err"}` è `"Err: boom"`, `cellLabel({error:null},{})` è `undefined`; `messageText(true,{})` è `"Processing…"`, `messageText(false,{})` è `"No data to display"`, con `{empty:"Vuoto"}` è `"Vuoto"`; `ToggleArrow` con `canToggle:false` non rende nulla, con `canToggle:true, isExpanded:true` rende un bottone con etichetta `"Collapse"` e, premuto, chiama `onToggle("k")`.
- [ ] **Step 2: Eseguirli e vederli fallire** (`npm test -w @its/glowup-pivot -- src/grid/parts src/grid/windowing`). Atteso: FAIL, funzioni non definite.
- [ ] **Step 3: Implementare** `sameRange` e `parts.tsx` con le firme sopra; **rifare `PivotGrid.web.tsx`** perché usi `rowColors`, `cellLabel`, `messageText` e `ToggleArrow` al posto del suo codice identico (l'aspetto e i `testID` non cambiano).
- [ ] **Step 4: Eseguire** `npm test -w @its/glowup-pivot`: tutti i test passano, compresi i 10 di `pivotGrid.web.test.tsx` senza modifiche; `npm run lint`, `npm run type-check -w @its/glowup-pivot`.

### Task 2: Il disegno nativo

**Files:**

- Modify: `packages/pivot/src/PivotGrid.tsx` (riscritto), `packages/pivot/src/__tests__/pivotGrid.native.test.tsx` (riscritto)

**Interfaces:**

- Consumes: `usePivotGrid`, `visibleRange`, `sameRange`, `gridSizes`, costanti di `layout.ts`, le parti del Task 1, `gridStrings` di `model.ts`, `PivotGridProps`.
- Produces: `PivotGrid` (export di default) con le stesse prop del web. Struttura e `testID` (contratto dei test e dello script): `pivot-grid` (contenitore, `onLayout`, altezza `height`); `pivot-corner`; `pivot-header-clip` (taglia) con dentro `pivot-header-track` (`Animated.View`, `translateX = -x`); `pivot-label-clip` (taglia) con dentro `pivot-label-track` (`Animated.View`, `translateY = -y`, spaziatore sopra, righe di freccia e etichetta, spaziatore sotto); `pivot-body-x` (`Animated.ScrollView` orizzontale, evento nativo su `contentOffset.x`) che contiene `pivot-body-y` (`Animated.ScrollView` verticale, evento nativo su `contentOffset.y` con un `listener` che aggiorna la finestra); righe `pivot-row-<key>` (solo celle dei numeri, nel corpo), `pivot-chevron-<key>` e `pivot-label-<key>` (nella colonna delle etichette), celle `pivot-cell-<key>-<indice>`. Gli `Animated.Value` sono creati una volta (`useRef`).
- Il `accessibilityLabel` del contenitore dei numeri non c'è; il contenitore `pivot-grid` ha `accessibilityLabel="Pivot grid"` (lo script Android lo cerca).

- [ ] **Step 1: Test che falliscono** in `pivotGrid.native.test.tsx` (`ThemeProvider`, un engine con dati inventati come in `pivotGrid.web.test.tsx`, stessi `META`/`ROWS`):
  - `"shows the header, the labels and the numbers"`: `findByText("Total")`, `"A"`, `"12"`, `"23"`.
  - `"opens and closes a row, and a column group"`: premere `getAllByLabelText("Collapse")[0]` toglie `"y"`; `"Expand"` lo rimette; con colonne `flag` e `cat` e un gruppo chiuso, premere `"Expand"` mostra la colonna figlia (come nel test web).
  - `"the fixed parts sit in clipped boxes moved by animated values"`: `pivot-header-clip` e `pivot-label-clip` hanno `overflow: "hidden"`; `pivot-header-track` e `pivot-label-track` hanno una `transform` con `translateX` e con `translateY` rispettivamente; `pivot-body-x` ha `horizontal` e `pivot-body-y` ha `nestedScrollEnabled`.
  - `"mounts only the rows of the window, and moves it with a scroll"`: 10.000 righe (`S00000`…): righe `pivot-row-*` montate meno di 60; chiamando `props.onScroll({ nativeEvent: { contentOffset: { x: 0, y: 100000 } } })` di `pivot-body-y` dentro `act`, compare `S03124` e sparisce `S00000`.
  - `"after a deep scroll, closing a group still leaves the last rows mounted"`: engine con 60 sedi con categorie (tutto aperto), scorrere a `y` molto grande, premere `"Collapse"` di una sede visibile e chiudere finché le righe totali sono poche → ci sono ancora righe `pivot-row-*` montate e l'ultima etichetta compare.
  - `"narrow container: the fixed columns shrink"`: dopo `onLayout` di `pivot-grid` con larghezza 310 (dentro `act`), `pivot-chevron-<key>` largo 28, `pivot-label-<key>` largo 124, `pivot-corner` largo 152, la cella dei numeri larga `max(84, floor((310 - 152) / 3))`.
  - `"no data and loading show their message"`: engine senza dati → `"No data to display"`; con 5.001 righe (timer finti, come nei test dell'hook) → prima `"Processing…"`.
  - `"a cell with a formula error is announced, not counted"`: come nel test web (`jest.spyOn` su `buildGridModel`), `findByLabelText(/boom/)`.
- [ ] **Step 2: Eseguirli e vederli fallire** (`npm test -w @its/glowup-pivot -- pivotGrid.native`): oggi `PivotGrid.tsx` mostra solo un messaggio.
- [ ] **Step 3: Implementare `PivotGrid.tsx`** con la struttura dell'interfaccia sopra. Eventi: `Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: true })` sul corpo orizzontale; `Animated.event([{ nativeEvent: { contentOffset: { y } } }], { useNativeDriver: true, listener })` sul corpo verticale, dove `listener` ricava `scrollTop` e, solo se `sameRange(nuovo, attuale)` è falso, aggiorna lo stato della finestra. Altezza del corpo e del riquadro delle etichette: `height - HEADER_HEIGHT`. Larghezza del contenuto dei numeri: `colonne × larghezza della cella`. Se jest segnala che il driver nativo manca, aggiungere in `jest.setup.js` del pacchetto il mock di `NativeAnimatedHelper` (come si fa in React Native) invece di toccare il codice.
- [ ] **Step 4: Eseguire** `npm test -w @its/glowup-pivot` (tutti verdi, web compreso), `npm run lint`, `npm run type-check -w @its/glowup-pivot`, `npm run build -w @its/glowup-pivot`, `npm run validate-package -w @its/glowup-pivot`.

### Task 3: Controllo sul telefono: `/native-check`, script Android, iOS

**Files:**

- Modify: `apps/playground/app/native-check.tsx`, `apps/playground/__tests__/native-check.test.tsx`, `scripts/android-interact.mjs`, `apps/playground/CLAUDE.md`

**Interfaces:**

- Consumes: `PivotGrid`, `usePivotGrid` da `@its/glowup-pivot`, `samplePivotEngine` (`site/samplePivot.ts`).
- Produces (testo a schermo, letto dallo script): una `Text` `pivot=<n>` con `n` = numero di righe del modello della griglia (`usePivotGrid(engine).model.rows.length`; iniziale 31 per i dati di esempio: 1 totale, 6 sedi, 24 categorie); la `PivotGrid` ha `accessibilityLabel="Pivot grid"` e `height={240}`. Una riga di misura `pivot grid is laid out at its height` (`PASS` se il `onLayout` del contenitore dà 240) con il suo `NATIVECHECK`.
- Produces (script): un passo `"a tap on a pivot arrow closes a group, also after the grid was scrolled"` e uno `"the pivot header stays in place while the rows scroll"`.

- [ ] **Step 1: Test che fallisce** in `native-check.test.tsx`: la schermata mostra `pivot=31` e la riga `PENDING pivot grid is laid out at its height` (jest non fa il layout).
- [ ] **Step 2: Eseguirlo e vederlo fallire**, poi **implementare** la sezione in `native-check.tsx` dopo le ciambelle (prima di «Interaction»): la griglia, la `Text` `pivot=<n>` e la riga di misura; una posizione in più nel ciclo di scorrimento di iOS (`pivotAt`, come `chartsAt` e `pdfAt`). Eseguirlo di nuovo: passa.
- [ ] **Step 3: Passi dello script Android** (`scripts/android-interact.mjs`), nello stile di `tapChart`: (a) portare in vista il nodo con `desc` `"Pivot grid"` (`bring`), toccare la prima freccia con `desc` `"Collapse"` dentro il suo riquadro, aspettare 700 ms, e aspettarsi `pivot=<n>` con `n` minore di 31 (`expectText`), poi toccare `"Expand"` e aspettarsi di nuovo `pivot=31`; (b) con un gesto di trascinamento verticale dentro il riquadro della griglia (`adb shell input swipe` con le coordinate prese dal riquadro), controllare che il nodo di intestazione (testo `"Total"` dentro il riquadro) abbia ancora la `t` del riquadro (± 6 px), poi **toccare una freccia dopo lo scorrimento** e aspettarsi che `pivot=` cambi. Foto: `android-pivot-scrolled.png` e `android-pivot.png`. Il conteggio dei passi nel messaggio finale si aggiorna da solo.
- [ ] **Step 4: Documenti** `apps/playground/CLAUDE.md` (la sezione di `/native-check` ha una parte nuova: griglia pivot, `pivot=<n>`, i due passi, il ciclo iOS con una posizione in più).
- [ ] **Step 5: Verificare** `npm test -w @its/glowup-playground` (tutto, con `--maxWorkers=2` se va in timeout), `npm run lint`, `npm run type-check -w @its/glowup-playground`. La parte nativa vera la leggerà la CI e l'emulatore (Task 4).

### Task 4: Emulatore, documenti, verifica finale e commit

**Files:**

- Modify: `packages/pivot/CLAUDE.md`, `packages/pivot/README.md`, `docs/solaris-native.md`, `docs/handoff/2026-10-23.md`, `apps/playground/app/pivot.tsx` (frase sul telefono)

- [ ] **Step 1: Emulatore Android in locale** (se `adb devices` mostra un dispositivo; altrimenti si scrive nel registro e nell'handoff «non provato sull'emulatore: serve che Alice lo accenda» e si va avanti): ricetta in memoria `android-emulator-local-recipe`; aprire la schermata `/native-check` (o `/pivot`), controllare a 390 × 844: la griglia si vede, si scorre in tutte e due le direzioni con intestazione ed etichette ferme, la freccia risponde **dopo** lo scorrimento (`adb shell input tap`), 10.000 righe non rallentano. Screenshot e `uiautomator dump`. Se le frecce non rispondono dopo lo scorrimento, **non si dà il pezzo per fatto**: si registra come difetto e si cambia il modo di spostare le etichette (ridisegnare le etichette dalla finestra e spostare solo il corpo), con un test prima.
- [ ] **Step 2: Documenti.** `packages/pivot/CLAUDE.md` (il disegno nativo: due scorrimenti annidati, `Animated` col driver nativo per intestazione ed etichette, `sameRange`, parti condivise in `grid/parts.tsx`, niente Reanimated), `README.md` (stato del pezzo 3), `docs/solaris-native.md` (pezzo 3 fatto o fatto «da leggere in CI»), la frase di `app/pivot.tsx` («in the iOS and Android app it is not available yet» non è più vera), e `docs/handoff/2026-10-23.md` (sezione del pezzo 3: cosa è fatto, cosa è provato dove, prossimo passo: leggere gli artifact del primo giro di CI con la griglia, guardando gli screenshot).
- [ ] **Step 3: Verifica su tutto il repo, una voce per volta:** `npm run lint`, `npm run type-check`, `npm run build`, `npm test` (se un test del playground o del pacchetto va in timeout da 30 s, rilanciare quel workspace da solo prima di concludere).
- [ ] **Step 4: Commit unico** `feat(pivot): native grid for iOS and Android and its native check` con tutti i file (nessun push).
