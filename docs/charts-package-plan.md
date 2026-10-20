# Piano di `@its/glowup-charts`: i grafici, con il codice di d3 copiato e nessuna dipendenza

Riguarda la Fase 4 di `docs/solaris-native.md` e il lavoro A4 di `docs/work-split.md`. **Cambia la decisione D7** di quel
piano (che prevedeva `d3-scale` e `d3-shape` come dipendenze): vedi §2. Esito dello spike su cui poggiava D7: `docs/spike-0.4-bar-chart.md`.

Stato al 2026-10-20: **passi 0, 1, 2 e 3 fatti** (`BarChart` raggruppato, impilato e orizzontale, bersaglio, tooltip, `onSelect`,
pagina `/charts`, provato in Chrome). Dal passo 4 in poi niente. Il pacchetto non è mai girato su un telefono né nella CI nativa
(passo 8). Per la forma di un pacchetto di alto livello si prende `packages/pdf` (stesse regole di confine, `ADDON_PACKAGES` in
`eslint.config.js`, già pronte per `charts`).

---

## 1. Obiettivo e vincolo

Disegnare i grafici del CRM (barre, linee e aree, ciambella, barra impilata singola, sparkline, indicatore) su web, iOS e
Android con **un solo codice**, a partire da dati come array di oggetti per chiave di serie (`data`, `series`), lo stesso
formato di recharts.

Vincolo: **nessuna dipendenza di terzi nel `package.json`.** Si disegna con `react-native-svg`, che è già peer di
`@its/glowup-ui` (lo usano `Glyph` e `CircularProgress`). Scale e tracciati sono il codice di `d3` **copiato nel pacchetto**
(§2); il resto (cornice, assi, tooltip, componenti) lo scriviamo noi.

## 2. Cosa cambia rispetto a D7: `d3` si copia, non si installa

|            | D7 (spike 0.4)                            | Ora                                                                                                          |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Scale      | `d3-scale` come dipendenza                | **copia** di `d3-scale` 4.0.2 (lineare, a bande, tempo) in `src/vendor/d3/`                                  |
| Tracciati  | `d3-shape` come dipendenza                | **copia** di `d3-shape` 3.2.0 (linea, area, arco, torta, pila; curve lineare, monotona, a gradini, naturale) |
| Dipendenze | `d3-scale`, `d3-shape` (solo ESM)         | nessuna nel `package.json` (peer: `ui`, `react`, `react-native`, `react-native-svg`)                         |
| Jest       | serve `transformIgnorePatterns` per l'ESM | niente da configurare: il codice è nostro, nella cartella del pacchetto                                      |

Licenza: tutti i pacchetti `d3` coinvolti sono **ISC** (permissiva). Si copiano con l'intestazione di licenza e il nome
dell'autore in ogni file, e si registrano in `docs/charts-upstream.md` versione, origine e differenze volute (come
`docs/pivot-upstream.md` per il pivot).

**Cosa si copia** (sorgente `src/` di ciascun pacchetto, scaricato con `npm pack` in una cartella a parte):

- `d3-scale`: `linear`, `band`, `time`, `continuous`, `ordinal`, `nice`, `init`, `number`, `constant`. **Esclusa** `tickFormat`: i numeri
  e le date si formattano con `Intl` (§4), quindi non servono `d3-format` né `d3-time-format`.
- `d3-array`: solo `ticks`, `bisect`, `bisector`, `ascending`, `descending`, `range`, `extent`, `max`, `min`, `sum`, `permute`, `InternMap`.
- `d3-interpolate`: solo `number` e `round`. **Niente colori**: `d3-color` non serve, i colori vengono dai token.
- `d3-time`: gli intervalli e i ticks del tempo (`timeTicks`, `timeTickInterval`).
- `d3-shape`: `line`, `area`, `arc`, `pie`, `stack`, le curve elencate, gli `offset` e `order` di `stack`; **esclusi** i
  tracciati radiali, `link`, `symbol`, le altre curve.
- `d3-path`: intero (157 righe).

I file restano **JavaScript, così come sono** (salvo le differenze volute, annotate nel file e in `docs/charts-upstream.md`):
una cartella `src/vendor/d3/` esclusa da Prettier e dal lint, con un `index.d.ts` scritto da noi per la parte che usiamo.
L'API pubblica del pacchetto **non espone mai** i tipi di `d3`: `core/` li avvolge in funzioni tipate nostre.

Costo: circa 1.500 righe copiate da leggere se qualcosa cambia a monte. Si aggiornano **a mano e di rado**, non con
`npm update`. Vantaggio: codice collaudato per ticks "belli", curva monotona e archi, senza riscriverlo.

## 3. Cosa si fa e cosa no

Prima ondata, dalla Fase 4: `BarChart` (raggruppato, impilato, orizzontale, linea del bersaglio), `LineChart` e `AreaChart`
(più serie, curva, marcatori toccabili), `DonutChart`/`PieChart`, `StackedBar`, `Sparkline`, `ChartLegend` (toccabile per
nascondere una serie) e la facciata `Chart` con `type`.

- **`Gauge`/indicatore a soglie:** prima di scriverlo si verifica se bastano nuove prop su `CircularProgress` di `ui`
  (regola "estendere prima di creare"); la prova va dichiarata nel commit. Se serve una modifica a `ui`, è del collega.
- **Seconda ondata** (`ScatterChart`, `AreaRange`): solo se il CRM li chiede. **`TimelineChart`:** rinviato (un solo uso).
- **Non si fa:** zoom e pan, brush, 3D, mappe.

## 4. Comportamento comune

- **Misura da `onLayout`**, mai `ResizeObserver`. Il primo frame a larghezza 0 non deve rompere il grafico. Lo `Svg` sta in
  posizione assoluta dentro un contenitore che si dimensiona da solo (l'insidia dello spike: altrimenti il contenitore non
  si restringe più).
- **Tooltip** al tocco e al passaggio del mouse su web; per `onSelect` e il tooltip si usa il componente `Tooltip` di `ui`
  dove basta, altrimenti un piccolo livello nostro.
- **Colori solo dai token.** Oggi la palette dei grafici **non esiste** in `theme.colors` (contratto B0, di `ui`, del
  collega). Finché non c'è: le serie prendono i colori da una lista di ruoli esistenti (`primary`, `secondary`, `tertiary`
  e i loro contenitori) e ogni grafico accetta `colors` per sostituirla. Quando B0 arriva, si cambia solo il valore di
  default. **Nessun colore scritto a mano nel pacchetto.**
- **Numeri e date** con `Intl` (`formatValue`, `locale` espliciti, mai il locale del telefono per default nascosto).
- **Stati** `loading` (`Skeleton` di `ui`) e `empty`; animazione d'ingresso spenta con `useReduceMotion` (già esportato da `ui`).
- **Accessibilità:** `accessibilityLabel` con un riassunto testuale e una modalità "tabella" per lo screen reader.
- **Dati densi:** sopra una soglia di punti una serie diventa **un solo `<Path>`** invece di un nodo per barra (lo spike: web
  a 10.000 rettangoli circa 0,3–0,5 s, sul nativo atteso peggio). La soglia si misura, non si indovina.

## 5. Struttura

```
packages/charts/src/
  vendor/d3/   copia di d3 (§2), JavaScript, con index.d.ts
  core/        scales.ts  paths.ts  format.ts  palette.ts  summary.ts   (avvolgono d3 con tipi nostri, funzioni pure, con test)
  hooks/       useChartSize.ts
  ChartFrame.tsx  Axis.tsx  Grid.tsx  ChartTooltip.tsx  ChartLegend.tsx
  BarChart.tsx  LineChart.tsx  AreaChart.tsx  DonutChart.tsx  StackedBar.tsx  Sparkline.tsx  Chart.tsx
  index.ts
```

`core/` e `vendor/` non importano React né `react-native-svg`: si provano con test puri. I componenti sono solo disegno e tocco.

## 6. Passi di lavoro

Ogni passo si chiude con `type-check`, `lint`, `test` e `build` del pacchetto verdi e un commit (nessun push da parte di Claude).

| #   | Passo                                                                                                                                                                                                                                 | Verifica                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 0   | **Impalcatura:** copiare `packages/pdf` senza la parte nativa; `package.json` (private), mapping in `apps/playground/tsconfig.json`, riga in `build` di root e in `validate-package` di `ci.yml`, `CLAUDE.md` del pacchetto, lockfile | `npm install` pulito; lint, type-check, build verdi                                                               |
| 1   | **Copia di `d3` e nucleo puro:** copiare i file di §2 con le intestazioni, `docs/charts-upstream.md`, poi avvolgerli in `core/` (scale lineare, a bande e di tempo, tracciati, formattazione con `Intl`, riassunto testuale)          | test sotto jest (la copia gira senza configurazione), casi limite: un punto, valori uguali, negativi, vuoto, date |
| 2   | **Cornice:** `useChartSize` (primo frame a 0), assi, griglia, tooltip, stati `loading`/`empty`                                                                                                                                        | test jest di misura e stati                                                                                       |
| 3   | **`BarChart`** (raggruppato, impilato, orizzontale, bersaglio, `onSelect`) e pagina `/charts` nel playground con voce nel catalogo                                                                                                    | test di geometria; prova in Chrome (computer e finestra stretta)                                                  |
| 4   | **`LineChart` e `AreaChart`**                                                                                                                                                                                                         | come sopra                                                                                                        |
| 5   | **`DonutChart`/`PieChart`, `StackedBar`, `Sparkline`**; verifica di `CircularProgress` per l'indicatore                                                                                                                               | come sopra                                                                                                        |
| 6   | **`ChartLegend` e facciata `Chart`**                                                                                                                                                                                                  | test: nascondere una serie ridisegna gli assi                                                                     |
| 7   | **Modalità densa** (un `<Path>`) e misura dei tempi su web                                                                                                                                                                            | numeri riportati qui; soglia scelta dalla misura                                                                  |
| 8   | **Verifica nativa:** riga `charts` in `/native-check` (disegna un grafico, legge le dimensioni dei nodi) e screenshot in CI                                                                                                           | righe `NATIVECHECK charts` e screenshot negli artefatti del run                                                   |
| 9   | **Documentazione:** README con limiti, `docs/solaris-native.md` (D7 e Fase 4), `docs/work-split.md`, changeset quando esce da `private`                                                                                               |                                                                                                                   |

**Cosa non si può verificare dal portatile di lavoro:** iOS e Android a runtime. Il passo 8 passa dalla CI nativa come per il PDF.
Non si dichiara "funziona su iOS/Android" finché un run non lo mostra. **Non verificati in ogni caso:** tocco e velocità su un
telefono vero, hover, grafici con migliaia di punti sul nativo.

## 7. Rischi

| Rischio                                                                  | Mitigazione                                                                                                      |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Copia di `d3` che si allontana dall'originale o si rompe nei casi limite | Differenze volute elencate in `docs/charts-upstream.md`; test sui casi limite prima di ogni componente (passo 1) |
| Palette dei grafici non ancora in `ui` (B0)                              | Ruoli esistenti come default, prop `colors`; si cambia solo il default quando B0 arriva                          |
| Nodi SVG troppo numerosi sul nativo                                      | Modalità a `<Path>` unico, soglia misurata (passo 7); misura nativa solo via CI                                  |
| Grafico che esce dalla pagina per la larghezza misurata                  | `Svg` assoluto in un contenitore auto-dimensionato, test dedicato (insidia dello spike)                          |
| Colori che non reggono il contrasto in scuro                             | I valori validati sono di B2, del collega; qui si usano solo token                                               |

## 8. Domande aperte

- **Chiusa il 2026-10-20 (letto `DBE-CRM-qa`, in `Documents\Dev`):** i grafici di linea del CRM **non usano un asse del
  tempo**. Il desktop (`Charts/LineChart.jsx`, usato in `RollingGraphsWidget`) prende `x` = indice del punto, già ordinato
  per data, e formatta le etichette con una funzione (`xTickFormat`); il mobile (`MiniLineChart`) prende
  `points: [{ label, value }]` con `x` = posizione. L'unica scala del tempo è nel `TimelineChart`, rinviato. Quindi
  `LineChart` e `AreaChart` hanno **l'asse x a categorie in ordine** (un `label` per punto, punti equidistanti, come le
  barre): niente `Date` e niente `scaleTime` nella prima ondata (la copia di `d3` la contiene, se un domani servisse). Il CRM
  usa **visx** (`@visx/scale`, `shape`, `axis`, `grid`, `legend`, `tooltip`) sul web, che sta sopra gli stessi `d3-scale` e
  `d3-shape`: i numeri restano quelli.
- B0 (contratto dei token) è del collega: serve il **tipo** e i nomi, anche con valori provvisori, prima del passo 3 per non
  cambiare l'API dei colori due volte.
