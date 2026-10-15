# Spike 0.2 — schermata CRM-grade su web desktop

Fase 0 di `docs/solaris-native.md`. Domanda: **`DataGrid`, `Input` e `Select` reggono la densità desktop su
react-native-web, o serve lavoro prima del lotto 3A?**

## Cosa è stato fatto

`apps/playground/app/spike-crm-desktop.tsx` (usa solo `@its/glowup-ui`, palette `databeasy`): barra filtri
(`SearchBar`, due `Select`, due `Button`), `DataGrid` densa con 11 colonne e 240 righe (25 per pagina,
ordinamento e filtri funzionanti, `Pagination`), poi un form lungo di 11 campi su più colonne.
Esportata con `expo export -p web` e aperta in Chrome headless (Windows) a 1024, 1440 e 1920 px.

Il file è un prototipo usa-e-getta: i punti in cui la libreria non basta sono segnati nel sorgente con `GAP:`.

## Esito

**Regge il rendering, non regge la densità.** Nulla si rompe a nessuna delle tre larghezze, ma la schermata
non è "CRM-grade" senza lavoro sulla libreria.

### Cosa funziona (verificato su web, screenshot a 1024/1440/1920)

- Prerender + hydration puliti sulla route dopo aver tolto un testo dipendente dalla larghezza della finestra
  (il primo tentativo dava l'errore React #418: era mio, non della libreria; l'altra route di confronto ne ha 0).
- Nessun errore in console oltre al noto avviso di `useNativeDriver` su web.
- `DataGrid` con `density="dense"` (righe da 40 px) mostra 25 righe con `StatusBadge` nelle celle e scorre in
  orizzontale quando le colonne superano la finestra (1024: la colonna "Oper…" è tagliata, come previsto).
- La palette `databeasy` si applica a `Button`, `Pagination`, `Select`, ordinamento della testata.
- Il passaggio a 1024 px della shell del sito (rail) e il ritorno a capo della barra filtri avvengono senza
  rotture.

### Vuoti trovati (ognuno diventa una riga della matrice 0.5 / lotto 3A)

| #   | Vuoto                                                                                                                                                                                                                                                                                                                                                                                                           | Evidenza                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | **Nessuna densità per i controlli di form.** `Input`, `Select` e `Button` non hanno `size`/`density`: un campo è alto circa 55 px (stima dallo screenshot), la griglia dense ha righe da 40. Un form da 11 campi occupa molto più spazio verticale del necessario.                                                                                                                                              | `InputProps` senza `size`; screenshot 1440 |
| 2   | **`Select` e `SearchBar` non si allineano**: la prima ha l'etichetta fuori dal campo, la seconda no, quindi nella stessa riga hanno altezze e basi diverse.                                                                                                                                                                                                                                                     | screenshot 1440, barra filtri              |
| 3   | **Salto di layout per l'helper text**: un campo con `helperText` ("11 cifre") è più alto dei vicini nella stessa riga; manca `reserveHelperSpace` (già in 3A).                                                                                                                                                                                                                                                  | screenshot 1440, riga 2 del form           |
| 4   | **`DataGrid`**: non ordina `data`; nessun renderer di cella (ho dovuto mettere un nodo React dentro i dati); nessun `align` (i numeri non si allineano a destra); larghezze solo fisse (a 1920 px le 11 colonne sommano circa 1.480 px e lasciano una fascia vuota a destra: nessuna colonna si allarga); le intestazioni "Creato il" e "Valore €" vanno a capo in 100–110 px; nessun totale/footer di tabella. | `DataGrid.tsx`; screenshot 1440            |
| 5   | **`Select`**: non ricercabile, niente gruppi; con valori `any` e `onSelect` non tipizzato.                                                                                                                                                                                                                                                                                                                      | `SelectProps`                              |
| 6   | **`Pagination`**: solo numeri di pagina; nessuna etichetta del totale né dimensione pagina. Vedi nota in matrice: il CRM usa lo scroll infinito, quindi la riga del piano non ha evidenza.                                                                                                                                                                                                                      | `PaginationProps`; matrice 3B              |
| 7   | **Font**: il testo si vede in serif perché la palette chiede `Roboto` e l'app (qui il playground) non la carica. È previsto dalla libreria (i font sono dell'app), ma una schermata d'esempio per il CRM deve caricarlo.                                                                                                                                                                                        | commento in `brandPalettes.ts`; screenshot |

### Non verificato

Interazioni (aprire un `Select`, scrivere nella ricerca, ordinare cliccando, navigare con la tastiera), scorrimento
orizzontale con la rotella, prestazioni oltre 25 righe montate, tema chiaro (le schermate sono in scuro), qualsiasi
cosa su iOS/Android (lo spike 0.6 li copre). Headless Chrome non fa hover.

## Conseguenze per il piano

- Il **lotto 3A** deve includere una prop di densità per `Input`/`Select`/`Button` (nome generale, es.
  `size="small" | "medium"` o `density`), non prevista oggi nel piano. È la modifica che più cambia la resa
  desktop.
- Le prop di `DataGrid` già elencate in 3A (`renderCell`, `align`, larghezze proporzionali, ordinamento
  interno opzionale, footer) trovano conferma pratica.
- D17 (web di prima classe) è confermata: nessun ostacolo di base su react-native-web per questa
  famiglia di componenti; resta da provare l'interazione.
