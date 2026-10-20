# Provenienza del codice copiato in `@its/glowup-charts`

Riguarda `packages/charts/src/vendor/d3/`. Decisione e motivi: `docs/charts-package-plan.md` §2. Regole di lavoro: `packages/charts/CLAUDE.md`.

Scale e tracciati dei grafici sono il sorgente di **d3** copiato nel pacchetto, non una dipendenza. Tutti i pacchetti sono di
Mike Bostock (Observable, Inc.) con licenza **ISC**: il file `LICENSE` di ciascuno sta accanto al suo codice.

## Origine

I sorgenti (`src/`) sono stati presi dai tarball di npm del 2026-10-20 (`npm pack`, in una cartella a parte, senza eseguire
niente), poi copiati con uno script una tantum (non nel repository).

| Cartella in `vendor/d3/` | Pacchetto e versione   | Cosa si è copiato                                                                                                                    |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `d3-scale`               | `d3-scale` 4.0.2       | `linear`, `band`, `ordinal`, `time`, `utcTime` e i file che importano (10 file, circa 450 righe)                                     |
| `d3-shape`               | `d3-shape` 3.2.0       | `line`, `area`, `arc`, `pie`, `stack`; curve lineare, monotona (X e Y), naturale, a gradini; `offset` e `order` di `stack` (27 file) |
| `d3-path`                | `d3-path` 3.1.0        | intero                                                                                                                               |
| `d3-array`               | `d3-array` 3.2.4       | solo `bisect`, `bisector`, `ascending`, `descending`, `range`, `ticks`, `tickIncrement`, `tickStep`                                  |
| `d3-time`                | `d3-time` 3.1.0        | gli intervalli e i `ticks` del tempo, locali e UTC                                                                                   |
| `d3-interpolate`         | `d3-interpolate` 3.0.1 | solo `number` e `round`                                                                                                              |
| `internmap`              | `internmap` 2.0.3      | intero (lo usano `d3-array` e `ordinal`)                                                                                             |

**Non copiati:** `d3-format`, `d3-time-format` e `d3-color` (numeri, date e colori si formattano con `Intl` e con i token del
tema), i tracciati radiali, `link`, `symbol`, le altre curve.

## Differenze volute

Tutto il resto è identico all'originale, riga per riga.

1. **`d3-scale/linear.js`**: tolto `tickFormat` (import e metodo `scale.tickFormat`). Si formatta con `Intl`.
2. **`d3-scale/time.js`**: tolto `d3-time-format`, il parametro `format` di `calendar`, le otto formattazioni e la funzione
   `tickFormat`, il metodo `scale.tickFormat`. Restano `ticks`, `nice`, `invert` e `copy`.
3. **`d3-scale/utcTime.js`**: tolto l'argomento `utcFormat`.
4. **`d3-scale/continuous.js`**: l'interpolazione predefinita è `interpolateNumber` e non quella generica (che interpola anche i
   colori e richiederebbe `d3-color`). Una scala continua interpola quindi solo numeri; chi vuole altro usa `scale.interpolate(f)`.
5. **Import**: ogni `from "d3-xxx"` diventa un percorso relativo (`../d3-xxx/index.js`).
6. **`index.js` di ogni cartella**: rigenerato dall'originale tenendo solo le esportazioni dei file copiati.
7. **Due file nostri**: `vendor/d3/index.js` (l'unica porta d'ingresso del pacchetto) e `vendor/d3/index.d.ts` (i tipi della
   parte che usiamo; i tipi di d3 non compaiono mai nell'API pubblica, `src/core/` li avvolge).
8. **Fuori da Prettier e ESLint** (`.prettierignore`, `eslint.config.js`) e fuori dalle dichiarazioni generate
   (`tsconfig.build.json`): il codice è JavaScript così come arriva.

Un test (`src/__tests__/vendor.test.ts`) prova che la copia gira sotto jest senza configurazione e che dà i risultati
documentati da d3 (ticks, bande, date, linee, aree, torta, pila).

## Come si aggiorna

A mano e di rado, mai con `npm update`: scaricare il tarball della versione nuova in una cartella a parte, rifare la copia dello
stesso insieme di file, riapplicare le differenze sopra, far girare il test e aggiornare le versioni di questa pagina.
