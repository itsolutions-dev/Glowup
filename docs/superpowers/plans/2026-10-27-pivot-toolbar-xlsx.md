# Pivot: barra con esportazione .xlsx, schermo intero e ripristino — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `<PivotGrid toolbar />` mostra Esporta in Excel (un .xlsx su web, iOS e Android), Schermo intero e Ripristina.

**Architecture:** uno zip senza compressione e un foglio .xlsx scritti in TypeScript puro (`src/export/`), costruiti dal
`GridModel` che la griglia mostra; il salvataggio è per piattaforma (`save.web.ts` scarica, `save.ts` condivide con
`expo-file-system` + `expo-sharing` caricati al momento). La barra è un componente condiviso (`grid/PivotFrame.tsx`) che le due
griglie usano quando `toolbar` è acceso.

**Tech Stack:** React Native, `@its/glowup-ui` (`IconButton`, `Dialog`), jest-expo + Testing Library (asincrona), Expo SDK 57.

**Spec:** `docs/superpowers/specs/2026-10-27-pivot-toolbar-xlsx-design.md`

## Global Constraints

- Nessuna dipendenza nuova a runtime: `expo-file-system` ed `expo-sharing` sono **peer opzionali**, come in `packages/pdf`
  (`peerDependencies` `>=57` + `peerDependenciesMeta.optional` + `devDependencies` `~57.0.7` / `~57.0.22`), poi `npm install`
  e lockfile.
- Il pacchetto importa solo `@its/glowup-ui` per nome; niente `src/core` toccato (resta senza API web).
- Colori del file fissi come AuraPivot (`1D5B9D` intestazione, `FFFFFF` testo, `E3E8F1` totali): è il file del CRM, non il tema.
- `toolbar` predefinito `false`: senza, la griglia è identica a oggi.
- `await` su ogni `fireEvent`, `render`, `act`.
- Commit: uno solo alla fine (Task 5) su `dev`, niente push.

## Review Focus

1. **Testo con `&`, `<`, `"`, caratteri di controllo o emoji** nelle etichette: il file resta XML valido. Test in Task 2.
2. **Cella con errore di formula o valore mancante**: testo (o vuota), mai un numero inventato. Test in Task 2.
3. **Gruppi chiusi**: il file ha solo le righe visibili, come a schermo. Test in Task 2.
4. **Moduli Expo mancanti** (un'app solo web, o senza `expo-sharing`): un errore leggibile sotto la barra, non un crash. Test in
   Task 3 e Task 4.
5. **Nome file senza `.xlsx` o con `/ \ : * ? " < > |`**: estensione aggiunta, caratteri sostituiti. Test in Task 3.

---

### Task 1: zip senza compressione

**Files:** Create `packages/pivot/src/export/zip.ts`; Test `packages/pivot/src/export/zip.test.ts`

**Interfaces — Produces:** `crc32(data: Uint8Array): number`; `zipStored(files: { name: string; data: Uint8Array }[]): Uint8Array`;
`utf8(text: string): Uint8Array` (TextEncoder; Hermes lo ha).

- [ ] **Step 1: test** — `crc32(utf8("123456789")) === 0xcbf43926`; `crc32(new Uint8Array()) === 0`. Un lettore nel test
      (`readZip(bytes)`: scorre gli header locali `0x04034b50`, legge nome, metodo, CRC, dimensioni, dati; controlla la fine
      della directory centrale `0x06054b50` con il numero di voci) rilegge `zipStored([{name:"a.txt",data:utf8("ciao")},
    {name:"dir/b.xml",data:utf8("<x/>")}])` e trova i due file, metodo 0, CRC giusto, contenuto uguale.
- [ ] **Step 2:** `npm test -w @its/glowup-pivot -- zip` → FAIL (modulo mancante).
- [ ] **Step 3:** implementare (header locale, directory centrale, fine directory; nomi UTF-8 con il bit 11; data DOS fissa
      1980-01-01, così lo stesso input dà gli stessi byte).
- [ ] **Step 4:** stesso comando → PASS.

### Task 2: il foglio .xlsx dal modello della griglia

**Files:** Create `packages/pivot/src/export/xlsx.ts`; Test `packages/pivot/src/export/xlsx.test.ts`

**Interfaces — Consumes:** `zipStored`, `utf8` (Task 1); `GridModel` (`grid/model.ts`). **Produces:**
`gridToXlsx(model: GridModel, options?: { sheetName?: string }): Uint8Array`; `XLSX_MIME =
"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"`.

File nello zip: `[Content_Types].xml`, `_rels/.rels`, `xl/workbook.xml`, `xl/_rels/workbook.xml.rels`, `xl/styles.xml`,
`xl/worksheets/sheet1.xml`. Testi come `inlineStr` (niente sharedStrings). Stili: 0 normale, 1 intestazione (fill `FF1D5B9D`,
font bianco grassetto, centrato), 2 totale (fill `FFE3E8F1`, grassetto). Riga 1: cella vuota + `column.label`; poi per ogni
`model.rows`: `"  ".repeat(row.depth) + row.label`, poi per cella `value` numero se finito, altrimenti `text` (vuota se `""`).
`<cols>`: larghezza per colonna = `min(40, max(10, testo più lungo + 2))`. Nome foglio: via `[]:*?/\`, al massimo 31 caratteri,
`"Pivot"` se vuoto. XML: `& < > " '` sostituiti; caratteri di controllo (tranne tab, a capo) tolti.

- [ ] **Step 1: test** (modello fatto a mano nel test, due colonne, una riga di totale, una riga a profondità 1, una cella con
      `value: null, text: "#ERR"`, un'etichetta `A & <B> "c"\u0001`): il lettore del Task 1 (spostato in
      `export/testZip.ts`, solo test) trova i sei file; `sheet1.xml` contiene `<c r="B2" s="0"><v>5</v></c>` per il numero,
      `t="inlineStr"` con `#ERR` per l'errore, `A &amp; &lt;B&gt; &quot;c&quot;` senza `\u0001`, `s="1"` su tutta la riga 1,
      `s="2"` sulle celle della riga di totale, `"  x"` per la riga a profondità 1, `<col min="1" max="1" width="` con larghezza
      tra 10 e 40; `workbook.xml` ha `name="Pivot"`, e con `sheetName: "a/b:c*d?e[f]g" + "x".repeat(40)` un nome di 31
      caratteri senza i caratteri vietati. Un modello vero: `buildGridModel` di un engine come in `pivotGrid.native.test.tsx`
      con il gruppo `A` chiuso (`toggleExpanded`) → nel foglio non c'è la riga di `x`.
- [ ] **Step 2:** `npm test -w @its/glowup-pivot -- xlsx` → FAIL.
- [ ] **Step 3:** implementare.
- [ ] **Step 4:** → PASS.

### Task 3: salvare il file (web e telefono) e i peer opzionali

**Files:** Create `packages/pivot/src/export/save.ts`, `packages/pivot/src/export/save.web.ts`; Test
`packages/pivot/src/export/save.test.ts`; Modify `packages/pivot/package.json` (peer opzionali come `pdf`), `package-lock.json`.

**Interfaces — Produces:** `xlsxName(name?: string): string` (in `xlsx.ts`: `"pivot.xlsx"` se vuoto, caratteri `\/:*?"<>|`
→ `_`, `.xlsx` aggiunto se manca); `saveXlsx(bytes: Uint8Array, fileName: string, modules?: SaveModules): Promise<"downloaded" | "shared">`;
`type SaveModules = { files: () => Promise<typeof import("expo-file-system")>; sharing: () => Promise<typeof import("expo-sharing")> }`
(nativo; i test passano moduli finti, perché jest non ha `import()` dinamico). Errore: `PivotExportError` con `code:
"native-missing" | "unsupported"` e messaggio leggibile.

Nativo: `new File(Paths.cache, name)`, `create({ overwrite: true })`, `write(bytes)`, `Sharing.isAvailableAsync()` (falso →
`unsupported`), `shareAsync(file.uri, { mimeType: XLSX_MIME, UTI: "org.openxmlformats.spreadsheetml.sheet", dialogTitle: name })`.
Import fallito → `native-missing` («expo-sharing is not installed: add it to the app's dependencies…», come `pdf`). Web: Blob
con `XLSX_MIME`, `URL.createObjectURL`, `<a download>`, `click`, `revokeObjectURL` nel giro dopo (setTimeout 0).

- [ ] **Step 1: test** — `xlsxName()` → `"pivot.xlsx"`, `xlsxName("Report 10/27")` → `"Report 10_27.xlsx"`,
      `xlsxName("a.XLSX")` invariato. Nativo con moduli finti: scrive i byte esatti nel file `Report.xlsx` della cache, chiama
      `shareAsync` con quel URI e `XLSX_MIME`, risolve `"shared"`; `isAvailableAsync` falso → rifiuta con `code: "unsupported"`;
      `sharing` che rifiuta → `code: "native-missing"`. Web (import di `./save.web`) con `document.createElement`,
      `URL.createObjectURL`/`revokeObjectURL` finti: `a.download === "Report.xlsx"`, `click` chiamato una volta, Blob di tipo
      `XLSX_MIME` e della lunghezza dei byte, risolve `"downloaded"`.
- [ ] **Step 2:** `npm test -w @its/glowup-pivot -- save` → FAIL.
- [ ] **Step 3:** implementare; aggiungere i peer a `package.json`, `npm install`.
- [ ] **Step 4:** → PASS; `npm run type-check -w @its/glowup-pivot` pulito.

### Task 4: la barra (`toolbar`, `fileName`)

**Files:** Create `packages/pivot/src/grid/PivotFrame.tsx`; Modify `grid/props.ts`, `PivotGrid.tsx`, `PivotGrid.web.tsx`,
`index.ts`; Test `packages/pivot/src/__tests__/pivotToolbar.test.tsx`.

**Interfaces — Consumes:** `gridToXlsx`, `xlsxName`, `saveXlsx` (Task 2–3); `buildGridModel`. **Produces:**
`PivotGridProps.toolbar?: boolean`, `PivotGridProps.fileName?: string`; export da `index.ts` di `gridToXlsx`, `saveXlsx`,
`xlsxName`, `XLSX_MIME`, `PivotExportError`.

`PivotFrame({ Grid, engine, localization, height, fileName })`: una riga in alto con, a destra, tre `IconButton`
(`microsoft-excel`, `fullscreen`/`fullscreen-exit`, `restore`; `accessibilityLabel` da `toolbar.exportExcel`, `toolbar.fullscreen`
/ `toolbar.exitFullscreen`, `buttons.reset`, con «Export to Excel», «Fullscreen», «Exit Fullscreen», «Reset» se mancano), sotto
`<Grid engine localization height={height - altezza barra} />`. Esporta: modello costruito al tocco da `engine.processMatrix()`,
`getSlice()`, `getMetadata()`, `getLocale()`, `getFormat()` e `localization` (stessi argomenti di `usePivotGrid`), poi
`saveXlsx(gridToXlsx(model), xlsxName(fileName))`; un errore va in un testo sotto la barra (`testID="pivot-export-error"`),
tolto al tocco successivo. Schermo intero: `Dialog` di `@its/glowup-ui` con `fullScreen`, `open`, `onClose`, che contiene un
altro `PivotFrame` sulla stessa engine con il pulsante «Exit Fullscreen» che chiude. Ripristina: `useState(() => engine.getReport())`
al primo render, `engine.setReport(initial)` al tocco. Le due griglie: se `toolbar`, `return <PivotFrame Grid={PivotGrid} … />`
passando la griglia stessa senza `toolbar`.

- [ ] **Step 1: test** (engine come in `pivotGrid.native.test.tsx`, griglia del telefono):
      senza `toolbar` nessun pulsante «Export to Excel»; con `toolbar` i tre pulsanti per `accessibilityLabel`; con
      `localization={localizationIt}` «Esporta in Excel», «Schermo intero», «Ripristina»; tocco su «Collapse» di `A` poi su
      «Reset» → la riga `x` sotto `A` torna; «Fullscreen» → una seconda griglia dentro il dialog e «Exit Fullscreen», che lo
      chiude; «Export to Excel» con `saveXlsx` sostituito (`jest.mock("../export/save")`) → chiamato con un `Uint8Array` che inizia
      con `PK` e con `"pivot.xlsx"` (o `fileName` passato); `saveXlsx` che rifiuta con `PivotExportError("native-missing", …)` →
      il messaggio appare in `pivot-export-error`. Un test della griglia web (`PivotGrid.web`) che con `toolbar` mostra i tre
      pulsanti.
- [ ] **Step 2:** `npm test -w @its/glowup-pivot -- pivotToolbar` → FAIL.
- [ ] **Step 3:** implementare.
- [ ] **Step 4:** `npm test -w @its/glowup-pivot` → tutto PASS; `npm run type-check` pulito.

### Task 5: playground, CI, documenti, verifica e commit

**Files:** Modify `apps/playground/app/pivot.tsx` (`toolbar`, `fileName="pivot-sample"`, banner senza «export» tra le cose
mancanti, testo d'uso con `toolbar`), `apps/playground/app/native-check.tsx` (`toolbar` sulla griglia),
`scripts/android-interact.mjs` (passo: porta la griglia al centro, tocca il pulsante con descrizione «Export to Excel», attende,
foto `android-pivot-export.png`, controlla che nel dump ci sia la condivisione di Android: un nodo del pacchetto
`android` / `com.android.intentresolver` o il testo `pivot-sample.xlsx`/`pivot.xlsx`; poi `KEYCODE_BACK`),
`.github/workflows/native.yml` (`android-pivot*.png` già coperto), `packages/pivot/README.md` e `packages/pivot/CLAUDE.md`
(una riga: l'esportazione e la barra), `docs/solaris-native.md` fase 7 (decisione del 27/10: tabella più esportazione, il resto
fuori per ora), `docs/decisions.md`, `docs/handoff/2026-10-27.md`; il cambio generico della pagina Charts già pronto entra
nello stesso commit. Test: `apps/playground/__tests__/pivot-page.test.tsx` se esiste (altrimenti il test del catalogo che apre
la pagina) con l'attesa del pulsante «Export to Excel».

- [ ] **Step 1:** test della pagina → FAIL; modifiche → PASS.
- [ ] **Step 2:** `npm run lint && npm run type-check && npm test` → verde (lint 0 errori).
- [ ] **Step 3:** web (Playwright su `/pivot` a 1440 e 360 px): la barra, schermo intero e uscita, ripristino dopo aver chiuso
      un gruppo; esportazione con `page.waitForEvent("download")`, file salvato nella scratchpad, aperto con `Expand-Archive` e
      `sheet1.xml` letto con `[xml]` (righe, stili, larghezze).
- [ ] **Step 4:** handoff, poi commit su `dev`:

```
git add packages/pivot apps/playground scripts/android-interact.mjs docs package-lock.json
git commit -m "feat(pivot): a toolbar with an .xlsx export on web, iOS and Android, full screen and reset"
```
