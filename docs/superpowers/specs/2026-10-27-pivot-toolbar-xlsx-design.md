# Pivot: barra con esportazione .xlsx, schermo intero e ripristino

Data: 2026-10-27. Pacchetto: `packages/pivot` (privato, nessun changeset finché non è pubblicato).

## Perché

Decisione di Alice (27/10): per ora il pivot resta **una tabella che mostra i dati ed è esportabile**, come la tabella della
pagina WaveActivitiesReport del CRM. Il pannello dei campi, i formati, i campi calcolati, il drill-through e le configurazioni
salvate restano fuori finché non servono.

La tabella del CRM (`Pages/WaveActivitiesReport` → `PivotWrapper` → `Components/PivotTable`, AuraPivot) ha una
configurazione fissa (righe filiale → sezione aperte, colonne «Is Target» e conteggio, somma di `count`) e una barra
ridotta da `getCustomizedToolbar`: a sinistra Fields e Format, a destra **Reset**, **Export** (solo Excel) e **Fullscreen**.
La griglia di `packages/pivot` ha già la stessa forma e gira su web, Android e iPhone. Mancano i tre pulsanti di destra.

## Obiettivi e non obiettivi

- **Sì:** una barra sopra la griglia con **Esporta in Excel**, **Schermo intero** e **Ripristina**; esportazione **.xlsx
  sempre**, anche su iOS e Android; il file con lo stesso aspetto di quello di AuraPivot.
- **No:** Fields, Format, configurazioni salvate, filtri, CSV, `exceljs`.
- **Anti-obiettivo:** una dipendenza nuova, o un'esportazione che funziona sul web ma non sul telefono.

## Approcci

- **A. Uno scrittore .xlsx nostro in `packages/pivot` (scelto da Alice).** Un .xlsx è uno zip di pochi XML: TypeScript puro,
  stessi byte su web e telefono, nessuna dipendenza, verificabile in jest riaprendo il file.
- **B. `exceljs` come AuraPivot.** Sul web funziona; sul telefono servono polyfill di `Buffer` e degli stream di Node in Hermes,
  mai provati; circa 900 KB. Scartato.
- **SheetJS.** Non è più sul registro npm e gli stili sono a pagamento. Scartato.

## Il design

### Il file

- `src/export/zip.ts`: `zipStored(files: { name: string; data: Uint8Array }[]): Uint8Array`, zip senza compressione
  (metodo 0) con CRC-32. Senza compressione il file è più grande ma resta piccolo per un pivot, e niente deflate da scrivere.
- `src/export/xlsx.ts`: `gridToXlsx(model: GridModel, options?: { sheetName?: string }): Uint8Array`. Legge il **modello della
  griglia** (`buildGridModel`), cioè esattamente quello che c'è a schermo: righe aperte e chiuse come le ha lasciate la persona.
  Come AuraPivot:
  - prima riga: una cella vuota e l'etichetta di ogni colonna, sfondo `#1D5B9D`, testo bianco in grassetto, centrato;
  - una riga per riga visibile: l'etichetta rientrata di due spazi per livello, poi i valori. Un numero va come numero (`value`),
    una cella con errore come testo; nessuna formula, mai;
  - righe di totale in grassetto su `#E3E8F1`;
  - larghezza delle colonne sul testo più lungo, da 10 a 40 caratteri.
  - Testi con `&`, `<`, `>`, `"` e caratteri di controllo resi validi in XML; nome del foglio ripulito e corto (31 caratteri).
- `src/export/save.web.ts` e `src/export/save.ts`: `saveXlsx(bytes, fileName)`. Web: `Blob` e un `<a download>` (come
  AuraPivot). iOS e Android: scrive il file nella cache con `expo-file-system` e apre la condivisione con `expo-sharing`,
  caricati solo al momento e **peer opzionali** come in `packages/pdf`; se mancano, un errore leggibile, non un crash.
- Tutto esportato anche a parte (`gridToXlsx`, `saveXlsx`), per un'app che vuole il proprio pulsante.

### La barra

- `PivotGrid` riceve `toolbar?: boolean` (predefinito `false`, nessuna rottura) e `fileName?: string` (predefinito
  `"pivot.xlsx"`).
- Tre `IconButton` di `@its/glowup-ui` a destra, con le scritte già presenti nelle traduzioni (`toolbar.exportExcel`,
  `toolbar.fullscreen` / `toolbar.exitFullscreen`, `buttons.reset`), inglese e italiano:
  - **Esporta in Excel**: `gridToXlsx` sul modello attuale, poi `saveXlsx`; un errore resta visibile sotto la barra.
  - **Schermo intero**: la stessa griglia dentro il `Dialog` della libreria con `fullScreen`; il pulsante diventa «Esci da schermo
    intero».
  - **Ripristina**: rimette il report che il motore aveva quando la griglia è comparsa (`getReport()` al primo render,
    `setReport()` al tocco): gruppi aperti e ordinamento di partenza.
- Stessa barra su web e telefono.

### Playground

- La pagina Pivot passa a `toolbar` e toglie dal banner «esportazione» dalle cose che mancano. I dati restano quelli inventati
  (siti e categorie), che hanno già la forma della tabella del CRM.
- `/native-check`: `toolbar` sulla griglia; sul telefono un passo dello script Android tocca «Esporta in Excel» e controlla
  che si apra la condivisione (screenshot). iOS: solo che la barra si disegni.

## Verifica

- Jest: CRC-32 su un valore noto; lo zip riletto da un piccolo lettore nei test (nomi, contenuti, CRC); l'XML del foglio
  (celle numero e testo, stili dell'intestazione e dei totali, rientri, larghezze, caratteri speciali); `saveXlsx` web con un
  `document` finto e nativo con moduli finti; la barra (tre pulsanti, schermo intero, ripristino dopo aver chiuso un gruppo).
- A mano: il file scaricato dal playground si apre con `Expand-Archive` e gli XML si leggono con `[xml]` di PowerShell; Excel
  vero non è su questo portatile.
- CI: Android tocca l'esportazione; iPhone mostra la barra.

## Lasciato a chi costruisce

- Le icone esatte (proposte: `microsoft-excel`, `fullscreen` / `fullscreen-exit`, `restore`).
- Il nome del foglio predefinito (`"Pivot"`, come AuraPivot).
