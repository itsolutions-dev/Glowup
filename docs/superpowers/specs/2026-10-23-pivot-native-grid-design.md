# Pivot, pezzo 3: griglia per iOS e Android — progetto

Stato: **da approvare** (Alice, 2026-10-23). Viene dopo `docs/superpowers/specs/2026-10-23-pivot-grid-design.md` (pezzo 2, griglia web, fatto: `c04b70f`). Riferimenti: `docs/solaris-native.md` Fase 7, `packages/pivot/CLAUDE.md`.

## Scopo

`PivotGrid` funziona anche nell'app iOS e Android, con la stessa forma e le stesse regole della griglia web: una riga di intestazione, righe che si aprono e si chiudono, gruppi di colonne che si aprono e si chiudono, intestazione e prime due colonne sempre in vista mentre si scorre, righe virtualizzate. Sola lettura.

## Obiettivi

- Lo stesso componente `PivotGrid` (stesse prop: `engine`, `localization`, `height`) su tutte le piattaforme: sul web resta `PivotGrid.web.tsx` senza cambi di aspetto, sul telefono `PivotGrid.tsx` smette di mostrare il messaggio e disegna la griglia.
- Le parti fisse sul telefono si tengono ferme con **l'animazione nativa di React Native** (`Animated` con `useNativeDriver`): lo scorrimento dei numeri comanda direttamente lo spostamento dell'intestazione (in orizzontale) e della colonna delle etichette (in verticale), senza passare da JavaScript. Nessuna dipendenza nuova, nessun Reanimated né Gesture Handler.
- Larghezze come sul web (`gridSizes`, misurate con `onLayout`): su un telefono la colonna delle etichette scende a circa il 40% e restano numeri in vista; se le colonne dei numeri non riempiono lo spazio, si allargano.
- Finestra di righe come sul web (`visibleRange`), ma **si ricalcola solo quando l'intervallo cambia**, non a ogni evento di scorrimento.
- Un controllo vero **sul telefono**: la schermata `/native-check` (usata dalla CI) ha una sezione con la griglia, righe di misura (`NATIVECHECK pivot …`) e un passo dello script Android che tocca una freccia e legge lo stato, così ogni giro di CI dice se la griglia si disegna, si apre e si chiude su iPhone e su Android 14 e 15.

## Non obiettivi

- Nessuna novità di funzione rispetto al web (pannello dei campi, filtri, ordinamento, ridimensionamento colonne, esportazione, zoom con due dita).
- Nessuna virtualizzazione orizzontale (poche colonne), nessun RTL.
- Nessun cambio al modello (`buildGridModel`), all'hook (`usePivotGrid`) né alla finestra (`visibleRange`): se serve toccarli, è un difetto da registrare.
- Nessuna dipendenza nuova né nuovo requisito per chi installa il pacchetto.

## Contro-obiettivi (sarebbe un fallimento anche se «funziona»)

- Intestazione o etichette che ritardano o «ballano» rispetto ai numeri durante lo scorrimento (è il motivo della scelta nativa).
- Frecce che non rispondono al tocco dopo uno scorrimento (su Android le viste spostate dall'animazione nativa hanno avuto problemi di tocco: va provato, non dato per buono).
- Rifare per il nativo una seconda copia delle regole di cella: il testo, i colori e le didascalie vengono dallo stesso codice del web.

## Vincoli

- Confini di import del pacchetto invariati (`@its/glowup-ui` per nome, nient'altro di nostro); colori e tipografia dai token del tema.
- Il codice nativo si prova solo in CI (iPhone, Android 14 e 15) e sull'emulatore Android in locale (ricetta in memoria: serve che Alice lo accenda; le modifiche di solo JavaScript arrivano con l'aggiornamento a caldo, niente nuova build). iOS solo in CI.
- Nessun push da parte di Claude; un solo commit alla fine (regola di Alice).

## Approcci considerati

1. **Quattro blocchi sincronizzati con `onScroll` e `scrollTo` da JavaScript.** Scartato: JavaScript arriva sempre in ritardo e sul telefono le intestazioni ballano.
2. **Animazione nativa di React Native (scelta, 2026-10-23).** Il corpo scorre su due assi (uno scorrimento orizzontale che ne contiene uno verticale); i valori di scorrimento alimentano due `Animated.Value` con `useNativeDriver`, che spostano l'intestazione e la colonna delle etichette. Fluido quanto Reanimated, nessuna dipendenza.
3. **Reanimated e Gesture Handler.** Scartato: dipendenze che la libreria ha finora evitato (nel playground sono solo blocchi di versione).

## Cosa si fa

**Disegno nativo (`src/PivotGrid.tsx`).** Una vista `container` di altezza `height`, misurata con `onLayout`, con due righe: in alto l'angolo (larghezza delle colonne fisse) e un riquadro che taglia (`overflow: "hidden"`) con dentro la riga di intestazione spostata di `-x`; sotto, il riquadro delle etichette (taglia, spostato di `-y`) e il corpo, uno scorrimento orizzontale che contiene uno verticale con le sole celle dei numeri. Etichette e numeri usano la stessa finestra di righe e la stessa altezza di riga, così restano allineati. Sul Android lo scorrimento interno ha `nestedScrollEnabled`; su iOS `directionalLockEnabled`. La finestra si aggiorna da un ascoltatore di `onScroll` (e `scrollEventThrottle`) solo se `start` o `end` cambiano.

**Parti in comune.** Tutto ciò che è identico al web (colori di riga e di totale, testo di cella con errore e il suo `accessibilityLabel`, freccia con il nome «Collapse»/«Expand», messaggi di caricamento e di vuoto) si porta in un modulo condiviso (`src/grid/…`) usato dai due disegni, senza cambiare l'aspetto del web.

**Verifica nativa.** Sezione nuova in `app/native-check.tsx` con una `PivotGrid` su dati inventati (quelli di `site/samplePivot.ts`) e righe di misura: la griglia ha la sua altezza, si montano solo le righe della finestra, il tocco su una freccia chiude un gruppo (stato `pivot=<righe>`). Un passo nuovo in `scripts/android-interact.mjs` tocca la freccia e legge lo stato. Su iOS la schermata scorre da sola (alto, grafici, PDF) e si aggiunge una posizione per la griglia; `native.yml` scatta già `ios-seq-*`. Si aggiornano `apps/playground/CLAUDE.md` e il filtro dei percorsi se serve.

## Come si verifica

- jest: il disegno nativo reso con React Native Testing Library (intestazione e righe, apertura e chiusura di riga e di gruppo di colonne, solo le righe della finestra con 10.000 righe e cambio di finestra da un evento di scorrimento, cella con errore, nessun dato, larghezze strette dopo `onLayout`); `Animated` con driver nativo è simulato in jest, quindi il test non prova lo spostamento vero.
- Emulatore Android in locale (se Alice lo accende): la griglia si vede a 390 × 844, si scorre in tutte e due le direzioni con intestazione ed etichette ferme, la freccia risponde dopo lo scorrimento, 10.000 righe fluide. Screenshot e `uiautomator dump`.
- CI: righe `NATIVECHECK pivot …` su iPhone, Android 14 e 15; passo Android; screenshot `ios-seq-*` della griglia (**guardare la schermata, non solo le righe**, come per il PDF).
- `lint`, `type-check`, `build`, `validate-package`, test del repo.
- **Non verificato in questo pezzo:** un telefono vero, la fluidità reale dello scorrimento su iOS (la CI non fa gesti).

## Lasciato a chi costruisce

Nomi dei file e dei moduli condivisi, forma esatta dei riquadri e dei valori animati, quanti pixel di sovrapposizione tra i riquadri, come mostrare l'angolo, dove la sezione sta nella schermata di verifica e come il suo stato si legge dallo script.

## Rischi

- **Tocchi su viste spostate dall'animazione nativa (Android):** se le frecce non rispondono dopo lo scorrimento, serve un altro modo di spostarle (per esempio ridisegnare le etichette dalla finestra e usare solo lo spostamento per il corpo); si decide guardando l'emulatore.
- **Due scorrimenti annidati:** su Android lo scorrimento in diagonale non c'è (un asse alla volta) e un tocco può scegliere l'asse sbagliato; accettato, va guardato.
- **Allineamento a mezzo pixel** tra etichette e numeri con densità non intere: si controlla negli screenshot.
- **Il driver nativo non è provato da jest:** per questo la parte vera la dà il controllo sul telefono.
