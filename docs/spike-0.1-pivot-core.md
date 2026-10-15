# Spike 0.1 — core di AuraPivot in Glowup

Fase 0 di `docs/solaris-native.md`. Domanda: **il core di AuraPivot (D8) gira in un ambiente React Native
senza riscritture, e con quali modifiche alla copia?**

**Stato: fatto su Android (Hermes reale, emulatore in CI); iOS in attesa del prossimo giro.** Il benchmark gira nel workflow
`native.yml`, su un emulatore Android x86_64 di un runner GitHub (2026-10-15, run del commit `14a148f`): tempi
indicativi, **non di un telefono**. Su iOS il link diretto ha fatto comparire "Open in Glowup?" e il benchmark non è partito:
ora la schermata la apre l'app da sola (correzione fatta, non ancora eseguita).

## Come è stato fatto

Copia di `pivot-core/`, `options/` e `localization/` da `AuraPivot-master` (2.6.0) in
`apps/playground/spikes/` (cartella di lavoro, **non committata e da cancellare**; la repo AuraPivot non è stata
toccata). Per rifarlo:

1. `cp -r <AuraPivot>/{pivot-core,options,localization} apps/playground/spikes/`
2. in ogni `*.test.ts`: togliere la riga `import … from 'vitest'` e sostituire `vi.` con `jest.`
3. `npx jest spikes` dal playground (preset `jest-expo`)

## Esito

### Cosa funziona

| Verifica                                                       | Risultato                                                                                                                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Test del core sotto jest (`jest-expo`, **sorgente invariato**) | **150 test su 150 passano** in 10 file (engine, matrix, tree, filter, formula, security, localizzazione, cache `Intl`, adattatore opzioni)      |
| Compilazione con `hermesc` (compilatore di Hermes)             | Il bundle del core compila in bytecode: 38,7 KB di JS minificato → 91 KB di `.hbc`. Il bundle JS è 37,8 KB (12,9 KB gzip) con `exceljs` escluso |
| API del browser nel core                                       | Solo `ExcelExporter.ts` (`document`, `Blob`, `URL.createObjectURL`). Il resto del core non usa il DOM                                           |

### Prestazioni (Node 24 / V8 su questa macchina, **non Hermes**)

Dataset sintetico: 6 campi (4 stringa, 1 data, 2 numeri), colonne con gerarchia di date (`callDate.Year` e
`.Month`), misure `sum` e `avg`. Foglie di riga espanse: quelle del livello iniziale (45 e 181), non tutte.

| Righe  | `setData` | `processMatrix` (2 livelli di riga × 2 di colonna) | dopo `markDirty` | agenti × prodotti (181 foglie di riga) |
| ------ | --------- | -------------------------------------------------- | ---------------- | -------------------------------------- |
| 5.000  | 15 ms     | 47 ms                                              | 26 ms            | 35 ms                                  |
| 50.000 | 105 ms    | 218 ms                                             | 220 ms           | 351 ms                                 |

Su V8 il motore è già ampiamente sotto i 400 ms a 50.000 righe. **Hermes non ha il JIT**: per codice di questo
tipo mi aspetto un fattore di rallentamento rilevante, ma **non l'ho misurato**, quindi non so dire se a 50.000
righe sul telefono resti accettabile. È il motivo per cui la prova su Hermes è il pezzo mancante.

### Modifiche necessarie alla copia (elenco per la Fase 7)

1. **Esportazione Excel fuori dal core.** `ExcelExporter.ts` usa DOM e `import("exceljs")`; il barrel
   `pivot-core/index.ts` lo esporta e `PivotEngine.exportExcel` lo chiama. Va in un file/entry a parte, importato
   solo dove serve, così Metro non risolve `exceljs` nel bundle nativo. Nota: `hermesc` rifiuta la sintassi
   `import()`; in un'app vera la trasforma Metro, ma conferma che l'import dinamico non deve stare nel percorso
   nativo.
2. **`locale` esplicito.** `CellFormatter.ts:376` e `DateFormatter.ts:109` leggono `navigator.language` (con
   guardia `typeof`): su RN `navigator.language` non c'è e cade su `en-US`. L'engine ha già `setLocale`
   (`PivotEngine.ts:576`). **Non verificato** che ogni punto di chiamata lo passi.
3. **Test.** Porting meccanico da vitest a jest (vedi sopra). Non portati: il test dell'esportatore (richiede un
   ambiente DOM e `exceljs`), `localization/dictionaries.test.ts` (usa `import.meta.glob` di Vite) e il test
   del hook `usePivotMatrix` (gli hook non sono stati copiati).
4. Le gerarchie di date usano i getter in ora locale (`getFullYear`, `getMonth`…): stesso comportamento del web,
   ma su un dispositivo con fuso diverso dal server cambiano i bucket di giorno. Da tenere presente, non da
   cambiare.

### Su Hermes reale (Android, emulatore x86_64 su runner CI, Hermes 250829098.0.17, build Release)

`Intl` funziona in tutto ciò che il core usa: numeri `it-IT` (`1.234.567,891`), `formatToParts`, valuta (`1.234,50 €`),
percentuale (`26%`), date `it-IT`, nomi di mese e giorno in italiano, `localeCompare` con `numeric` e con accenti
(`àncora, Ancora, ape, zeta`). `navigator.language` è `undefined` e il locale risolto è quello del dispositivo (`en-US` sul
runner): **conferma la modifica 2** (serve un `locale` esplicito).

| Righe  | `setData` | `processMatrix` (3 esecuzioni) | agenti × prodotti |
| ------ | --------- | ------------------------------ | ----------------- |
| 5.000  | 32 ms     | 386 / 260 / 214 ms             | 648 ms            |
| 50.000 | 295 ms    | 707 / 1.191 / 748 ms           | 1.178 ms          |

A 50.000 righe Hermes impiega circa 3–5 volte il tempo di V8 (qui 0,7–1,2 s contro 0,2–0,35 s). Con 5.000 righe
l'aggiornamento è sotto mezzo secondo. Un ricalcolo di circa un secondo blocca il thread JavaScript: per dataset grandi
la UI del pivot dovrà mostrare uno stato di caricamento e non ricalcolare a ogni tocco.

### Non verificato

- **iOS** su Hermes (il giro con la correzione deve ancora girare) e **qualsiasi telefono vero**: i tempi sopra vengono da
  una macchina virtuale condivisa, non dal tuo dispositivo.
- Hook (`usePivotMatrix`, `engineStore`) e contesto React: non copiati né provati.
- Bundle di un'app Expo vera (Metro) con il core dentro.

## Conseguenze per il piano

- **D8 regge**: sul piano statico, nei test e su Hermes reale (Android): il core non ha bisogno di riscritture, solo dei
  punti 1–2. Prestazioni e UX per dataset grandi vanno progettate (vedi sopra).
- Resta la conferma su iOS.
- La Fase 7 parte con l'elenco al punto "Modifiche necessarie" come lavoro di porting.

## Appendice — script del benchmark

Bundle con `esbuild --bundle --platform=node --external:exceljs` ed esecuzione con Node. Il dataset è un array
la cui prima riga descrive i campi (`{ campo: { type, caption } }`) e le successive sono oggetti.

```ts
const rows = Array.from({ length: n }, (_, i) => ({
  region: REGIONS[i % 4],
  product: PRODUCTS[(i * 7) % 40],
  agent: AGENTS[(i * 13) % 60],
  callDate: new Date(
    Date.UTC(2023 + (i % 3), i % 12, (i % 27) + 1),
  ).toISOString(),
  amount: (i * 137) % 9000,
  calls: (i * 5) % 31,
}));
engine.setData([metadata, ...rows]);
engine.setSlice({
  rows: [{ uniqueName: "region" }, { uniqueName: "product" }],
  columns: [{ uniqueName: "callDate.Year" }, { uniqueName: "callDate.Month" }],
  measures: [
    { uniqueName: "amount", aggregation: "sum" },
    { uniqueName: "calls", aggregation: "avg" },
  ],
});
engine.processMatrix();
```
