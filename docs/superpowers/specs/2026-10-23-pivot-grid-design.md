# Pivot, pezzo 2: griglia in sola lettura — progetto

Stato: **da approvare** (Alice, 2026-10-23). Viene dopo `docs/superpowers/specs/2026-10-23-pivot-core-design.md` (pezzo 1, fatto: `8b4d584`). Riferimenti: `docs/solaris-native.md` Fase 7, strato 1 del renderer; `docs/pivot-upstream.md`.

## Scopo

Una griglia che mostra un pivot calcolato dal motore di `packages/pivot`, **come lo mostra AuraPivot** nel CRM: righe gerarchiche che si aprono e si chiudono, una riga di intestazione con una cella per colonna, intestazioni e prima colonna sempre visibili mentre si scorre, totali. **Sola lettura**: nessuna configurazione. Il web è la priorità (decisione di Alice, 2026-10-23); il telefono segue come pezzo successivo sullo stesso modello.

## Obiettivi

- Un **modello della griglia senza grafica** (TypeScript puro, provato in jest) che, da una matrice del motore, dà: **una sola riga di intestazione, con una cella per foglia di colonna** (la didascalia contiene già il percorso e la misura, per esempio «t — Sum Total of Count», come nell'export del CRM; rientro per livello e freccia per i gruppi di colonne aperti o chiusi; nessuno span), l'elenco delle righe visibili (livello di rientro, aperta o chiusa, se si può aprire), le celle con il testo da mostrare, la posizione dei totali.
- Un componente **`PivotGrid` per il web** con intestazioni di colonna e colonna delle etichette sempre visibili, righe virtualizzate (migliaia di righe visibili senza rallentare) e apertura/chiusura al tocco o al clic di righe **e** di gruppi di colonne.
- Funziona con le misure sulle colonne e con le misure sulle righe (`measuresOnRows`), con misure nascoste, con totali in alto o in basso e con totali disattivati (`totalsHidden`), come in AuraPivot.
- Il testo di una cella è quello che AuraPivot mostrerebbe: formato numerico della misura dal `report` (`formats`) con `formatNumberWithFormat` e il locale del motore; rapporti (`ratioTotal`, `currentRatio`) in percentuale se non c'è un override; vuota dove i totali sono spenti; altrimenti `formattedValue`.
- Una pagina `/pivot` nel playground con una demo viva (dati inventati con la forma del report del CRM: sedi, categorie sotto ogni sede, una colonna booleana, totali in alto) e il suo test.

## Non obiettivi

- Nessun pannello dei campi, filtro, campo calcolato, formato condizionale, drill-through, esportazione (pezzi 3–5), nessun menu per ordinare per misura, nessun ridimensionamento delle colonne, nessun cambio di densità (una densità fissa), nessun «espandi tutto / comprimi tutto».
- **Nessun disegno per iOS e Android in questo pezzo.** Sul telefono `PivotGrid` mostra una riga di testo che dice che la griglia non è ancora disponibile (come il PDF all'inizio). Il disegno nativo è il pezzo successivo.
- Nessuna virtualizzazione orizzontale (i report del CRM hanno poche colonne).
- Nessuna dipendenza nuova.

## Contro-obiettivi (sarebbe un fallimento anche se «funziona»)

- Ricalcolare la matrice a ogni tocco dentro il componente: la matrice la dà `usePivotMatrix`, che già rimanda il calcolo oltre 5.000 righe e dà `loading`.
- Una logica diversa da quella di AuraPivot per cosa mostrare in una cella o per cosa si apre: il risultato del CRM e quello nostro devono coincidere.
- Mettere dati del CRM nella repo: il file `pivot.xlsx` di Alice **non si committa**; la demo e i test usano nomi e numeri inventati con la stessa forma.

## Vincoli

- I confini di import del pacchetto (`ADDON_PACKAGES`): può importare `@its/glowup-ui` per nome e nient'altro di nostro. Colori, tipografia e spaziature vengono dai token del tema, mai scritti a mano.
- Il pacchetto resta `private`; nessun push da parte di Claude; il test della stessa riga di AuraPivot non può dipendere da come Intl formatta su una piattaforma (spike 0.1).
- Il codice nativo non si può provare qui: solo la CI. Il web si controlla in Chrome da Alice.

## Approcci considerati

1. **Un solo disegno per tutte le piattaforme, con quattro pannelli sincronizzati** (angolo, intestazioni di colonna, etichette di riga, corpo; le intestazioni seguono il corpo con `onScroll`). Un codice solo, ma le intestazioni restano indietro di un fotogramma, e sul telefono si vede.
2. **Web con `position: sticky` in un solo contenitore che scorre** (scelto, 2026-10-23): sul web è perfetto e senza sincronizzazione; il disegno per il telefono (approccio 1) arriva dopo, sullo stesso modello.
3. **Solo funzioni native** (`stickyHeaderIndices`): scartato, mancano le colonne fisse a sinistra.

Perché 2: il web è la priorità e lì la qualità conta subito; il telefono si prova solo in CI, e scrivere ora un disegno che non si può guardare è più rischioso che farlo dopo su un modello già verificato.

## Cosa si fa

**Modello (`src/grid/`, senza grafica).** `buildGridModel(matrix, report, locale)` e un hook `usePivotGrid(engine)` (sopra `usePivotMatrix`, `engine.getReport()` per `slice`, `formats`, `options`, e `engine.getLocale()`). Il modello dà la riga di intestazione dalle foglie `colLeaves` (come AuraPivot in modalità compatta: nessun albero di intestazioni), le righe visibili da `rowLeaves` (dalla colonna delle etichette con rientro di 16 px per livello, una freccia dove il nodo ha figli e non è un totale; la riga del totale generale e le righe di subtotale hanno la loro didascalia dal dizionario `grid`: `total`, `grandTotal`, `subtotalCaptionTemplate`), le celle dalla mappa `cells` (chiave `rowKey::colKey`), l'apertura di un nodo con `engine.toggleExpanded(nodeKey)` (il nodo è `nodeKey`, non `key`, quando le misure stanno sulle righe). Le regole sul testo di una cella e su cosa filtrare (misure nascoste, `totalsHidden`, ratio) si ricostruiscono da `components/PivotTable/PivotTable.tsx` di AuraPivot (non copiato): sono il contratto di parità.

**Disegno web (`src/PivotGrid.web.tsx`)** e **`src/PivotGrid.tsx`** (nativo, solo il messaggio). Un solo contenitore che scorre su entrambi gli assi, con `position: sticky` su intestazioni e prima colonna. La virtualizzazione verticale è fatta a mano su righe di altezza fissa (offset di scorrimento → intervallo visibile, uno spaziatore sopra e uno sotto): **una `FlatList` non va bene qui**, perché su un elemento che scorre sul solo asse verticale `sticky left` non si aggancia al contenitore orizzontale. Densità, altezze e rientro sono costanti nostre.

**Playground:** pagina `app/pivot.tsx` con la demo e `__tests__/pivot-page.test.tsx`, voce in `site/siteNav.ts`, mapping già presente.

## Come si verifica

- jest: il modello su una matrice vera del motore (intestazione a una riga, righe annidate con totali in alto e in basso, misure su righe e su colonne, misura nascosta, `totalsHidden`, formati con `it-IT` e `en-US`, apertura e chiusura di un nodo di riga e di colonna); il componente reso con React Native Testing Library (le righe che compaiono, l'apertura al clic, solo le righe visibili montate su un dataset grande).
- Chrome, a 1280 e 390 px: intestazioni e colonna fissa mentre si scorre, apertura al clic, 10.000 righe visibili fluide. Lo guarda Alice (da qui non si pilota il browser).
- `lint`, `type-check`, `build`, `validate-package`, test di tutto il repo.
- **Non verificato in questo pezzo:** iOS e Android (il disegno nativo non c'è), un telefono vero.

## Lasciato a chi costruisce

Forma esatta dei tipi del modello, nomi dei file interni, altezze e rientro in pixel, aspetto di intestazioni e totali con i token del tema, come si comporta il contenitore con un dataset vuoto o con il solo totale.

## Rischi

- **`position: sticky` dentro un contenitore con virtualizzazione a mano**: lo spaziatore sopra le righe non deve rompere l'aggancio; si prova in Chrome con 10.000 righe.
- **Parità con AuraPivot senza i loro dati**: si copre con una matrice costruita da dati inventati e con le regole lette dal sorgente; la parità vera su dati del CRM resta un lavoro da fare con Alice (serve la definizione del report oltre ai dati).
- **Il motore si ricalcola a ogni apertura di un nodo** (`toggleExpanded` marca sporco e riemette): su dataset grandi `usePivotMatrix` mostra `loading`; la griglia deve tenere l'ultima matrice mentre carica, non svuotarsi.
