# Piano: Solaris UI (oggi Glowup) — la libreria di componenti aziendale: React Native, componenti, template, charts, pivot, PDF, hook

Stato: **bozza v3.5 (2026-10-15)** — **l'obiettivo è costruire la libreria; il CRM è la fonte dei requisiti e il primo caso d'uso.**

## Perché esiste questo documento

La richiesta: **costruire la libreria di componenti** `@its/glowup-ui`, che diventerà **Solaris UI** (finché il
rename non è fatto, codice, pacchetti e percorsi restano Glowup). Il primo caso d'uso è il **CRM** (repo
`DBE-CRM-qa`), che verrà rifatto in React Native; **l'obiettivo di questo piano è la libreria, non il
rifacimento del CRM**, e la libreria non sarà usata solo per il CRM. Gli otto punti della richiesta sono:

1. libreria pronta per React Native (cosa cambia, cosa aggiungere);
2. prop aggiuntive ai componenti, che li rendano più "specializzati" in base al CRM, ma **generali** perché
   la libreria non sarà usata solo per il CRM;
3. template (componenti grandi composti da quelli piccoli: form, impostazioni…);
4. charts personalizzabili per dati e tipo (torta, colonne…);
5. tabelle pivot, partendo da AuraPivot (repo nostro);
6. PDF viewer;
7. hook;
8. in futuro: la pagina Template produce template personalizzati (MCP "template advanced"): dal playground
   si compone una pagina con i componenti e si ottiene il codice.

Questo documento è il riferimento comune per chi implementa: registra l'audit delle repo (Glowup,
CRM, AuraPivot), le decisioni, le fasi e i criteri di uscita. Si aggiorna
**durante** il lavoro: una decisione che cambia si riscrive al suo posto (stesso numero), non se ne aggiunge una
che contraddice la prima; lo stato di una fase si segna quando la fase atterra, non dopo.

**Perimetro.** Questo piano riguarda la **libreria** (e il suo playground). Il rifacimento del CRM in React
Native è un progetto a sé, con un suo piano nella sua repo: **non è obiettivo né attività di questo piano**. Qui
si descrive solo ciò che la libreria deve offrire e come la si verifica con schermate pilota (§3, Fase 8).

**Fonte dei requisiti (2026-10-15): per ora il CRM.** La libreria potrà servire altre applicazioni in futuro,
e per questo le prop restano generali (D4) e niente di CRM entra nei nomi. In concreto: componenti, prop e
compositi si giustificano con file del CRM; la Fase 8 verifica la libreria con schermate pilota.

**Inventario dei componenti:** `docs/component-inventory.md` elenca tutti i componenti con tutte le prop, divisi in aggiunti, aggiornati e
tenuti rispetto all'inizio del lavoro. È generato (`npm run docgen` poi `npm run inventory`, nel workspace del playground) e si aggiorna a ogni lotto.

Convenzioni: **Verificato** = letto nel codice o eseguito; **Non verificato** = dedotto o non controllato;
_Proposta_ = scelta mia, non ancora confermata da te.

## 0. Audit (verificato, non supposto)

### 0.1 Glowup oggi (`@its/glowup-ui` 0.11.1, HEAD `7eef6ad`)

| Tema                    | Stato                                                                                                                                                                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target                  | Expo + react-native-web, RN ≥ 0.86, React ≥ 19 (Expo SDK 57 nel repo). Nessun import `expo-*` in `packages/ui/src`; l'unico accoppiamento Expo è `@expo/vector-icons` (solo in `Glyph.tsx`), che richiede `expo-font`.                                                                                               |
| Componenti              | 102 documentati (`props.generated.json`), una sola barrel, nessun subpath. Un solo runtime dependency: `polished`. Il pacchetto pubblica sia `src` sia `lib`.                                                                                                                                                        |
| Peer                    | Tutti obbligatori tranne `react-dom`: `@expo/vector-icons`, `react-native-safe-area-context`, `react-native-svg`. Regola: un modulo raggiungibile dalla barrel è un peer obbligatorio. La libreria **non** dipende da reanimated né da gesture-handler.                                                              |
| Test                    | 10 file in `src/__tests__`, ~110 `it`, preset `jest-expo` (iOS di default). **Nessun test gira con `Platform.OS` web o android**; nessun test su `.web.tsx`, sort del DataGrid, virtualizzazione.                                                                                                                    |
| Verifica su dispositivo | **Nessuna dichiarata** per `ui` (il pacchetto `device` ha note "not verified on a device", `ui` no). Esiste solo: jest, export web con controllo hydration, `examples/consumer` (solo `tsc` + `expo export -p web`, mai un bundle nativo).                                                                           |
| Codice solo-web         | `DateTimePicker.web.tsx` (react-dom portal); `document`/`window` dietro `Platform.OS === "web"` in Calendar, Autocomplete, Tooltip, Collapse, `useEscapeKey`; `hovered`/`focused` di Pressable (estensioni RNW) in ~15 componenti.                                                                                   |
| Animazioni              | Solo `Animated` core: bene per la New Architecture. 4 componenti con `useNativeDriver: false` (AnimatedFAB, Collapse, Toggle, CircularProgress); `ClockDial` usa responder grezzi.                                                                                                                                   |
| Hermes / Intl           | `Intl` usato molto (date, calendario); ci sono fallback "per Hermes vecchio". Nessuna prova su un Hermes reale.                                                                                                                                                                                                      |
| RTL                     | Parziale (`Icon.flipForRTL`, `SideOverlay`, `LinearProgress`); `RadioGroup` ha ancora `marginRight`. Non auditato.                                                                                                                                                                                                   |
| Tema                    | Token in `providers/theme.json`; palette `databeasy` (Roboto, scala M3 "con i pesi del CRM") e un'altra palette di marca già presenti in `brandPalettes.ts`, più 19 tinte Material generate da `createPalette(seed)`; icone Eva come SVG inline.                                                                     |
| Liste lunghe            | Unici `FlatList`: DataGrid e il mese del Calendar. `Select`, `Menu`, `Autocomplete`, `ChipGroup` usano `ScrollView`/`map`.                                                                                                                                                                                           |
| Charts / PDF / pivot    | **Non esistono**. `react-native-svg` è peer (usato da Glyph e CircularProgress). Assenti in lockfile: victory, skia, d3, webview, react-native-pdf, pdfjs, flash-list.                                                                                                                                               |
| Hook esportati          | `useTheme`, `useToast`, `useInteractionFeedback`, `useFormControl`, `usePortalHost`, `useStateLayer`. **Nessun hook di breakpoint/window esportato** (vivono nel playground: `useLayout`, `useWindowSize`); `useWindowWidth`/`useReduceMotion` sono interni.                                                         |
| Template                | 8 file in `apps/playground/templates` (Checkout, Dashboard, Inbox, Pricing, Profile, Settings, SignIn, SignUp), ~2.000 righe, **solo nel playground**. Ogni file è autonomo, importa solo `react`, `react-native`, `@its/glowup-ui`, ed è mostrato come codice da copiare (`generate.mjs` → `sources.generated.ts`). |
| Pagina template         | (Verificato sulla pagina pubblicata `/templates/sign-in`) anteprima live con selettore di larghezza 360 / 720 / Full, chip "Built with" che rimandano ai componenti, e il sorgente completo (~150 righe) con copia. Il codice mostrato è il file che si renderizza.                                                  |
| Pipeline docs           | `docgen` (ts-morph) → `props.generated.json`; registry con controlli prop tipizzati (`catalogue/registry`, `site/PropControls.tsx`, `catalogue/snippet.ts` genera codice dai valori live); 97 preview in `.design-sync/previews` → galleria varianti.                                                                |
| Precedente di struttura | `@its/glowup-device`: 15 subpath, un modulo nativo per capability, peer opzionali, ESLint che vieta incroci tra capability, test sull'export map. Esiste anche `@its/glowup-notifications` (push), indipendente.                                                                                                     |

Limiti di `DataGrid` (verificato, `Table.tsx`/`DataGrid.tsx`): ordinamento solo controllato (la griglia non ordina
`data`), nessun renderer di cella (stampa `item[col.id]`), nessun `onPress` di riga, nessuna selezione,
nessuna azione di riga, nessun resize/sticky, nessun footer/totali, altezza riga fissa (40/56), FlatList
verticale dentro ScrollView orizzontale (insidia nota di RN, non verificata su dispositivo).

### 0.2 Il CRM oggi (`DBE-CRM-qa`, v12.0.1)

| Tema         | Stato                                                                                                                                                                                                                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Piattaforma  | **Web puro**: React 19 + MUI 9 + Emotion, Webpack 5 + Babel, **JS/JSX senza TypeScript**, nessuna dipendenza da `react-native`/`expo`/`react-native-web`. Nessun componente è riusabile così com'è.                                                                                                              |
| Dimensioni   | 686 file, 595 componenti custom, 4.897 elementi JSX (MUI 53%, custom 34%, HTML 9%). 33 route lazy, di cui 12 servite dal layer mobile. **Nessun test, nessuna storia.**                                                                                                                                          |
| Stato / dati | Jotai (non Redux), `fetch` dietro `useProxy`, react-hook-form, react-intl, SignalR per gli eventi (chiamate, chat). Tutte librerie che esistono anche per React Native; l'adattamento è del CRM, non della libreria.                                                                                             |
| Charts       | `@visx/*` (SVG, **solo DOM**: `ParentSize`, `localPoint`, `foreignObject`, mouse, nessun touch). Desktop: Bar, Donut, Line, Timeline, HorizontalStackedLine + legenda. Mobile: SVG/CSS a mano (`StatTile`, `DonutStat`, `OutcomeBars`, `VerticalBars`, `MiniLineChart`).                                         |
| Pivot        | `aurapivot ^2.6.0` dietro `Components/PivotTable`, pilotato con `engine.setReport()/getReport()`. Report: `slice` (rows, columns, measures sum/avg, gerarchie data `callDate.Year/Month/Day`), `formats`, `calculatedFields`. Configurazioni salvate lato API (`jsonStructure`).                                 |
| PDF          | **Nessun viewer/generatore/stampa.** Solo anteprima allegati email (Blob → `openInNewTab`/`saveAs`). Il PDF del preventivo è "progettato, non costruito", renderizzato lato server (Gotenberg, decisione D66 del CRM).                                                                                           |
| Hook         | Generici estraibili: `useDebounce`, `useAbortEffect`, `useMobileMode` (soglia 1300 da parametrizzare), `useParentHeight`. Pattern generico ma file accoppiato: `useInfiniteQuery`. Accoppiati a CRM/Jotai/API: `useProxy`, `useHasPermission`, `useModuleFlag`, `useNotify`, `useTranslate`, `useSectionLayout`. |
| Mobile       | Esiste già un layer mobile **web** (39 file in `src/Components/Mobile`, sotto 1300px) e un `MOBILE_PLAN.md` con 11 schermate da mockup v4. Non è React Native, ma è la fonte migliore di requisiti per le schermate mobile.                                                                                      |
| Tema         | Primary `#1D5B9D` (dark `#5893D4`), gradiente brand `#1D5A9D→#61B340`, Roboto, raggi 18/25/12, chip a tinta calcolata (`bgAndColorStyle`, `stringToColor`), colori di stato/grafico fuori dal tema (hard-coded), 203 colori distinti a mano.                                                                     |
| Non coperto  | Contenuto della maggior parte di `Pages/*`, Editor, MassiveMessages, cataloghi i18n.                                                                                                                                                                                                                             |

### 0.3 AuraPivot (`C:\Users\a.rossi\Documents\Dev\AuraPivot-master`, `aurapivot` 2.6.0, MIT, repo `itsolutions-dev/AuraPivot`)

Lettura statica (import, dimensioni, grep); **non ho eseguito i test** (`node_modules` assente; usano vitest).

| Parte                                                                                        | Stato                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pivot-core/` (~6.200 righe, **149 KB** di sorgente, test esclusi)                           | **TypeScript puro**: nessun import React né MUI. Un solo pacchetto esterno, `exceljs`, caricato con `import()` dinamico. Contiene `PivotEngine`, aggregazioni, `TreeBuilder` (albero righe/colonne), `FilterEngine`, `MatrixComputer`, `FormulaEvaluator` (campi calcolati, senza `eval`/`new Function`), `DateHierarchyExpander` (Year/Month/Day…), `CellFormatter`/`DateFormatter` (via `Intl`), formati condizionali.  |
| Test                                                                                         | 13 file di test nel core, nelle opzioni, nella localizzazione e negli hook (engine, matrix, tree, filter, formula, security, localizzazione, cache `Intl`, export Excel); **12 usano vitest** (`vi`, import da `vitest`) → da portare a jest.                                                                                                                                                                             |
| Punti da sistemare per RN                                                                    | `ExcelExporter.ts` usa `document.createElement('a')`, `Blob`, `URL.createObjectURL` (solo web) e `exportMatrixToExcel` è nel barrel del core → Metro risolverebbe `exceljs` anche su nativo. `CellFormatter`/`DateFormatter` leggono `navigator.language` (con guardia `typeof`, quindi su RN cadono su `en-US`): serve un `locale` esplicito. Uso intenso di `Intl.NumberFormat`/`DateTimeFormat`: da provare su Hermes. |
| `options/`, `localization/` (it, en), `hooks/` (`engineStore`, `usePivotMatrix`), `context/` | **44 KB**; dipendono solo da React (`useSyncExternalStore`, context): riusabili tali e quali.                                                                                                                                                                                                                                                                                                                             |
| `components/` (**338 KB**, test esclusi)                                                     | **MUI + `@mui/icons-material` + `react-virtuoso` (`TableVirtuoso`) + DOM.** `PivotTable` (1.265 righe), `FieldList` (947), `CalculatedFieldDialog` (1.026), `DrillThroughDialog` (949), `FormatDialog`, `FilterBar`, `Toolbar`… Va riscritto per RN, ma la **logica pura** accanto (`sliceEdits.ts`, `layout.ts`, `optionsAdapter`) si riusa.                                                                             |
| Esportazione pubblica                                                                        | `exports` ha solo `.`, `./theme`, `./locales/*`: il core non è pubblicato come entry a sé, benché abbia già un barrel (`pivot-core/index.ts`).                                                                                                                                                                                                                                                                            |

Conclusione sul quesito "rifarlo da zero o riusare": **riusare il core, riscrivere la UI.** Il motore è la
parte difficile (calcolo, gerarchie, formule) ed è già testato e indipendente dalla UI; la UI è tutta MUI/DOM e
sarebbe da rifare in ogni caso.

## 1. Decisioni

| #   | Questione                       | Decisione                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Stato                                         |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| D1  | Ruolo del CRM                   | **Il CRM verrà rifatto in React Native con questa libreria**, ma il rifacimento è un progetto a parte (piano nella sua repo) e **non è l'obiettivo di questo piano**: qui il CRM è la fonte principale dei requisiti e il banco di prova. La libreria deve poterlo ospitare su **iOS, Android e browser** (stesso codice, react-native-web), perché il CRM è usato anche da scrivania.                                                                                                                                                                           | Confermata (2026-10-15)                       |
| D2  | Natura della libreria           | **Libreria aziendale, non solo "la libreria del CRM"**: in futuro altre applicazioni potranno usarla. Per ora il CRM è il primo caso d'uso.                                                                                                                                                                                                                                                                                                                                                                                                                      | Confermata (2026-10-15)                       |
| D3  | Dove vivono i pezzi             | **`packages/ui` è la libreria di base**, con il sottopercorso `composite-ui` (D10). I **componenti di alto livello** sono **pacchetti separati nello stesso monorepo**, in cartelle fuori da `packages/ui`, ognuno con versione propria e `@its/glowup-ui` come peer: **grafici** (`packages/charts`), **pivot** (`packages/pivot`), **PDF** (`packages/pdf`). "Separato" qui vuol dire cartella e pacchetto npm distinti, **non** un'altra repo. Costi e limiti in §1.1.                                                                                        | Confermata (2026-10-15)                       |
| D4  | Prop "specializzate"            | Solo prop **generali**, ognuna con un uso concreto citato (file del CRM) e un nome che non parla di dominio. Ciò che è molto specifico del CRM resta nel CRM. Niente nomi `Dbe*`, react-intl, react-hook-form, Jotai, client API.                                                                                                                                                                                                                                                                                                                                | Confermata (generalità)                       |
| D5  | Form / react-hook-form          | La libreria resta **controllata** (`value`/`onChange…`/`error`/`onBlur`) e compatibile con `Controller`. Gli adattatori RHF stanno nelle app.                                                                                                                                                                                                                                                                                                                                                                                                                    | Proposta                                      |
| D6  | i18n                            | Nessuna libreria i18n nella libreria (il CRM usa react-intl, un'altra app potrebbe usarne un'altra): testi via prop `labels`/nodi, formattazione con `Intl`.                                                                                                                                                                                                                                                                                                                                                                                                     | Proposta                                      |
| D7  | Charts                          | **SVG proprio** su `react-native-svg` (già peer) con `d3-scale`/`d3-shape` (JS puro). No Skia, no visx (renderizza DOM). Touch-first, hover su web. Formato dati: array di oggetti per chiave di serie (come recharts).                                                                                                                                                                                                                                                                                                                                          | Proposta                                      |
| D8  | Pivot                           | **Si copia il core di AuraPivot dentro `packages/pivot`** (adattato: niente DOM, `locale` esplicito, esportazione Excel in un file a parte) e si riscrive la UI per RN. La repo AuraPivot **non si modifica**; la copia ha una nota di provenienza. Dettaglio in Fase 7.                                                                                                                                                                                                                                                                                         | Confermata (2026-10-15)                       |
| D9  | PDF                             | Adapter come in `device`: web = `pdfjs-dist`/iframe, nativo = `react-native-pdf` (richiede dev build, non Expo Go). Input: `uri` (+ header) o byte/base64/`Blob`. **Solo visualizzare**, non generare, e **nessuna** gestione di sessioni di servizi esterni. **Nativo con autenticazione = scaricare in un file con `react-native-blob-util` e aprire il file**, mai `source.headers` di `react-native-pdf`.                                                                                                                                                    | **Deciso** (spike 0.3)                        |
| D10 | Template e componenti compositi | **Due livelli.** (1) **Componenti compositi generici**: composti solo da componenti di base, guidati da prop e slot, senza dati né dominio; restano **dentro la libreria**, nel sottopercorso **`composite-ui`** (nome provvisorio) di `@its/glowup-ui`. (2) **Componenti specifici del CRM**: si fanno **nel progetto CRM**, in una cartella/repo a parte del CRM che **dipende dalla libreria di base**; mai dentro la libreria. Il playground continua a mostrare le pagine d'esempio come codice copiabile (come `/templates/sign-in`). Dettaglio in Fase 5. | Confermata (2026-10-15, risposta del collega) |
| D11 | Hook                            | Solo hook **generici e senza dipendenze native**, nella barrel. Quelli legati a Jotai/API/permessi restano nelle app.                                                                                                                                                                                                                                                                                                                                                                                                                                            | Proposta                                      |
| D12 | Template builder + MCP          | **Non si costruisce ora.** Ora si fa solo la _disciplina dei metadati_ (D13).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Proposta                                      |
| D13 | Metadati per builder/MCP        | Niente file nuovi: bastano ciò che già esiste (docgen delle prop, registry, `define()` dei template con `components` estratto dal sorgente). Regola: ogni componente/pagina d'esempio nuovo ha prop documentate, voce di registry, nome e categoria stabili.                                                                                                                                                                                                                                                                                                     | Proposta                                      |
| D14 | Expo come standard              | **Sì: il CRM e le future app aziendali sono app Expo**; React Native senza Expo non è supportato (libreria, `device` e `notifications` sono Expo-only). Spiegazione di Expo in §1.2.                                                                                                                                                                                                                                                                                                                                                                             | Proposta (procedo salvo obiezioni)            |
| D15 | Stabilità per più progetti      | Prima che un secondo progetto adotti la libreria si arriva a **1.0**; da lì: semver rigoroso, deprecazione per almeno una minor prima di rimuovere, politica di supporto Expo (§2).                                                                                                                                                                                                                                                                                                                                                                              | Proposta                                      |
| D16 | Supporto delle versioni Expo    | La libreria supporta l'**Expo SDK corrente e quello precedente** (oggi 57 e 56). Le app più indietro aggiornano prima di adottare.                                                                                                                                                                                                                                                                                                                                                                                                                               | Proposta (scelta mia)                         |
| D17 | Progetti solo web               | **Sì, un'app può usare la libreria solo per il web**: è un'app Expo con il solo target web (`expo export -p web`). Il **web è un target di prima classe** (non un ripiego): ha la sua colonna nella matrice di verifica e nei test. I pezzi solo-nativi sono opzionali e non si installano. Dettaglio in §1.3.                                                                                                                                                                                                                                                   | Proposta (risposta alla tua domanda)          |

### 1.1 Cosa significa "pacchetto separato", e il peso del pivot

**"Separato" non vuol dire "fuori dal monorepo".** Tutto resta nella stessa repo; cambia la cartella. Accanto a
`packages/ui`, `packages/device` e `packages/notifications` nascono `packages/charts`, `packages/pivot` e
`packages/pdf`. Ogni cartella è un pacchetto npm a sé, che dichiara `@its/glowup-ui` come peer.

Le due forme possibili:

- **Sottopercorso (subpath)** = un solo pacchetto con più "ingressi" (`@its/glowup-ui` e
  `@its/glowup-ui/composite-ui`): una sola versione, un solo rilascio. Chi non importa il sottopercorso non lo
  include nel bundle. Lo usiamo per `composite-ui`, che è fatto solo di componenti di base.
- **Pacchetto separato** = ha il suo `package.json`, la sua versione, il suo `CHANGELOG`, il suo rilascio (e il
  suo "trusted publisher" su npmjs.com). Lo usiamo per grafici, pivot e PDF, che sono di alto livello.

| Aspetto                 | Sottopercorso (`composite-ui`)            | Pacchetto separato (charts, pivot, pdf)                                     |
| ----------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Versioni                | Una per tutto                             | Indipendenti: un cambio nel pivot non obbliga a una major di `ui`           |
| Dipendenze pesanti      | Peer opzionali nel `package.json` di `ui` | Isolate nel pacchetto che le usa (d3, pdfjs, `react-native-pdf`, `exceljs`) |
| Installazione           | Già inclusa                               | L'app installa solo ciò che usa                                             |
| Compatibilità con `ui`  | Garantita (escono insieme)                | Da gestire con l'intervallo di versione del peer                            |
| Lavoro di rilascio      | Basso                                     | Alto: un trusted publisher e un job CI per pacchetto                        |
| Regola attuale del repo | Compatibile                               | "Nessun pacchetto importa un altro" va cambiata                             |

**D3:** grafici, pivot e PDF sono componenti di alto livello → pacchetti separati nel monorepo; i compositi
generici restano un sottopercorso di `ui`. La regola ESLint "nessun pacchetto importa un altro" cambia in:
`charts`, `pivot` e `pdf` possono importare `ui` (mai il contrario) e **non si importano fra loro**.

**Il pivot pesa troppo?** No. Misure dal codice di AuraPivot:

- il core è **149 KB di sorgente** e `options`/`localization`/`hooks`/`context` altri **44 KB**: circa **190 KB**
  di TypeScript. La UI MUI (338 KB) **non** si porta: si riscrive;
- nel **bundle di un'app** il costo è **zero** se non si installa `@its/glowup-pivot`, e anche chi lo usa paga solo i
  file raggiunti;
- nel **pacchetto npm** il sorgente viene pubblicato più volte (`src`, `lib` compilato, `.d.ts`): ordine di
  grandezza **mezzo megabyte**, trascurabile;
- la vera dipendenza pesante, `exceljs` (~900 KB secondo il commento nel suo codice), resta **peer opzionale**
  e caricata a richiesta, e **solo sul web**.

I costi veri, da accettare con gli occhi aperti:

1. **Più pacchetti da rilasciare** (charts, pivot, pdf): tre rilasci e tre trusted publisher invece di uno.
   Mitigazione: ogni workspace nasce `"private": true` finché non è pronto; changesets già in uso; un job CI
   per pacchetto.
2. **Compatibilità con `ui`**: un cambio in `ui` può rompere un pacchetto di alto livello. Mitigazione: peer
   con intervallo di versione, `examples/consumer` che installa anche questi pacchetti dal registro, deprecazioni
   di almeno una minor (D15).
3. **Due copie del motore pivot** (la nostra e quella di AuraPivot): possono divergere. Mitigazione: la copia
   mantiene la struttura dei file di AuraPivot, ha in testa una nota con versione e commit di origine, i test del
   core vengono portati in jest (così girano nella nostra CI) e un file `docs/pivot-upstream.md` registra le
   differenze volute (niente DOM, `locale`, exporter separato). Le correzioni che interessano entrambe si
   riportano a mano; se diventano frequenti, è il segnale per estrarre un pacchetto condiviso con AuraPivot.

### 1.2 Che cos'è Expo

**React Native** permette di scrivere app iOS/Android in JavaScript/TypeScript. Da solo, però, richiede di
configurare a mano i progetti nativi (Xcode, Android Studio), le librerie native e le build.

**Expo** è il "kit completo" sopra React Native, ed è oggi il modo consigliato dalla stessa documentazione di
React Native per iniziare:

- **Expo SDK**: moduli già pronti, versionati insieme e compatibili con una certa versione di React Native
  (fotocamera, posizione, notifiche, file, biometria, sicurezza…). I nostri `@its/glowup-device` e
  `@its/glowup-notifications` sono costruiti su questi.
- **Expo Router**: navigazione a file (il playground già lo usa).
- **Web**: lo stesso codice gira anche nel browser (react-native-web) — è ciò che rende la libreria "iOS +
  Android + Web" e ciò che permette al CRM di funzionare anche su desktop.
- **EAS**: servizio per compilare le app nel cloud, pubblicarle sugli store e inviare aggiornamenti senza store.
- **Expo Go** vs **development build**: Expo Go è un'app già pronta per provare codice al volo, ma contiene
  solo i moduli base. Un modulo nativo "esterno" (per esempio `react-native-pdf`) richiede una **development
  build** nostra, generata con EAS: non è un ostacolo, ma è un passaggio in più per chi sviluppa.
- **Config plugin / prebuild**: i permessi e le impostazioni native si descrivono in un file di configurazione,
  senza toccare Xcode/Android Studio.

Perché conta qui: Glowup e i suoi pacchetti fratelli sono già Expo; la versione di React Native la decide
**l'SDK di Expo** (il `CLAUDE.md` del repo lo ricorda: i moduli nativi si aggiornano tutti insieme). Il CRM
nascerebbe come app Expo. Scegliere Expo (D14) significa un solo
modo di creare, provare e rilasciare le app, e una sola politica di aggiornamento (D15, D16). Alternativa (RN
"nudo"): più libertà, ma ogni progetto si gestisce da sé le versioni native e perde i pacchetti
`device`/`notifications` così come sono.

### 1.3 Si può usare la libreria solo per il web? (D17)

**Sì.** Glowup è scritta con i componenti di React Native e, nel browser, gira tramite react-native-web: un'app
Expo può avere **solo il target web** (`expo export -p web`, un sito statico). È
anche il modo con cui è pubblicato il playground.

Cosa significa in pratica:

- **Nessuna build iOS/Android** e nessun dispositivo da provare: i test e le verifiche che contano per quell'app
  sono quelli della colonna **web**.
- **Dipendenze**: l'app installa comunque i peer della libreria (`react-native`, `react-native-web`,
  `react-native-svg`, `react-native-safe-area-context`, `@expo/vector-icons`), perché sotto è sempre React
  Native. Non installa i moduli solo-nativi (`react-native-pdf`, i moduli `device` che servono solo su telefono):
  sono peer **opzionali**.
- **Cosa cambia per i pezzi nuovi**: grafici (`@its/glowup-charts`), pivot (`@its/glowup-pivot`) e PDF (`@its/glowup-pdf`) sono
  pacchetti a parte: un'app li installa solo se li usa. Sul web funzionano senza nulla in più; il PDF usa
  `iframe`/`pdfjs-dist` e il modulo nativo non serve; l'esportazione Excel del pivot è **solo web**.
- **Cosa non è supportato** (non verificato, quindi non promesso): usare la libreria in un'app React "normale"
  (Vite, Webpack) **senza Expo**, anche con react-native-web, perché dipende da `@expo/vector-icons` →
  `expo-font`. Il percorso supportato è sempre Expo con target web (D14).
- **Il web è di prima classe**: oggi il web è "ciò che funziona perché il playground lo usa", ma `ui` non ha test
  su `Platform.OS` web né su `.web.tsx` (§0.1). Con D17 diventa un target dichiarato: la matrice di verifica
  ha una colonna web, i test girano su web (1.1), e i problemi tipici del browser (sovrapposizioni, focus,
  `hover`, tastiera, responsive) sono una voce a sé (1.11).
- **Si può aggiungere il nativo dopo**: la scelta non è definitiva. Un'app che oggi esce solo web può
  aggiungere iOS/Android quando la libreria avrà la verifica nativa (Fase 1), senza riscrivere nulla.

## 2. Regole trasversali (valgono per ogni fase)

- **Definition of done di un componente**: export da `src/index.ts` (o dal suo sottopercorso o pacchetto); prop documentate;
  voce di registry + nome in `categories.ts` + in `CATALOGUE` del test; preview in `.design-sync/previews`; test
  (jest) **su ios, android e web**; sezione in `components.md`; changeset; `npm run docgen` / `variants` /
  `templates` senza diff; `type-check`, `lint`, `test`, `build`, `validate-package` verdi.
- **Additivo e stabile (D15)**: le prop nuove non cambiano il comportamento delle esistenti. Una rimozione o
  un cambio incompatibile richiede: nota di deprecazione (con avviso in sviluppo) per almeno una minor, poi
  la major. Prima del 1.0 si accumula ciò che si vuole cambiare e lo si fa in un colpo solo, con guida di
  migrazione nel `CHANGELOG`.
- **Supporto Expo (D16)**: la libreria dichiara quale Expo SDK supporta; si aggiorna dopo ogni SDK con una
  minor/major dedicata e un controllo in CI (`examples/consumer` sull'SDK corrente). Si supportano l'SDK
  corrente e il precedente.
- **Tema**: nessun colore a mano nei componenti; ogni valore passa dai token (e quindi chiaro/scuro). Le
  **palette di marca** appartengono alle app: la libreria offre il tipo `ThemePalette` e `createPalette(seed)`;
  `databeasy` e le altre palette già presenti restano finché servono, ma una nuova app definisce la propria palette nel proprio
  codice.
- **Mobile e touch**: area minima 44px (48dp Android), nessuna interazione solo-hover.
- **Accessibilità**: ruolo, stato e nome accessibile su ogni controllo nuovo; i charts hanno un riassunto
  testuale. L'audit del CRM ha trovato 49 pulsanti-icona su 157 senza nome: non lo ereditiamo.
- **Niente speculazione**: ogni prop nuova cita nel PR dove viene usata (file del CRM). Evidenza debole
  (una galleria demo, un segnaposto) non basta.
- **Dipendenze**: una nuova dipendenza si giustifica contro la regola dei peer e il peso del bundle. Un peer
  solo-nativo è sempre **opzionale** (D17).
- **Verifica per piattaforma**: ogni fase dichiara cosa è stato provato su **web**, iOS e Android e cosa no,
  come nelle note "not verified on a device" di `device-package-plan.md`.

## 3. Fasi

| Fase | Contenuto                                                      | Dimensione | Dipende da | Stato                                  |
| ---- | -------------------------------------------------------------- | ---------- | ---------- | -------------------------------------- |
| 0    | Spike e fondamenta (decisioni verificate)                      | M          | —          | In corso (0.1–0.5 fatti; 0.6 parziale) |
| 1    | React Native readiness + web di prima classe + stabilità       | M          | 0          | —                                      |
| 2    | Token di tema e hook                                           | S          | 0          | In corso (2A, 2B-a e 2B-b fatti)       |
| 3    | Componenti specializzati (prop) — 3 lotti                      | L          | 0, 2       | —                                      |
| 4    | Charts (pacchetto separato `packages/charts`)                  | L          | 2          | —                                      |
| 5    | Componenti compositi (`composite-ui`) e pagine d'esempio       | L          | 3          | —                                      |
| 6    | PDF viewer (pacchetto separato `packages/pdf`)                 | M          | 0          | —                                      |
| 7    | Pivot (pacchetto separato `packages/pivot`, core da AuraPivot) | L          | 3, 4       | —                                      |
| 8    | Validazione con schermate pilota del CRM                       | M          | 1, 3A      | —                                      |
| 9    | Template builder + MCP (futuro)                                | L          | 5, D13     | —                                      |

Ordine consigliato: **0 → (1 ∥ 2) → 3A → 4 ∥ 6 → 3B/3C → 5 → 7**, con 8 che parte quando 1 e 3A sono
disponibili (così il CRM guida le prop invece di indovinarle). Il pivot (7) è richiesto anche sul
nativo, quindi dipende dalla griglia migliorata (1.4/3A). La fase 9 resta ferma finché 5 non ha almeno 6
compositi stabili.

### Fase 0 — Spike e fondamenta

Obiettivo: trasformare le proposte più rischiose in fatti, **prima** di costruire.

| #   | Spike                                                                                                                                                                                                                                                    | Esito atteso                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0.1 | **Core di AuraPivot** (lettura statica già fatta, §0.3). Restano: portare il core in un file di prova in Glowup, far girare i suoi test con jest, eseguirlo in un'app Expo su Hermes (Android) con 5k e 50k righe, verificare `Intl` e il bundle nativo. | Conferma D8; elenco preciso delle modifiche alla copia (niente DOM, `locale`, exporter separato).              |
| 0.2 | **Schermata CRM-grade su Expo web a dimensioni desktop**: lista con filtri + tabella densa + form lungo, con la palette `databeasy`, usando solo Glowup. Il CRM, primo caso d'uso, è un'applicazione da scrivania e deve girare nel browser.             | Dice se DataGrid/Input/Select reggono la densità desktop su react-native-web o se serve lavoro prima della 3A. |
| 0.3 | PDF: aprire un PDF servito da un'API autenticata (Blob con bearer token) e uno passato come base64 su web, iOS, Android con le opzioni di D9.                                                                                                            | Conferma o riscrive D9 (in particolare l'autenticazione sul nativo).                                           |
| 0.4 | Chart: una `BarChart` con `d3-scale` + `react-native-svg`, tooltip al tocco, larghezza da `onLayout`, su web/iOS/Android.                                                                                                                                | Conferma D7; misura le prestazioni a 500 e 5.000 punti.                                                        |
| 0.5 | **Matrice di mappatura** (`docs/crm-component-matrix.md`): per ogni famiglia del CRM il componente Glowup equivalente, il vuoto, la prop da aggiungere (nome generale, D4), il file che la giustifica. Parte dal §4.                                     | È l'elenco di lavoro della Fase 3 e il criterio "niente speculazione".                                         |
| 0.6 | Eseguire il playground su un simulatore iOS e uno Android e annotare cosa si rompe (anche solo un elenco).                                                                                                                                               | Base di partenza per la Fase 1.                                                                                |

Uscita: D7, D8, D9 passano da _Proposta_ a deciso (o vengono riscritte); la matrice 0.5 esiste.

**Esiti finora (2026-10-15).**

- **0.2 fatto** → `docs/spike-0.2-crm-desktop.md`. Il rendering su react-native-web regge, la densità no: i
  controlli di form non hanno una prop di densità (campo ≈ 55 px contro righe di griglia da 40 px). Da
  aggiungere al lotto 3A (`size`/`density` su `Input`, `Select`, `Button`). Le interazioni non sono state provate.
- **0.5 fatto** → `docs/crm-component-matrix.md` (tutti e tre i lotti). Correzioni al piano emerse dalla matrice:
  - `AgendaTimeline` **non esiste** nel CRM: la fonte di `DayTimeline` è `MobileAgenda.jsx`.
  - `useActiveFilters` **non esiste** in Glowup: o si crea o si toglie dal 3A.
  - `Modal`: la prop più usata del CRM è la larghezza (`size`), non elencata nel piano → in 3B.
  - **Senza evidenza** nel CRM (fuori dai lotti finché una schermata non li chiede): selezione, colonne sticky,
    `footer` e `onRowPress` di `DataGrid`; `searchable` e `onOpen` di `Select`; contatore `maxCharacters`;
    `dot` del `Chip`; `loading`/`sparkline`/`format`/`onPress` di `Stat`; campo data nativo; selettore
    dimensione pagina; `Stepper` verticale/errore; snap point del `BottomSheet`; `hidden`/`renderItem` della sidebar.
  - `PinInput` copre già tutto: nessun vuoto da colmare.
  - Il CRM **non pagina**: scroll infinito (`useInfiniteQuery`, 16 file). `Pagination` si rinvia; il lavoro è la
    lista infinita in `DataGrid`.
  - Il `Stepper` del CRM è un `MobileStepper` (pallini/barra + Indietro/Avanti), non un wizard a etichette.
  - Aggiunte non previste: `CaptionValue` (25 file) ad alta priorità, `ListItem` con `primary` come nodo e
    indicatore di stato (13 file), `Tabs` con chiave, `BottomSheet` con `footer`, `Snackbar` con `info`/`warning`,
    token pubblici `success`/`warning`/`info` nel tema.
  - `Autocomplete`: il valore del CRM è un oggetto scelto distinto dal testo digitato; in Glowup `value` è solo testo.
- **0.1 fatto su Android e iOS** → `docs/spike-0.1-pivot-core.md`. Il core gira sotto jest senza modificare il sorgente
  (150 test su 150 portati da vitest), compila con `hermesc` ed è girato su **Hermes reale in CI**. A 50.000 righe
  `processMatrix` impiega 0,6–1,6 s (3–5 volte V8), a 5.000 meno di 0,4 s. `Intl` differisce tra le piattaforme: su iOS
  manca `formatToParts` (il core ricade in silenzio su `,`/`.`). Modifiche alla copia: esportatore Excel fuori dal core,
  `locale` esplicito, separatori senza `formatToParts`. **Manca un telefono vero.**
- **Vincolo di ambiente (2026-10-15).** Dal portatile di lavoro **non si può provare su iOS/Android**: niente
  amministratore per completare Android Studio, rete aziendale che impedisce di collegare un iPhone a Metro. Il
  binario standalone di Hermes (v0.13.0) non è un sostituto: non ha `Intl` e non esegue classi e `async` senza
  Babel. Quindi **0.3, 0.6 e la parte Hermes di 0.1 restano non verificate** finché non c'è un altro ambiente: CI su
  runner macOS/Linux (Fase 1), una macchina di un collega o un Mac. Ogni fase dichiara iOS/Android come "non
  verificato" (§2) finché non cambia. Il piano resta valido perché il web è il primo target (Q1).
- **0.4 fatto per web e bundling** → `docs/spike-0.4-bar-chart.md`. `d3-scale` (solo ESM) si risolve su web, iOS e
  Android e i bundle compilano in bytecode Hermes; larghezza da `onLayout` e tooltip al clic funzionano su web.
  A 10.000 rettangoli il web impiega circa 0,3–0,5 s: per dati densi la Fase 4 deve prevedere una modalità a
  `<Path>` unico. Insidia: l'`Svg` va in posizione assoluta, altrimenti la larghezza misurata blocca il
  contenitore. **Non verificati**: tocco, tempi e rendering su iOS/Android, `d3` sotto jest.
- **0.3 fatto, web e CI su iOS e Android (2026-10-16)** → `docs/spike-0.3-pdf.md`. `react-native-pdf` funziona con RN 0.86 e nuova
  architettura su iOS e Android: base64 ok e file scaricato con header ok (3 pagine), `pdfjs-dist` ok sul web. **`source.headers`
  di `react-native-pdf` fallisce** su entrambe (iOS `DownloadFailed`, Android "Use of own trust manager but none defined"):
  si scarica con `react-native-blob-util` e si apre il file, come già previsto. Insidia: l'autolinking legge il `package.json`
  dell'app (una dipendenza `--no-save` non viene compilata e l'app muore all'avvio). **Non verificati**: telefono vero, https,
  gesti, PDF grandi. Codice di prova tolto (commit `3076ad8`, `616c45d`).
- **0.6 parziale, primo giro di CI verde (2026-10-15, run 38745067229, commit 79a0c22)** → `.github/workflows/native.yml`.
  Il playground (Expo SDK 57, React Native 0.86.3, nuova architettura, Hermes 250829098.0.17) **si compila in Release,
  si installa e parte** su simulatore iOS (iPhone 17 Pro, iOS 26.4.1, Xcode 26.6) e su emulatore Android (API 34,
  x86_64), e il processo è ancora vivo dopo 40 secondi. Tempi: iOS circa 12 min di xcodebuild più 1 di pod install;
  Android circa 13 min di Gradle più 2,5 di emulatore. Plugin di configurazione e moduli nativi del pacchetto
  `device` (camera, posizione, notifiche, sensori, biometria…) compresi. Segnalato per la Fase 1: su Android
  `userInterfaceStyle: "automatic"` richiede `expo-system-ui`. **Screenshot visti**: la home del playground si disegna in tema su
  entrambe (Android senza errori fatali nel logcat, `Running "main"`); su iOS un avviso di `expo-router/head` ("Add the
  handoff origin…") copriva la pagina: era un difetto del playground (il `Head` serve solo al web), corretto in
  `site/Page.tsx`, **non riverificato su iOS**. **Non verificato**: qualsiasi interazione, JS che fallisce senza
  chiudere l'app.
- **Da fare**: 0.3 (PDF nativo in CI) e la conferma su telefoni veri.

### Fase 1 — React Native readiness, web di prima classe, stabilità

Due binari paralleli (D17): **web** (browser) e **nativo** (telefono). Per ora si parte dal web: ciò che
riguarda solo il nativo non lo blocca. Cosa cambia **rispetto a oggi**, in ordine di valore:

| #    | Lavoro                                                                                                                                                                                                                                                                                 | Binario      | Perché (evidenza dell'audit)                                              |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------- |
| 1.1  | **Test su tre piattaforme**: progetti jest `jest-expo/ios`, `/android`, `/web`; i test esistenti girano su tutti, con eccezioni dichiarate.                                                                                                                                            | web + nativo | Oggi solo iOS; nessun test su `.web.tsx` né su `Platform.OS` web/android. |
| 1.2  | **Smoke nativo nel consumer**: aggiungere `expo export -p ios` e `-p android` (solo il bundle Metro, non la build) a `examples/consumer`. Il smoke web c'è già.                                                                                                                        | nativo       | Un import nativo rotto passerebbe inosservato.                            |
| 1.3  | **Checklist di verifica per piattaforma** per ogni componente (browser desktop e mobile; iOS sim, Android emu, e un dispositivo reale per i pezzi delicati: date picker, Slider, ClockDial, Modal/BottomSheet, Menu/Select, Tooltip), registrata con data e versione.                  | web + nativo | Nessuna verifica dichiarata per `ui`, né su web né su nativo.             |
| 1.4  | **DataGrid**: eliminare la FlatList verticale dentro ScrollView orizzontale e garantire l'**allineamento di intestazione e corpo** (layout alternativo con colonne sticky e virtualizzazione corretta).                                                                                | web + nativo | Insidia nota di RN (intestazione e corpo che si disallineano).            |
| 1.5  | **Liste lunghe**: `Select`, `Menu`, `Autocomplete` (suggerimenti), `ChipGroup` oltre una soglia usano `FlatList`/`SectionList`.                                                                                                                                                        | web + nativo | Oggi `ScrollView`/`map`, non virtualizzato.                               |
| 1.6  | **Tastiera**: verificare e, se serve, gestire `KeyboardAvoidingView` in `Modal`, `BottomSheet`, `SideSheet`, `Autocomplete`. _Non verificato se già gestito._                                                                                                                          | nativo       | Un form in un bottom sheet è un caso d'uso comune.                        |
| 1.7  | **Hermes reale**: eseguire i test di `DateTimePicker.shared`/`Calendar` su Hermes (dispositivo/simulatore) e confermare i fallback `Intl`.                                                                                                                                             | nativo       | Fallback "per Hermes vecchio" mai provati su un Hermes vero.              |
| 1.8  | **Animazioni**: valutare i 4 `useNativeDriver: false`; sostituire `ClockDial` con gesture più robuste solo se il test su dispositivo mostra un difetto.                                                                                                                                | nativo       | Rischio di jank, non un bug accertato.                                    |
| 1.9  | **RTL**: audit sistematico di `left/right`/`margin*` (corregge `RadioGroup`), test con `I18nManager.forceRTL` (nativo) e `dir="rtl"` (web), controllo dei componenti direzionali (frecce, Stepper, Slider, Sheet).                                                                     | web + nativo | Il CRM oggi non lo richiede: priorità bassa.                              |
| 1.10 | **Accessibilità**: passata manuale con VoiceOver e TalkBack sui componenti del lotto 3A, e con lettore di schermo + tastiera su web; ruoli `listbox/option/menuitem/radiogroup` oggi impostati solo su web → equivalente nativo.                                                       | web + nativo | Ruoli ARIA solo con `Platform.OS === "web"`.                              |
| 1.11 | **Web: sovrapposizioni, focus, tastiera**: verificare che overlay, Menu, Popover, Tooltip non siano nascosti da `transform`/`z-index` di Card e Tabs; che l'anello di focus/hover segua il raggio di ogni Pressable; navigazione da tastiera completa (Tab, frecce, Esc).              | web          | Problemi tipici di react-native-web; da verificare nello spike 0.2.       |
| 1.12 | **Safe area**: ogni componente che richiede `SafeAreaProvider` lo dichiara nel README e in un errore leggibile (oggi solo in `.design-sync/conventions.md`).                                                                                                                           | web + nativo | AppBar, TopAppBar, Toolbar, FAB, AnimatedFAB, SpeedDial, SideSheet.       |
| 1.13 | **Stabilità (D15, D16)**: criterio scritto per il 1.0 (componenti stabili, verifica per piattaforma fatta, API documentata), politica di deprecazione e di supporto Expo nel README e in `CLAUDE.md`; una guida "come adottare la libreria in un'app Expo" (incluso il caso solo-web). | web + nativo | La libreria non servirà solo il CRM.                                      |

Cosa **aggiungere** (non c'è oggi): `docs/native-verification.md` con la matrice componente × piattaforma
(**web**, iOS, Android) × data × versione; il progetto jest multi-piattaforma; il bundle nativo in CI; la guida di
adozione.

Uscita: matrice di verifica compilata per almeno i componenti dei lotti 3A/3B (colonna web completa; colonne
nativo almeno sui pezzi delicati); CI con jest ×3 e bundle nativo verde; elenco dei difetti trovati con esito
(corretto / accettato / rinviato); criterio 1.0 pubblicato.

### Fase 2 — Token di tema e hook

**Token** (da `theme.json` **e** dal tipo `Theme` insieme, il guard `_ThemeTokensInSync` fallisce altrimenti):

- gradiente di marca (+ forma disabilitata): `gradients.brand`, `gradients.brandDisabled`, ricavabile dalla
  palette. Richiede un modo di disegnare il gradiente su RN (`react-native-svg` `LinearGradient`, già peer —
  nessuna dipendenza nuova).
- colori **semantici di stato** oltre a success/error/warning: `info` e `neutral`. Gli stati specifici di
  un'app (per esempio le fasi di una chiamata) li **mappa l'app** su questi token.
- **palette per i grafici** (serie categoriche, sequenziale, divergente) con variante chiara/scura, validata
  per contrasto (la skill `dataviz` ha un validatore).
- **generatore di tinte** `toneFromColor(hex, mode)` e `toneFromString(str, mode)` (porting di
  `bgAndColorStyle`/`stringToColor`/`generateConsistentUniqueColors` del CRM): dà ai chip di stato un colore
  deterministico e leggibile in chiaro e in scuro. Si esporta come utility (come `getStateColor`).
- breakpoint: i **window size class di Material 3** come default (compact < 600, medium 600–839, expanded
  840–1199, large 1200–1599, extra-large ≥ 1600), **sostituibili** dall'app. La soglia 1300 del CRM la configura il CRM.

**Hook** (barrel, senza dipendenze native, D11):

| Hook                                        | Origine                                                                         | Note                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `useBreakpoint()` / `useLayout()`           | `useLayout` del playground + `useMobileMode` (CRM)                              | Basato su `useWindowDimensions`; versione hydration-safe già in `internal/useWindowWidth`.   |
| `useOrientation()`                          | nuovo (utile su tablet e telefono)                                              | Verticale/orizzontale da `useWindowDimensions`.                                              |
| `useDebouncedValue`, `useDebouncedCallback` | `useDebounce` del CRM                                                           | Con cancel/flush.                                                                            |
| `useAbortableEffect`                        | `useAbortEffect` del CRM                                                        | Passa un `AbortSignal`.                                                                      |
| `useInfiniteList({ fetchPage })`            | `useInfiniteQuery` (CRM), **senza** `IntersectionObserver` né componenti dentro | Restituisce `items, hasMore, loading, loadMore, reload, total`; si collega a `onEndReached`. |
| `useControllableState`                      | assente                                                                         | Per i componenti con `value`/`defaultValue` (serve ai lotti 3A–3C).                          |
| `useDisclosure`                             | assente                                                                         | open/close/toggle per Modal/Sheet/Menu.                                                      |
| `useReduceMotion`                           | interno oggi                                                                    | Si esporta.                                                                                  |
| `useActiveFilters`                          | `FiltersButton` del CRM                                                         | Conta i filtri attivi ed espone `clear`; alimenta il badge.                                  |

Restano nelle app: `useProxy`, `useHasPermission`, `useModuleFlag`, `useNotify`, `useTranslate`,
`useSectionLayout`, `useReportView`, `useAuth`, `useGState`, il motore a schema (`engine/*`) del CRM.

Uscita: token e hook esportati, documentati, testati su 3 piattaforme; il playground usa `useBreakpoint`
della libreria al posto del suo.

**Lotto 2A fatto (2026-10-15)** — `packages/ui/src/hooks/`: `useDebouncedValue`, `useDebouncedCallback` (con `cancel` e
`flush`, identità stabile, annulla allo smontaggio), `useBreakpoint(overrides?)` con `SIZE_CLASSES` e `sizeClassFor`
(classi di larghezza di Material 3, soglie sostituibili) e `useReduceMotion` esportato. 24 test jest (iOS), type-check,
lint, build e `validate-package` verdi; changeset minor. **Non verificato**: web e Android a runtime (i test girano solo
con il preset iOS), uso reale nelle componenti. Mancano: `useOrientation`, `useAbortableEffect`, `useInfiniteList`,
`useControllableState`, `useDisclosure`, `useActiveFilters` (la matrice 0.5 dà evidenza solo a debounce, breakpoint,
abort e lista infinita; gli altri aspettano un componente che li usi, D4) e tutti i token; il playground non usa ancora
`useBreakpoint` della libreria.

**Lotto 2B-a/b fatto (2026-10-16)** — ruoli di stato in `theme.colors` (`success`, `warning`, `info`, `neutral`, quattro
token ciascuno, chiaro e scuro), scritti in `theme.json` come `error`: tinte fisse fuori dal seme, uguali in ogni palette
(`createPalette` e le due palette di marca li prendono da lì; `brandPalettes.ts` non è stato toccato nei colori). Il
file dei design (`crm`/`siti`, uguali a `databeasy`/`inxpire`) non ne specifica. `providers/successRoles.ts` è stato tolto:
`Button` (`tone="success"`) e `StatusBadge` leggono dal tema. Nuove utility `toneFromColor`, `toneFromString`, `toneFrom`
(coppia sfondo/testo con i toni M3 di un contenitore, tinta da un hex o da un testo) e prop `toneFrom` su `Chip` (filled/tonal)
e `StatusBadge`; `Banner` (warning, info) passato ai nuovi ruoli. 5 test nuovi (più i contrasti delle palette estesi ai ruoli di stato); test, type-check, build e `validate-package` verdi, due changeset minor. **Non verificato**: nativo
a runtime; contrasto reale WCAG dei toni (i test misurano la distanza di luminosità, non il rapporto); **Mancano (2B-c)**: palette dei grafici e gradiente di marca. Nota: un `ThemePalette`
scritto a mano ora deve includere i ruoli di stato (changeset lo dice).

**Lotto 3A, primo pezzo fatto (2026-10-16)** — `density?: "normal" | "dense"` su `Input`, `Select` e `Button` (stesso nome e
valori di `DataGrid`; `Button.size` è già la dimensione dell'icona, quindi `size` non andava bene). Dense: campo da 40 px
(prima 56 / 52), pulsante da 36 (prima 48), testo `bodyMedium`, meno spazio sotto il campo. 3 test sui valori di stile;
type-check e lint verdi. **Non verificato**: l'altezza reale a schermo su web, iOS e Android (i test leggono lo stile, non il
layout) e l'effetto su un form da 11 campi come nello spike 0.2. **Verificato su web (Chrome headless, 2026-10-16)**: campo 56 → 40 px, pulsante ~50 → ~38 px (bordo compreso).
Impostazione unica: `ThemeProvider density` (contesto a parte, `providers/Density.tsx`, non nel valore del tema) è il default di
`Input`, `Select`, `Button` e `DataGrid`; la prop del controllo vince; un provider annidato senza `density` eredita. Esportati
`Density` e `useDensity`. **`ListItem` fatto (2026-10-16)**: `children` e `secondary` accettano un nodo (solo il testo viene avvolto in `Text`, quindi niente
prop `primary` separata), più `indicatorColor`, `dimmed` e `trailingWidth`; galleria `StatusRows`; 2 test. Verificato su web (Chrome headless): barra, riga attenuata, badge allineati a destra; non su nativo.
**`DataGrid` fatto in parte (2026-10-16)**: `columns[].renderCell(value, row, index)`, `columns[].align` (anche su `TableCell` e
`TableHeaderCell`, tipo `TableAlign`), `rowStyle` come funzione della riga, `emptyState` come nodo; gallerie "Cells and
alignment" e "Empty state"; 4 test; verificato su web (intestazione e valori allineati, badge, riga attenuata). **Rinviato, senza
prova che serva**: larghezze in percentuale, `rowActions` su hover, righe-gruppo comprimibili, `renderRow`, `rowGap` (matrice 0.5:
media, 3 file; GrantMatrix li usa e il piano lo lascia all'app), lista infinita (`onEndReached` esiste già). **`Input` fatto (2026-10-16)**: `decimalSeparator` (`","` per scrivere e vedere 12,50 mentre `value`/`onChangeText` restano in forma
normale "12.50"; prima la virgola veniva scartata in silenzio e 12,50 diventava 1250, verificato con una sonda), `allUpperCase`
(maiuscole mentre si scrive e `autoCapitalize="characters"`), `reserveHelperText` (la riga sotto il campo resta anche senza testo);
7 test; verificato su web. Il separatore non si prende ancora dalla lingua del dispositivo (resta una scelta dell'app).
**`FilterButton` non creato (2026-10-16)**: controllato prima se bastava un componente esistente. Basta `badge` su `Button` e `IconButton`
(conteggio con il `Badge` che c'è già, nascosto a 0, "99+", letto dallo screen reader). Il "×" che azzera i filtri al passaggio del mouse ha un solo
uso nel CRM e resta all'app. 4 test; verificato su web (con una correzione: il badge di `IconButton` era ritagliato dal contenitore).
**`Autocomplete` fatto (2026-10-16)**, esteso senza cambiare i default: `onSearch` + `debounceMs` (con `onSearch` le opzioni non si
filtrano di nuovo per etichetta), `selected`/`onSelectedChange` (opzione scelta separata dal testo), `allowCustomValue` (con `false`,
all'uscita dal campo si rimette l'etichetta scelta o si svuota; il CRM lo usa spento in 7 usi su 8). 8 test con timer finti.
**Non fatti, per scarsa evidenza**: `multiple` (2 usi) e `uppercase` (3). **Non verificato**: a schermo, su iOS e Android (sul nativo
il blur può arrivare prima della pressione di un'opzione: ordine ragionato, non provato). **Il lotto 3A è chiuso.**

**Lotto 3B, primo giro fatto (2026-10-16)** — solo estensioni di componenti esistenti: `Modal.size` (20 file del CRM la usano), `BottomSheet`
con `actions` (stesso nome di `SideSheet` e `Modal`, non `footer`), `showCloseButton` e contenuto che scorre, `Tabs` con `key`/`activeKey`/`disabled`
(`onChange(index, key)`, retrocompatibile), `Snackbar`/`useToast` con `warning` e `info` e `success` sui ruoli del tema. 16 test nuovi.
Verificato su web: `Tabs` (chiave, tab disabilitato). **Non visto a schermo**: `Modal`, `BottomSheet`, `Snackbar` (i riquadri della galleria
sono fermi a metà animazione nella cattura headless; colori e struttura verificati da test). **Non fatti, senza evidenza sufficiente**: `Modal`
`overline`/`leadingActions`/`dividers`, snap point del `BottomSheet`. **Barra laterale fatta** (stesso giorno): `DrawerItem` con `children` è un gruppo (`defaultExpanded`, `onToggle`, rientro per livello, riusa `Collapse`),
`DrawerSection` con `collapsible`/`defaultExpanded`/`onToggle`, `NavigationDrawer` con `header` e `collapsed` (72 px, sole icone, la lettera al posto di
un'icona mancante). 9 test; verificato su web (gruppo, sezione, header, versione compressa). Non fatti: `hidden`/`renderItem` (si filtra l'array), prefetch
al passaggio del mouse. **Restano nel 3B**: `ToggleButtonGroup` con valori tipizzati, `Stepper` a pallini.

**Schermata di verifica nativa (2026-10-16, spike 0.6)**: `/native-check` nel playground, aperta in CI un minuto dopo l'avvio. Misura sul
dispositivo le altezze reali con `density` (campo −24, pulsante −12, `Select` −20) e la larghezza del badge; su Android `scripts/android-interact.mjs`
comanda l'emulatore con `adb` (scrive `12,50`, tocca il badge, cambia tab, apre il gruppo del menu e il foglio) e legge lo schermo con
`uiautomator`. Su iOS solo misure e screenshot (la CI non può toccare). **Verificata su web** (4 misure su 4); **non ancora girata su nessun
emulatore**: il primo run probabilmente richiederà correzioni allo script.

**`CaptionValue` fatto (2026-10-16, lotto 3C)**: componente nuovo (`caption`, `value`, `direction`, `reverse`, `fallback`, `omitCaption`,
`captionColor`/`valueColor`, `textAlign`, `gap`, `numberOfLines`, stili e `style`); non porta il `translate()` interno del CRM (l'i18n resta
all'app). Differenza voluta dal CRM: `0` è un valore, non cade nel `fallback`. 4 test; in catalogo con demo e galleria; verificato su web.

### Fase 3 — Componenti specializzati (le prop)

Gli elementi sotto sono **candidati** dalla lettura del CRM; la matrice 0.5 li conferma uno per uno
con il file che li giustifica. I nomi sono volutamente generali (D4).

**Lotto 3A — liste e form**

| Componente                   | Prop / comportamento da aggiungere                                                                                                                                                                                                                                                                                                                     | Giustificazione                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `DataGrid`                   | `renderCell`, `accessor` (percorso puntato) + `format`, `align`, `onRowPress`, selezione (`selectionMode`, `selected`, `onSelectionChange`, "seleziona tutti"), `rowActions` (menu di riga), colonna/e sticky, larghezze proporzionali, `footer`/totali, `keyExtractor`, `renderRow` (override totale), `loading` con skeleton, `emptyState` come nodo | CRM `Components/Table`, `GrantMatrix`, `ContactListWrapper`         |
| `Select`                     | `searchable`, gruppi (`sections`), `onOpen`, `value` tipizzato, opzioni stringa o `{value,label}`                                                                                                                                                                                                                                                      | CRM `FormSelect` (multiple, `CustomItem`)                           |
| `Autocomplete`               | `onSearch(text)` + `debounceMs`, `multiple`, `allowCustomValue`, `noOptionsText`                                                                                                                                                                                                                                                                       | CRM `FetchAutoComplete` (600ms debounce, multiple, `noCustomValue`) |
| `Input`                      | tipo `phone`/`email`; `type="number"` con separatori da `locale`; contatore `maxCharacters`; `uppercase`; `reserveHelperSpace` (nessun salto di layout)                                                                                                                                                                                                | CRM `FormTextField`                                                 |
| `Chip` / `StatusBadge`       | `tone` come colore arbitrario o `toneFrom="label"` (Fase 2); tipi `info`/`neutral`; `dot`; stato "pulse"                                                                                                                                                                                                                                               | CRM `Chip`, `StatusChip`, `CallStatusChip`                          |
| `Stat`                       | `loading`, `sparkline`, formattazione numeri (`format`), `onPress`                                                                                                                                                                                                                                                                                     | CRM `Mobile/charts/StatTile`, `CaptionValue`                        |
| `ListItem` / card di lista   | slot `primary`/`secondary`/`trailing`, indicatore di stato, `onPress`                                                                                                                                                                                                                                                                                  | CRM `Mobile/ContactCard`, `PriorityCard`                            |
| `SearchBar` + `FilterButton` | `debounceMs`; nuovo `FilterButton` con badge del conteggio (usa `useActiveFilters`)                                                                                                                                                                                                                                                                    | CRM `FiltersButton`, `SearchBox`                                    |
| `PinInput`                   | verificare auto-avanzamento, backspace, incolla e colmare i vuoti                                                                                                                                                                                                                                                                                      | CRM `Inputs/OtpField` (2FA)                                         |
| Campo data su web            | verificare se `DatePickerInput` usa l'input data nativo del browser quando conviene                                                                                                                                                                                                                                                                    | CRM `Form/FormDatePicker`                                           |

**Lotto 3B — navigazione e contenitori**

| Componente                                              | Prop / comportamento da aggiungere                                                                                                                                                                                                                                | Giustificazione                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `NavigationDrawer` / `NavigationRail` / `NavigationBar` | voci con gruppi annidati e comprimibili (albero di rotte), `badge`, `disabled`/`hidden`, `renderItem`, slot di intestazione/piè di pagina, modalità compressa; il passaggio Bar → Rail → Drawer secondo la classe di larghezza si mostra nel composito `AppShell` | CRM `routes.js`→sidebar                                |
| `Tabs`                                                  | tab con chiave (non solo indice), scrollabili, `badge`; `SegmentedControl` (variante di `ToggleButtonGroup`)                                                                                                                                                      | CRM `Tabs/index.jsx`, `Mobile/SegmentedControl`        |
| `BottomSheet`                                           | snap point, trascinamento, azioni di header, footer fisso (azzera / conferma)                                                                                                                                                                                     | CRM `Mobile/BottomSheet`, `FilterSheet`, `BranchSheet` |
| `Pagination`                                            | selettore dimensione pagina, etichetta totale                                                                                                                                                                                                                     | liste desktop del CRM                                  |
| `Modal` (form dialog)                                   | `submitDisabled`, `overTitle`, `actionPosition`, `leftAction`                                                                                                                                                                                                     | CRM `Dialog/index.jsx`                                 |
| `Stepper`                                               | verticale, stato errore/opzionale                                                                                                                                                                                                                                 | CRM `PagesStepper`                                     |
| `Snackbar`                                              | singola istanza globale con `severity`, chiusura manuale (controllare `ToastProvider`)                                                                                                                                                                            | CRM `Snackbar/index.jsx`                               |

**Lotto 3C — calendario e varie**

| Componente             | Prop / comportamento da aggiungere                                          | Giustificazione                          |
| ---------------------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| `Calendar`             | marcatori/eventi per giorno, striscia settimanale                           | CRM `MobileAgenda` (week strip)          |
| `DayTimeline` (nuovo)  | vista giorno con eventi (titolo, orario, tipo), `onEventPress`              | CRM `AgendaTimeline`, `AppointmentsPage` |
| `Skeleton`             | preset `list`, `card`, `table`                                              | CRM `SkeletonList`                       |
| `CaptionValue` (nuovo) | coppia etichetta/valore (`direction`, `reverse`, `fallback`, `omitCaption`) | CRM (49 usi)                             |
| `GrantMatrix`          | **rinviato**: molto specifico del CRM; rivalutare se serve altrove          | CRM `GrantMatrix/*`                      |

Uscita di ogni lotto: matrice 0.5 aggiornata (colonna "fatto"), DoD (§2) rispettata, e almeno una
schermata d'esempio o composito che usa le prop nuove.

### Fase 4 — Charts

**API** (D7): componenti dedicati con un nucleo comune, più una facciata `Chart` con `type` per il caso "in
base al tipo di dato". Pacchetto separato `packages/charts` (`@its/glowup-charts`, D3), **fuori da `packages/ui`** e con `@its/glowup-ui` come peer; `d3-scale` e `d3-shape` sono dipendenze di questo pacchetto, non di `ui`. Dati: array di oggetti per chiave di serie
(`data`, `series: [{ key, label, color? }]`), lo stesso formato di recharts.

| Componente                   | Dati                                                                                                        | Giustificazione                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `BarChart`                   | `[{ label, [serie]: n }]`, `stacked`, `horizontal`, `target`/linea media, `onSelect`                        | CRM `BarChart`, `VerticalBars`                  |
| `LineChart` / `AreaChart`    | serie `[{x, y}]` (anche date), `curve`, area, più serie, marcatori toccabili                                | CRM `LineChart`, `MiniLineChart`                |
| `DonutChart` / `PieChart`    | `[{id, value, color?}]`, `total`, testo centrale, `onSelect`                                                | CRM `DonutChart`, `DonutStat`, `DonutBreakdown` |
| `StackedBar` (barra singola) | `[{value, color}]`, `total`                                                                                 | CRM `HorizontalStackedLineChart`                |
| `Sparkline`                  | `number[]`                                                                                                  | per `Stat`                                      |
| `Gauge` / `ProgressRing`     | valore + soglie                                                                                             | contatori del CRM                               |
| `ChartLegend`                | automatica dalle serie, toccabile per nascondere una serie                                                  | CRM `GraphsLegend`                              |
| `Chart`                      | `type: "bar" \| "line" \| "area" \| "donut" \| "stacked"` + `data` + opzioni comuni → sceglie il componente | —                                               |
| **Seconda ondata**           | `ScatterChart`, `AreaRange` (valori `[min,max]`)                                                            | nessun uso nel CRM: solo se serve davvero       |
| `TimelineChart`              | **rinviato** (un solo uso: attività cliente)                                                                | CRM `TimelineChart` + `TimelineStepper`         |

Comportamento comune: larghezza/altezza da `onLayout` (niente `ResizeObserver`; **il primo frame a larghezza 0
non deve rompere il grafico**); tooltip **al tocco**, al passaggio del
mouse su web; colori delle serie dai token (Fase 2, mai a mano); `formatValue`/`locale` via `Intl`; stati
`loading` (skeleton) e `empty`; `accessibilityLabel` con riassunto testuale + modalità "tabella" per screen
reader; limite di punti con campionamento (valore da misurare nello spike 0.4); animazione d'ingresso
disattivata con `useReduceMotion`.

Cosa NON si fa: zoom/pan, brush, grafici 3D, mappe. Si aggiungono su richiesta con un uso concreto.

Uscita: ogni grafico del CRM mobile (`Mobile/charts`), i quattro desktop principali riproducibili con i componenti; prestazioni misurate su web e nativo; verifica per piattaforma registrata.

### Fase 5 — Componenti compositi e pagine d'esempio

**Decisione D10: due livelli.**

- **Livello 1 — componenti compositi generici (`composite-ui`).** Sottopercorso `@its/glowup-ui/composite-ui`
  (nome provvisorio) dentro la libreria. Regole: composti **solo da componenti di base**; guidati da **prop e
  slot**; **senza dati, API, router, i18n né dominio** (dati e testi arrivano da prop); nomi generali (D4); il
  composito misura il proprio contenitore con `onLayout`; **non importa grafici, pivot o PDF**: dove servono li
  riceve come slot (per esempio `ReportPage`). Stessa Definition of done di un componente (§2).
- **Livello 2 — componenti specifici del CRM.** **Non entrano nella libreria.** Si fanno nel progetto CRM, in
  una cartella o repo a parte del CRM che **dipende dalla libreria di base** (e da `composite-ui`). Esempi: la
  scheda cliente con l'esito della chiamata, le priorità, il softphone, il popup di chiamata in arrivo, la
  matrice dei permessi.
- **Pagine d'esempio nel playground (codice).** Le 8 esistenti restano come oggi (`/templates/sign-in`:
  anteprima a 360/720/Full, chip "Built with", sorgente copiabile). I nuovi compositi si mostrano nello stesso
  modo, con anteprima live e codice d'uso.

**Criterio per scegliere il livello:** se, togliendo i nomi del CRM, resta un componente utile a un'altra app,
è di livello 1; altrimenti è di livello 2.

Conseguenze, che sono anche il valore di questa fase:

- **Ogni composito è un test d'uso della libreria**: se per scriverlo serve una prop che manca, quella prop
  entra nella Fase 3 (con il composito come giustificazione).
- Dati **finti e nomi generali** nelle pagine d'esempio: così servono anche ad altre app.
- Le regole del playground restano: nessun import da `site/`/`catalogue/` nelle pagine d'esempio,
  `npm run templates` rigenera `sources.generated.ts`.

Compositi da costruire, dalle pagine ripetute del CRM (rinominati dove il nome parlava di dominio, D4):

| Composito                 | Contenuto                                                                                                                                                 | Si appoggia su (Fasi)     | Origine nel CRM                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------ |
| `AppShell`                | guscio adattivo: Bar su compatto, Rail su medio, Drawer su espanso; voci da un albero con visibilità per ruolo (passata dall'app); intestazione di pagina | 3B, `useBreakpoint`       | CRM `routes.js` → sidebar            |
| `ListPage`                | ricerca + `FilterButton`, sheet filtri, `DataGrid` (largo) / lista di card (stretto), statistiche, FAB, scroll infinito                                   | 3A, 3B, `useInfiniteList` | CRM `PageWrapper`+`SectionPage`      |
| `FormDialog` / `FormPage` | campi, errori per campo, azioni, submit disabilitato                                                                                                      | 3A, 3B                    | CRM `Dialog/index.jsx`               |
| `DetailPage`              | intestazione (avatar, nome, chip di stato), `Tabs`, sezioni, azione primaria                                                                              | 3B                        | CRM `CustomerSectionPage`            |
| `WizardPage`              | `Stepper`, passi con validazione, riepilogo                                                                                                               | 3B                        | CRM `PagesStepper`                   |
| `ReportPage`              | filtri in header, contatori (`Stat`), switch grafico/pivot (`SegmentedControl`); **grafici e pivot arrivano come slot**                                   | 3B                        | CRM `FiltersNavbar`, `useReportView` |
| `OptionPicker`            | griglia di opzioni a tinta, nota, data/ora, interruttore opzionale (era `OutcomePicker`)                                                                  | 3A                        | CRM `OutcomeScreen`, `OutcomeDialog` |
| `ChatThread`              | bolle, composer, allegati                                                                                                                                 | 3A                        | CRM `ChatSection/ChatBox`            |
| `ActivityTimeline`        | voci per tipo con icona e data                                                                                                                            | 3A                        | CRM `HistorySection`                 |
| `AgendaPage`              | striscia settimana + `DayTimeline`                                                                                                                        | 3C                        | CRM `MobileAgenda`                   |
| `OtpVerify`               | tre passi 2FA (invio, codice, ripristino)                                                                                                                 | 3A                        | CRM `Verify2FA`, `Setup2FA`          |
| `ActionPrompt`            | popup con azioni (accetta/rifiuta) generico (era `Incoming`)                                                                                              | 3A                        | CRM `Popup/IncomingCallPopup`        |

`Pricing` e `Checkout` non servono al CRM e restano pagine d'esempio a disposizione degli altri. Kanban e
matrice dei permessi: fuori (§7, §10).

Uscita: 8–10 compositi esportati da `composite-ui` con test su 3 piattaforme, mostrati nella galleria del
playground, ciascuno usato come banco di prova per la Fase 3; confine con i componenti specifici del CRM
scritto nel README del sottopercorso.

### Fase 6 — PDF viewer

Pacchetto separato `packages/pdf` (`@its/glowup-pdf`, D3), **fuori da `packages/ui`** e con `@its/glowup-ui` come peer; adapter come in `device` (D9). `react-native-pdf`, `react-native-blob-util` e `pdfjs-dist` sono dipendenze o peer di questo pacchetto: chi non lo installa non li vede.

- **API**: `<PdfViewer source={{ uri | bytes | base64 | blob }} headers? initialPage onLoad onError
onPageChange page zoom fit />`, più `usePdfDocument()` (numero pagine, stato). Toolbar opzionale a slot
  (pagina x/y, zoom, scarica/condividi). Stati vuoto/caricamento/errore con i token del tema.
- **Web** (percorso sufficiente se si esce solo come sito, D17): `iframe`/`object` per il caso semplice;
  `pdfjs-dist` (canvas) quando servono pagina/zoom controllati. **Nativo**: `react-native-pdf`
  (+ `react-native-blob-util`), che richiede **development build** (non funziona in Expo Go, §1.2) → peer
  opzionale e config plugin documentato. Alternativa da valutare nello spike 0.3: WebView + pdf.js (iOS legge i
  PDF in WebView, Android no).
- **Sorgente reale (per gli esempi e i test)**: nel CRM un **Blob** scaricato dall'API con bearer token
  (allegati email; documenti di pratica/dossier e preventivo quando ci saranno).
- **Autenticazione**: sul nativo significa scaricare in file locale con header e passare il percorso al viewer
  (provato nello spike 0.3, su iOS e Android). Download e condivisione usano `@its/glowup-device` tramite l'app, mai
  importato dalla libreria.
- **Non incluso**: generazione/anteprima di template PDF (lato server nel CRM, Gotenberg), annotazioni, firma, ricerca nel testo.

Uscita: viewer funzionante su web (prioritario), iOS, Android con un PDF autenticato reale e uno da base64;
nota "da verificare su dispositivo" per ciò che non è stato provato.

### Fase 7 — Pivot

Pacchetto separato `packages/pivot` (`@its/glowup-pivot`, D3), **fuori da `packages/ui`** e con `@its/glowup-ui` come peer, con il core copiato da AuraPivot (D8). Il pivot **serve anche sul nativo**; sul
web (D17) funziona con la stessa copia e in più ha l'esportazione Excel.

**Cosa si porta e cosa si scrive** (dall'audit §0.3):

| Cosa                                                        | Azione                                       | Lavoro                                                                                                                                                    |
| ----------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**: engine, albero, filtri, matrice, formule, formati | **Copia** in `packages/pivot/src/core/`      | Stessa struttura di file; nota di provenienza (versione e commit di AuraPivot); `locale` esplicito al posto di `navigator.language`; niente DOM nel core. |
| Esportazione Excel                                          | Copia **separata** (`pivot/excel.ts`)        | Solo web, `exceljs` come peer opzionale caricato a richiesta; il core non lo importa. Sul nativo: CSV condiviso tramite l'app.                            |
| `options`, `localization` (it/en), hook, contesto           | **Copia** (44 KB)                            | Invariati; la localizzazione resta sostituibile dall'app (D6).                                                                                            |
| Test del core                                               | **Porting** da vitest a jest                 | 12 file su 13 importano `vitest`: l'API (`describe`/`it`/`expect`) è compatibile, `vi.*` → `jest.*`. Devono girare nella CI di Glowup.                    |
| UI (338 KB: griglia, pannello campi, dialoghi, toolbar)     | **Riscrittura** per RN sui componenti Glowup | Nuova; si riusa la logica pura accanto (`sliceEdits`, `layout`, `optionsAdapter`). Niente MUI, niente `react-virtuoso`.                                   |
| Repo AuraPivot                                              | **Non si modifica**                          | Resta com'è; la divergenza si governa con `docs/pivot-upstream.md` (§1.1).                                                                                |

**Renderer RN** (a strati, nell'ordine in cui danno valore):

1. **Griglia in sola lettura**: intestazioni di riga e colonna sticky, espansione/compressione al tocco,
   righe/colonne dei totali, virtualizzazione verticale (e orizzontale oltre una soglia), formati numerici e
   date dai formatter del core. Costruita sulla griglia della Fase 1.4.
2. **Configurazione**: pannello campi in `BottomSheet`/`SideSheet` (assegna campi a righe/colonne/misure,
   aggregazione, ordinamento), filtri per dimensione, reset. Su touch **senza trascinamento** (menu
   "sposta in…"); il trascinamento arriva se si fa il sottopercorso `/dnd` (§10).
3. **Campi calcolati, formati condizionali, drill-through**: dialoghi riscritti sui componenti Glowup.
4. **Export**: vedi sopra.

**Compatibilità**: il formato `report` (`slice`, `formats`, `calculatedFields`, `dataSource`) è il contratto.
Un report salvato dal CRM web (`jsonStructure`) deve produrre lo stesso risultato nel renderer RN.

**Cosa non si garantisce** (per ora): parità 1:1 di ogni dialogo con AuraPivot MUI; trascinamento dei campi su
nativo; esportazione `.xlsx` su nativo.

Uscita: lo stesso `report` produce lo stesso risultato in AuraPivot (MUI) e nella copia (test di parità su
dati reali anonimizzati del CRM); renderer provato su 50k righe (web) e 5k righe (nativo, dispositivo di
fascia media); verifica per piattaforma registrata.

### Fase 8 — Validazione con schermate pilota del CRM

La libreria si verifica con un caso reale, **senza rifare il CRM**: poche schermate pilota, costruite solo con la
libreria (nel playground o in un'app di prova, con dati finti o anonimizzati) a partire da schermate del CRM.
Lo scopo è trovare i vuoti della libreria, non consegnare schermate del CRM. Fonte: `MOBILE_PLAN.md` (mockup v4).

| Schermata pilota                  | Usa                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| Accesso (password, 2FA)           | pagina d'esempio `SignIn`, composito `OtpVerify`                                    |
| Contatti (lista con filtri)       | composito `ListPage`, `DataGrid`/card, `FilterButton`                               |
| Scheda cliente con esito          | `DetailPage`, `OptionPicker`, `FormDialog` (la parte specifica del CRM sta nel CRM) |
| Report (grafici e pivot, desktop) | `ReportPage`, charts, pivot — stressano la densità nel browser                      |

Regola: ogni vuoto trovato torna a questo documento (matrice 0.5) come prop o componente **con nome generale**.
Il resto del CRM (agenda, priorità, chat, amministrazione…) e i suoi rischi propri (telefonia WebRTC, tempo
reale, passkey, notifiche, CRM web che evolve in parallelo) sono del progetto CRM, non di questo piano.

Uscita: le quattro schermate pilota funzionano su browser desktop e mobile (e, dopo la Fase 1, sui dispositivi
che abbiamo provato); la matrice 0.5 è aggiornata con i vuoti trovati.

### Fase 9 — Template builder e MCP "template advanced" (futuro)

**Non si costruisce adesso (D12).** Si fissa cosa serve, e si lavora **da ora** solo sui prerequisiti.

Ciò che esiste già e si riusa: registry con controlli prop tipizzati (`site/PropControls.tsx`), generatore
di codice dai valori live (`catalogue/snippet.ts`), `props.generated.json`, galleria template con codice,
`.design-sync/conventions.md` (guida scritta per generare UI dalla libreria).

Cosa servirà:

1. **Schema di layout**: un albero JSON versionato `{ type, props, children }` con validazione per tipo,
   generato dai metadati dei componenti.
2. **Compositore nel playground**: tavolozza dal registry, albero, pannello prop (riusa `PropControls`),
   anteprima live a 360/720/Full, **esportazione di codice** (estende `snippet.ts` dai singoli componenti agli
   alberi) e salvataggio/riapertura del JSON. Coerente con D10: l'uscita è **codice** da copiare, come le pagine d'esempio.
3. **Server MCP** (`@its/glowup-mcp`, pacchetto proprio, fuori dalla libreria): strumenti `list_components`,
   `get_component(name)` (prop da docgen), `list_templates`, `get_template(slug)` (sorgente), `validate_layout(json)`,
   `generate_code(layout)`, `suggest_components(intent)`; risorse: conventions, token del tema, esempi. Il server
   **legge** i metadati generati: se sono fedeli, il server è piccolo.
4. **Prerequisiti da soddisfare ora (D13)**: docgen completo (nessun `any` nelle prop pubbliche dove evitabile),
   nome e categoria stabili per ogni elemento, compositi e pagine d'esempio autonomi e registrati.

Domande da chiudere **prima** di iniziare: il builder produce codice o JSON interpretato a runtime? Chi lo usa
(sviluppatori o altri)? Dove si salvano i template personalizzati?

## 4. Mappatura iniziale → Glowup (da completare con lo spike 0.5)

| Famiglia del CRM                                                                              | Equivalente Glowup                                                                        | Vuoto principale                                                                      |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `Table` + `GrantMatrix` (CRM)                                                                 | `DataGrid`, `Table*`, `ListItem`                                                          | renderer di cella, `renderRow`, sticky, selezione, menu di riga, allineamento colonne |
| `Form/*` (CRM, RHF)                                                                           | `Input`, `Select`, `Autocomplete`, `Checkbox`, `DatePickerInput`, `RadioButton`, `Rating` | `Controller`-compatibile; contatore, locale numerico                                  |
| `Inputs/FetchAutoComplete` (CRM)                                                              | `Autocomplete`                                                                            | async con debounce, `multiple`, valore libero                                         |
| `Inputs/RangeNumbersField`, `DateRangeField` (CRM)                                            | `DateRangePicker`                                                                         | campo "1-5,8": resta nel CRM finché non serve altrove                                 |
| `Inputs/OtpField` (CRM)                                                                       | `PinInput`                                                                                | da verificare                                                                         |
| `Dialog/*` (CRM)                                                                              | `Modal`, `ConfirmDialog`, `AlertProvider`                                                 | form dialog (submit disabilitato, `overTitle`)                                        |
| `Filters/*` (CRM)                                                                             | `BottomSheet`, `SideSheet`, `ToggleButtonGroup`                                           | badge conteggio, tri-state, footer sheet                                              |
| `Chip/*` (CRM)                                                                                | `Chip`, `StatusBadge`                                                                     | `toneFrom`, pulse                                                                     |
| `Tabs` (CRM)                                                                                  | `ToggleButtonGroup`, `Tabs`                                                               | `SegmentedControl`, tab con chiave                                                    |
| Sidebar/menu per ruolo (CRM)                                                                  | `NavigationDrawer`, `NavigationRail`, `NavigationBar`                                     | gruppi annidati, compressione, `renderItem`; composito `AppShell`                     |
| `Snackbar`, `Menu`                                                                            | `Snackbar`/`ToastProvider`, `Menu`                                                        | verificare                                                                            |
| `Charts/*`, `Mobile/charts` (CRM)                                                             | — (nuovo)                                                                                 | Fase 4                                                                                |
| `PivotTable` (CRM)                                                                            | — (nuovo)                                                                                 | Fase 7                                                                                |
| `Mobile/BottomSheet`, `SegmentedControl`, `ContactCard`, `SkeletonList`, `MobileTabBar` (CRM) | `BottomSheet`, `ToggleButtonGroup`, `ListItem`, `Skeleton`, `NavigationBar`               | snap point, preset, slot                                                              |
| `engine/*` (schema), `Hubs`, `Router` (CRM)                                                   | —                                                                                         | **restano nelle app** (non-goal)                                                      |

## 5. Struttura finale prevista

```
packages/ui/src/                # libreria di base: @its/glowup-ui
  components/…                   # barrel invariata + prop nuove
  hooks/                         # useBreakpoint, useDebouncedValue, useInfiniteList…
  composite-ui/ → @its/glowup-ui/composite-ui   (compositi generici; nessuna dipendenza nuova)
packages/charts/                 # NUOVO: @its/glowup-charts (peer: @its/glowup-ui; dep: d3-scale, d3-shape)
packages/pdf/                    # NUOVO: @its/glowup-pdf (peer: @its/glowup-ui; react-native-pdf, react-native-blob-util, pdfjs-dist)
packages/pivot/                  # NUOVO: @its/glowup-pivot (peer: @its/glowup-ui; exceljs opzionale, solo web)
  src/core/  options/  localization/  hooks/  excel.ts   # core copiato da AuraPivot + nota di provenienza; renderer RN accanto
apps/playground/templates/       # pagine d'esempio (codice), come oggi
docs/native-verification.md      # matrice componente × piattaforma (web, iOS, Android) × data
docs/crm-component-matrix.md     # matrice 0.5
docs/pivot-upstream.md           # differenze dalla copia di AuraPivot
docs/handoff/                    # un file per sessione (§8)

Nel progetto CRM (fuori da questa repo):
  pacchetto/repo di componenti specifici del CRM, che dipende da @its/glowup-ui (livello 2, D10)
```

Per `composite-ui` (sottopercorso di `ui`): voce `exports`, cartella di fallback node10, `files`, test
sull'export map, mapping in `apps/playground/tsconfig.json`. Per ogni pacchetto separato (`charts`, `pdf`,
`pivot`): nuovo workspace (`"private": true` finché non è pronto), trusted publisher su npmjs.com, job CI,
regola ESLint che ammette **solo** `<pacchetto> → ui` e vieta gli incroci fra pacchetti, mapping nel `tsconfig`
del playground.

## 6. Rischi

| Rischio                                                                                 | Probabilità | Effetto | Mitigazione                                                                                                                                            |
| --------------------------------------------------------------------------------------- | ----------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Densità desktop** del CRM su react-native-web (tabelle, form lunghi, 33 route)        | media       | alto    | Spike 0.2 prima della 3A; DataGrid migliorata (1.4); composito `ListPage` con layout largo.                                                            |
| **Il web resta "il target che funziona per caso"** (nessun test su web oggi)            | media       | alto    | D17: colonna web nella matrice, jest su web (1.1), voce 1.11 sui problemi tipici del browser.                                                          |
| Le due copie del motore pivot divergono (AuraPivot e Glowup)                            | media       | medio   | Nota di provenienza, test portati in jest, `docs/pivot-upstream.md`; estrarre un pacchetto condiviso con AuraPivot se diventa frequente.               |
| Il core di AuraPivot ha dipendenze web nascoste (Intl su Hermes, `exceljs` in bundle)   | media       | medio   | Spike 0.1; modifiche mirate alla copia (`locale`, exporter separato).                                                                                  |
| `react-native-pdf` richiede dev build e blocca Expo Go                                  | alta        | medio   | Peer opzionale, documentato; WebView+pdf.js come alternativa; spike 0.3. Non tocca chi esce solo come sito.                                            |
| Mai verificato su dispositivo: i difetti nativi emergeranno tutti insieme               | alta        | medio   | Fase 1 prima delle fasi che aggiungono superficie; matrice di verifica; test ×3 in CI.                                                                 |
| Peso del bundle (charts, pivot, exceljs)                                                | bassa       | medio   | Pacchetti separati con `sideEffects: false`, exceljs opzionale e solo web; misura negli spike.                                                         |
| Tre pacchetti in più da rilasciare e da tenere compatibili con `ui`                     | media       | medio   | Workspace `private` finché non pronti; peer con intervallo di versione; `examples/consumer` che li installa dal registro; deprecazioni graduali (D15). |
| **Rottura delle app esistenti** quando la libreria cambia (quando la usa più di un'app) | media       | alto    | D15: 1.0, semver, deprecazione di almeno una minor, `examples/consumer` in CI, guida di migrazione.                                                    |
| Aggiornamenti Expo SDK trascinano tutte le app                                          | media       | medio   | D16: SDK corrente + precedente; un solo posto (la libreria) che si aggiorna per primo.                                                                 |
| Allargamento senza fine delle prop                                                      | alta        | medio   | D4 + regola "niente speculazione": ogni prop cita un file d'uso, evidenza debole non basta.                                                            |
| La libreria accumula nomi e logica di dominio del CRM                                   | media       | alto    | D2/D4; le app compongono, la libreria non conosce "cliente", "esito", "pratica".                                                                       |
| Il confine fra composito generico (libreria) e componente specifico (CRM) è sfumato     | media       | medio   | Criterio della Fase 5: se togliendo i nomi del CRM resta un componente utile altrove è generico; confine scritto nel README di `composite-ui`.         |
| Scope: otto filoni in parallelo con due persone                                         | alta        | alto    | Ordine del §3; 9 resta fermo; 3C, GrantMatrix, Timeline, Kanban, `/dnd` rinviati.                                                                      |

## 7. Non-obiettivi e anti-obiettivi

**Non-obiettivi** (non in questo piano): il rifacimento del CRM e i suoi rischi (telefonia WebRTC, tempo reale, passkey, notifiche, CRM web in parallelo), che sono del progetto CRM; il motore a
schema del CRM (`engine/*`); un client API, auth o modelli di dominio nella libreria; la navigazione/router (la libreria resta agnostica,
come oggi); generazione di PDF; Kanban e `GrantMatrix` (rinviati); zoom/pan nei
grafici; supporto a React Native senza Expo e a un'app React senza Expo (D14, §1.3); componenti specifici del CRM dentro la libreria (stanno nel CRM, D10); palette di marca di nuovi progetti dentro la libreria (§2); modifiche alla repo AuraPivot (D8).

**Anti-obiettivi** (il piano fallisce anche se "funziona"): la libreria che importa react-intl, i18next,
react-hook-form, Jotai o SignalR; un `@its/glowup-ui` che costringe chi usa un `Button` a
installare un viewer PDF o altri moduli solo-nativi; prop o componenti che nominano il dominio del CRM; componenti nuovi
senza test su ios/android/web; "funziona sul web" dichiarato come "funziona su React Native" (e viceversa); una
modifica incompatibile pubblicata senza deprecazione quando più progetti dipendono dalla libreria; una seconda
copia locale della libreria in un'app perché adottare il pacchetto costa troppo.

## 8. Come si lavora (processo)

1. Per ogni fase: branch dal basso (`dev`), un changeset per cambiamento visibile, PR piccole per
   componente/lotto, DoD del §2.
2. Prima di scrivere codice per una fase: aggiornare qui le decisioni toccate e lo stato della fase;
   nessuna fase parte con un _Proposta_ che la riguarda ancora aperto.
3. Le fasi con piano di dettaglio proprio (come `device`) ottengono un documento di fase
   (`docs/crm-phase-N-*.md`) con task, test e note di verifica; **questo** documento resta l'indice.
4. Dopo ogni fase: "cosa è atterrato", "verificato", "da verificare su dispositivo", "aperto per dopo",
   nello stile di `device-package-plan.md`.
5. Il codice copiato da AuraPivot riporta versione e commit di origine in testa a ogni file o in
   `docs/pivot-upstream.md`; le differenze volute si registrano lì.
6. **Handoff a fine sessione.** Ogni sessione di lavoro si chiude con un file di passaggio per la successiva:
   `docs/handoff/AAAA-MM-GG.md` (se ce n'è più d'uno nello stesso giorno, suffisso `-2`). Contiene: cosa è
   stato fatto; stato delle fasi; decisioni prese o cambiate; cosa è verificato e cosa no (web, iOS, Android);
   file toccati e commit fatti; domande aperte; **prossimo passo**. La sessione successiva parte leggendo
   l'ultimo handoff e questo documento.
7. **Git.** Claude **non fa mai `push`** e non apre PR: li fa l'utente. Claude fa `commit` **solo alla fine di
   ogni grande implementazione** (un lotto di prop completo, un pacchetto o sottopercorso, una fase, uno spike concluso),
   non a ogni modifica; il messaggio dice cosa è atterrato. Il file di handoff si committa insieme all'ultima
   grande implementazione; se in una sessione non ce n'è stata nessuna, resta fuori dal commit.

## 9. Domande aperte

**Tutte chiuse il 2026-10-15 con il default indicato** (Q1–Q6). Il testo resta come registro delle decisioni.

1. **Priorità tra web e telefono (D17)?** Default: il **web è il primo target** (browser desktop e mobile); il
   nativo si verifica in Fase 1 sui componenti principali e poi si estende. Se il telefono è prioritario fin
   da subito, la Fase 1 (verifica nativa) e la Fase 6 (PDF nativo) salgono di priorità.
2. **Drag and drop (`/dnd`)?** Nel CRM serve per il Kanban e per spostare i campi del pivot, ma richiede
   `react-native-gesture-handler`/`reanimated` come peer **opzionali**. Default: **rinviato** a dopo la
   Fase 4; si fa quando una schermata del CRM lo richiede davvero.
3. **Politica Expo (D16):** SDK corrente + precedente. Per un'app significa aggiornare l'SDK una o due volte
   l'anno insieme alla libreria. Va bene?
4. **Tre pacchetti separati (D3).** Ho applicato la regola anche a pivot e PDF, oltre ai grafici: `packages/charts`, `packages/pivot`, `packages/pdf`, ognuno con versione propria, nello stesso monorepo e con `@its/glowup-ui` come peer. Il costo è avere tre rilasci (e tre trusted publisher su npm) invece di uno. Va bene? I nomi `@its/glowup-charts`, `-pivot`, `-pdf` seguiranno il rename a Solaris.
5. **Componenti specifici del CRM (D10).** Ho inteso: una cartella/pacchetto a parte **dentro il progetto CRM**, che dipende dalla libreria di base, e non una terza repo. È così? Come lo collegano alla libreria: pacchetto npm pubblicato o link locale? Default: pacchetto npm pubblicato; link locale solo durante lo sviluppo.
6. **Nome del sottopercorso dei compositi:** `composite-ui` (provvisorio). Va bene o preferisci un altro nome?

## 10. Aperto per dopo

`/dnd` (trascinamento touch); TimelineChart; `GrantMatrix` e Kanban come componenti; `ScatterChart` e
`AreaRange` (se un'app li usa); zoom/pan nei grafici; annotazioni PDF; export Excel nativo; trascinamento dei
campi del pivot su touch; supporto a un'app React non-Expo con react-native-web (oggi non verificato);
cataloghi di etichette per tutte le lingue; generazione di template da MCP (Fase 9).
