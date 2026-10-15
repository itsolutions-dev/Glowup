# Spike 0.1 — core di AuraPivot in Glowup

Fase 0 di `docs/solaris-native.md`. Domanda: **il core di AuraPivot (D8) gira in un ambiente React Native
senza riscritture, e con quali modifiche alla copia?**

**Stato: parziale.** Fatto tutto ciò che si può provare su questa macchina (Windows, nessun emulatore). **Manca
l'esecuzione su Hermes**, che richiede un emulatore Android o un telefono: finché non c'è, `Intl` su Hermes e le
prestazioni reali su dispositivo restano non verificati.

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

### Non verificato

- **Esecuzione su Hermes** (Android e iOS): comportamento e tempi reali.
- **`Intl` su Hermes**: il core usa `Intl.NumberFormat` (con `formatToParts`), `Intl.DateTimeFormat` e
  `localeCompare` con locale e opzioni. Sotto jest girano sull'`Intl` completo di Node, che non è quello di Hermes.
- Hook (`usePivotMatrix`, `engineStore`) e contesto React: non copiati né provati.
- Bundle di un'app Expo vera (Metro) con il core dentro.

## Conseguenze per il piano

- **D8 regge sul piano statico e sui test**: il core non ha bisogno di riscritture, solo dei punti 1–2.
- Prima di dichiarare D8 verificata per il nativo serve una prova su Hermes con almeno 50.000 righe: è la
  chiusura di questo spike e richiede un emulatore o un telefono.
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
