# Divisione del lavoro tra due persone

Il piano di riferimento resta `docs/solaris-native.md` (decisioni D1–D17, fasi 0–9, Definition of done al §2, processo al §8).
Questo documento dice **chi fa cosa, in che ordine e dove si incontrano i due filoni**. Non è un handoff e non sostituisce
il piano: se i due si contraddicono, vale il piano e questo si corregge.

Stato di partenza: `dev` a `1d92ebc`, 2026-10-19. Fase 0 chiusa (0.6 parziale), Fase 2 a metà, lotti 3A e 3B quasi chiusi.
Le fasi 1 (a parte l'avvio della verifica nativa), 4, 5, 6, 7, 8 e 9 non sono iniziate.

Accordo preso: **una persona lavora esclusivamente su `packages/ui`; l'altra si occupa di tutto il resto.** Le due persone si
chiamano qui:

- **A**: tutto ciò che **non** è `packages/ui`: pacchetti nuovi (`charts`, `pdf`, `pivot`), playground, CI, strumenti, verifica nativa, documentazione.
- **B**: **solo `packages/ui`**: componenti, hook, tema e token, `composite-ui`, test della libreria.

---

## 1. Principi della divisione

1. **Una cartella, un proprietario.** `packages/ui` è di B; tutto il resto è di A. Chi non è il proprietario non modifica quei
   file: apre una richiesta (issue o messaggio) con la prop o la correzione che serve. L'unica eccezione, e va tenuta stretta, è
   nel §2.
2. **`ui` ha una sola persona.** `master` ha 24 commit dell'audit (ui 0.12.0) e `dev` non li assorbe (decisione del
   2026-10-16). I conflitti di prova stanno in `Button`, `Chip`, `DataGrid`, `Input`, `ListItem` e `props.generated.json`,
   cioè tutti dentro `ui`: con una sola persona in quella cartella non peggiorano per colpa del lavoro in parallelo.
3. **I pacchetti nuovi non toccano `ui`.** Per D3 `charts`, `pivot`, `pdf` importano solo `@its/glowup-ui` (mai il contrario)
   e **non si importano fra loro**. Dove un grafico o un PDF deve comparire dentro un componente della libreria, `ui` offre
   uno **slot** e l'app compone: `ui` non può importare nessuno dei tre.
4. **Prima il contratto, poi il codice.** Dove un filone aspetta l'altro, chi produce pubblica per primo **il tipo o il nome**
   (token, prop, firma) in un commit piccolo. L'altro codifica contro quello, senza aspettare l'implementazione.
5. **Ogni pezzo si chiude con la stessa Definition of done** (§6), non con "funziona sul web".

---

## 2. Mappa di proprietà

| Area                                                                                                 | Proprietario | Nota                                                              |
| ---------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| `packages/ui/**` (compresi `theme.json`, `composite-ui`, config e progetti jest della libreria)      | B            | Tutto il codice e i test della libreria                           |
| `packages/charts/**`, `packages/pdf/**`, `packages/pivot/**`                                         | A            | Nuovi. Nascono `"private": true`                                  |
| `packages/device/**`, `packages/notifications/**`                                                    | nessuno      | Fermi. Se serve toccarli, si decide caso per caso                 |
| `apps/playground/**` (pagine, `native-check`, scripts, docgen), `.github/**`, `examples/consumer/**` | A            | Vedi l'eccezione sotto per le voci di catalogo                    |
| Config di root: `eslint.config.js`, `package.json`, `CLAUDE.md`, `tsconfig` del playground           | A            | B non li tocca; se gli serve una modifica la chiede               |
| `docs/native-verification.md`, `docs/pivot-upstream.md`, `docs/crm-phase-N-*.md` dei pacchetti       | A            | B segnala i difetti di `ui` trovati, A li registra                |
| `docs/solaris-native.md`                                                                             | A            | Eccezione sotto per le sezioni delle fasi di B                    |
| `docs/component-inventory.md`, `props.generated.json`, gallerie `variants`, `sources.generated.ts`   | **generati** | Mai a mano e mai risolti a mano: dopo un merge si rigenerano (§5) |

### L'eccezione: ciò che un componente di `ui` richiede fuori da `packages/ui`

La Definition of done di un componente (§6) tocca file che stanno **fuori** da `packages/ui`: la voce di registry, il nome in
`categories.ts`, la voce in `CATALOGUE` del test, l'anteprima in `.design-sync/previews`, i file generati, il changeset, la
nota nel piano. Separarli da `ui` renderebbe A un collo di bottiglia per ogni prop. **Proposta** (da confermare, §8): B tocca
questi file, e **solo questi**, nella misura in cui la DoD lo richiede e **solo con aggiunte**:

- `apps/playground/catalogue/registry/**`, `catalogue/categories.ts`, `CATALOGUE` del test del catalogo, `site/` solo per la
  pagina del componente nuovo;
- `.design-sync/previews/**`;
- `.changeset/*.md` (un file per modifica, con nome proprio);
- `docs/solaris-native.md`: la sezione delle proprie fasi (1 per la parte `ui`, 2, 3, 5) e la propria riga nella tabella;
  `docs/crm-component-matrix.md` (colonna "fatto");
- `docs/handoff/AAAA-MM-GG.md`: il file della giornata, nella propria sezione.

Tutto il resto del playground (pagine nuove, `native-check`, workflow, strumenti) resta di A: se B vuole che un componente sia
provato su un telefono, chiede ad A di estendere `/native-check`.

---

## 3. Il lavoro di A (pacchetti nuovi, strumenti, verifica nativa)

### A1 — Impalcatura dei pacchetti (**fatta per `pdf` il 2026-10-19**; `charts` e `pivot` nascono quando si comincia a lavorarci)

Si era previsto di creare subito i tre workspace vuoti. Si è fatto solo `pdf`: due cartelle vuote non servono a niente finché
non ci si lavora, e ognuna costa soltanto una cartella, un mapping nel `tsconfig` del playground, una riga nello script
`build` e in `ci.yml`, e un `npm install`. Le parti generiche (regola ESLint con `ADDON_PACKAGES`, testo di `CLAUDE.md`) sono
già scritte per tutti e tre. Per creare `charts` o `pivot`: copiare `packages/pdf`, cambiare nome e descrizione, e aggiungere
le quattro righe appena elencate.

- `packages/pdf` (poi `packages/charts` e `packages/pivot`): `package.json` sul modello di `packages/device` (`exports`,
  `main`/`module`/`types`, `source`, `react-native`, build con `react-native-builder-bob`, `tsconfig`, `tsconfig.build.json`),
  **`"private": true`**, `@its/glowup-ui` come **peer** con intervallo di versione. Le dipendenze pesanti
  (`d3-scale`/`d3-shape`, `react-native-pdf`, `react-native-blob-util`, `pdfjs-dist`, `exceljs`) stanno **nel pacchetto che le
  usa**; quelle solo-native e `exceljs` sono **peer opzionali** (`peerDependenciesMeta`).
- `eslint.config.js`: oggi nessun pacchetto importa un altro. La regola nuova (§1.1 del piano) è: `charts`, `pivot`, `pdf`
  possono importare `ui`, **non si importano fra loro**, e `ui` non importa nessuno dei tre (vincolo che B deve conoscere).
- `apps/playground/tsconfig.json`: un mapping per pacchetto verso il suo `src/index.ts` (il `CLAUDE.md` di root dice che sono
  gli unici mapping, quindi anche quel testo cambia).
- `package.json` di root: lo script `build` nomina i workspace uno per uno, vanno aggiunti; lo stesso per `validate-package`
  in `ci.yml`.
- `CLAUDE.md` di root (tabella dei workspace, regola dei confini) e un `CLAUDE.md` breve per ogni pacchetto.
- `package-lock.json` rigenerato con `npm install` e committato insieme.

**Da verificare qui:** `docgen` (`apps/playground/docgen/extract-props.mjs`, `UI_ROOT = packages/ui`) estrae le prop **solo**
da `packages/ui`. Per i pacchetti nuovi serve decidere se estenderlo o documentare le prop a mano, prima che il primo pacchetto
entri nel catalogo.

### Lavori di A

| ID  | Lavoro                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Dipende da                     | Uscita                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| A0  | **Artefatti di CI di `badd994`** (`ios-smoke`, `android-smoke`): leggerli, correggere `/native-check` e `scripts/android-interact.mjs` finché i passi tornano. Un solo push alla volta. I difetti che risultano essere di `ui` si passano a B con il caso minimo.                                                                                                                                                                                                                                                                                                                                                                                                                                                        | —                              | Misure su iOS e Android lette; script che passa o fallisce per un motivo vero; elenco difetti per B   |
| A1  | **Impalcatura** (sopra).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | —                              | Workspace `pdf` vuoto; lint, type-check, build verdi                                                  |
| A2  | **Fase 6, `packages/pdf`**: `PdfViewer` (`source` = `uri`, `bytes`, `base64`, `blob`; `initialPage`, `page`, `zoom`, `fit`, `onLoad`, `onError`), `usePdfDocument()`, toolbar a slot, stati vuoto/caricamento/errore con i token. Web: `iframe` su `blob:`. Nativo: modulo nostro (PDFKit, `PdfRenderer`), file scaricato con `expo-file-system`, nessuna libreria di terzi (D9 riscritta, `docs/pdf-package-plan.md`). **Stato 2026-10-20: passi 0–6 e 8 fatti** (web in Chrome; iOS e Android 14/15 solo in CI, mai su telefono); passo 7 (ricerca di riserva) solo se servono telefoni senza ricerca di sistema. Ancora `private`.                                                                                    | A1                             | Viewer su web (prioritario), iOS e Android con un PDF autenticato e uno da base64; nota su cosa manca |
| A3  | **Fase 7, core di `packages/pivot`**: copia di `pivot-core/` (circa 149 KB), `options/`, `localization/`, hook e contesto da AuraPivot 2.6.0, con **versione e commit di origine** in testa; `locale` esplicito; separatori senza `Intl.formatToParts` (manca su iOS); esportatore Excel in `excel.ts` a parte, `exceljs` peer opzionale **solo web**; porting dei test da vitest a jest (la lista delle modifiche è nello spike 0.1); `docs/pivot-upstream.md`. **La repo AuraPivot non si modifica.**                                                                                                                                                                                                                  | A1                             | Test del core verdi in jest nella nostra CI; nota di provenienza; elenco delle differenze volute      |
| A4  | **Fase 4, `packages/charts`**: nucleo comune (misura da `onLayout`, primo frame a larghezza 0 che non rompe il grafico; tooltip al tocco e al passaggio del mouse su web; colori **solo dai token**; `Intl`; `loading`/`empty`; `useReduceMotion`; riassunto testuale per lo screen reader). Poi: `BarChart`, `LineChart`/`AreaChart`, `DonutChart`, `StackedBar`, `Sparkline`, `Gauge`, `ChartLegend`, facciata `Chart`. Dai 10.000 punti, modalità a `<Path>` unico (spike 0.4). **Stato 2026-10-21: passi 0–8 fatti** (`docs/charts-package-plan.md`; web in Chrome, iOS e Android 14/15 solo layout in CI); manca B0 per i colori definitivi, la prova di tocco e tempi sul nativo e il changeset. Ancora `private`. | A1, **B0** (nomi), B2 (valori) | Grafici del CRM mobile riproducibili; prestazioni misurate su web                                     |
| A5  | **Fase 1, strumenti**: 1.2 `expo export -p ios` e `-p android` in `examples/consumer`; 1.13 criterio scritto per l'1.0, politica di deprecazione e di supporto Expo, guida "come adottare la libreria in un'app Expo" (incluso solo-web), in `docs/` e nel `CLAUDE.md` di root. Il README di `ui` lo aggiorna B con il testo di A.                                                                                                                                                                                                                                                                                                                                                                                       | —                              | Bundle nativo verde nel consumer; criterio e guida pubblicati                                         |
| A6  | **Renderer del pivot** (Fase 7, strati 1–4): griglia in sola lettura con intestazioni sticky e virtualizzazione, pannello campi in `BottomSheet`/`SideSheet` (su touch **senza trascinamento**), campi calcolati e formati condizionali, esportazione. Test di parità sullo stesso `report` tra AuraPivot e la copia.                                                                                                                                                                                                                                                                                                                                                                                                    | A3, **B5 (1.4)**, A4           | 50k righe su web, 5k su nativo; verifica per piattaforma registrata                                   |
| A7  | **Verifica per piattaforma**: crea `docs/native-verification.md` (matrice componente × piattaforma × data × versione, con **sezioni separate** per web e per iOS/Android); estende `/native-check` su richiesta di B; **solo con un Mac o un telefono**: 0.6, Hermes reale (1.7), PDF con un file vero. Dal portatile di A non si può (niente amministratore, rete aziendale).                                                                                                                                                                                                                                                                                                                                           | A0; A2 per il PDF              | Matrice compilata con data e versione; elenco difetti con esito per B                                 |
| A8  | **Fase 8, schermate pilota del CRM** nel playground (accesso con 2FA, contatti, scheda cliente, report), costruite solo con la libreria. Ogni vuoto trovato torna ai documenti come prop o componente **con nome generale** e diventa richiesta per B.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | B5 (1.4), B3, composite-ui     | Quattro schermate funzionanti su browser desktop e mobile; matrice 0.5 aggiornata                     |
| A9  | **Rilascio dei pacchetti nuovi** quando un pacchetto esce da `private`: trusted publisher su npmjs.com, job in `release.yml` e in `ci.yml`, `examples/consumer` che lo installa dal registro (mai un workspace).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | pacchetto pronto               | Pacchetto pubblicato e verificato dal consumer                                                        |

---

## 4. Il lavoro di B (`packages/ui`)

Ordine consigliato. I numeri tra parentesi sono le voci del piano.

| ID  | Lavoro                                                                                                                                                                                                                                                                                                                                                                                   | Dipende da | Uscita                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| B0  | **Contratto dei token per i grafici** (parte di 2B-c): pubblicare il **tipo** della palette dei grafici (serie categoriche, sequenziale, divergente, chiaro/scuro) e del gradiente di marca, con valori provvisori, in `theme.json` **e** nel tipo `Theme` (il guard li confronta).                                                                                                      | —          | Commit piccolo con nomi stabili: **A lo aspetta per i grafici**                                      |
| B1  | **Test su tre piattaforme** (1.1): progetti jest `jest-expo/ios`, `/android`, `/web` in `packages/ui`; i test esistenti girano su tutti, con eccezioni dichiarate. È in testa perché la DoD chiede test su tre piattaforme per ogni componente nuovo. I test che falliscono per un componente si correggono qui.                                                                         | —          | Tre progetti jest verdi; elenco delle eccezioni                                                      |
| B2  | **2B-c completo**: valori della palette dei grafici validati per contrasto (la skill `dataviz` ha il validatore), `gradients.brand` e `gradients.brandDisabled` con `react-native-svg` `LinearGradient` (già peer).                                                                                                                                                                      | B0         | Token finali, test, changeset                                                                        |
| B3  | **Chiudere il 3B**: `ToggleButtonGroup` con valori tipizzati (`true`/`false`/`null`, tooltip per opzione) e `Stepper` a pallini o barra con Indietro/Avanti. Prima, per ciascuno, dichiarare se basta una prop su un componente esistente.                                                                                                                                               | B1         | Prop o componente, test su 3 piattaforme, inventario rigenerato                                      |
| B4  | **Lotto 3C**: `DayTimeline` (controllare prima `Calendar`, `ListItem`, `Card`: probabile composizione), `Calendar` con marcatori per giorno, `Skeleton` con preset `list`/`card`/`table`.                                                                                                                                                                                                | B3         | Idem                                                                                                 |
| B5  | **Fase 1, parte `ui`**: 1.4 `DataGrid` (eliminare la `FlatList` verticale dentro lo `ScrollView` orizzontale, allineare intestazione e corpo), 1.5 liste lunghe, 1.11 sovrapposizioni/focus/tastiera su web, 1.12 safe area dichiarata nei README e con errore leggibile. **1.4 sblocca il renderer del pivot di A.**                                                                    | B1         | Difetti trovati con esito (corretto / accettato / rinviato), passato ad A per la matrice di verifica |
| B6  | **Parti native della Fase 1** (1.6 tastiera in `Modal`/`BottomSheet`/`SideSheet`/`Autocomplete`, 1.8 animazioni, 1.9 RTL, 1.10 accessibilità con VoiceOver e TalkBack): il codice è di B, **la prova a schermo dipende da A7** (CI o dispositivo). Senza prova restano "non verificate".                                                                                                 | B5, A7     | Correzioni di `ui` dopo i risultati di A7                                                            |
| B7  | **Fase 5, `composite-ui`** (sottopercorso di `ui`): `AppShell`, `ListPage`, `FormDialog`/`FormPage`, `DetailPage`, `WizardPage`, `ReportPage` (grafici e pivot **come slot**, mai importati), `OptionPicker`, `ActivityTimeline`, `AgendaPage`, ecc. Voce `exports`, cartella di fallback node10, `files`, test sull'export map; il mapping nel `tsconfig` del playground lo aggiunge A. | B3, B4, B5 | Compositi con test e pagina d'esempio; ogni prop mancante torna alla Fase 3                          |
| B8  | **Hook rimasti** (`useInfiniteList`, `useAbortableEffect`, `useActiveFilters`…): **solo quando un componente o composito li usa** (D4). Prima decidere dove sta `useInfiniteList` (libreria o CRM). Qui anche: `density` automatica per larghezza o solo prop del `ThemeProvider`.                                                                                                       | B7         | Hook esportati e documentati                                                                         |
| B9  | **Richieste di A** (A0, A7, A8): difetti di `ui` trovati su un emulatore o in una schermata pilota, e prop che mancano. Hanno la precedenza sul lotto in corso se bloccano A.                                                                                                                                                                                                            | —          | Correzioni o risposta motivata (D4: nessuna prop senza uso concreto)                                 |

Fuori dal lavoro di B finché una schermata non le chiede: tutto l'elenco "non fatti per scarsa evidenza" del 2026-10-16
(`multiple` e `uppercase` di `Autocomplete`, snap point del `BottomSheet`, larghezze in percentuale di `DataGrid`, ecc.).

---

## 5. Come si incontrano i due filoni

### Sequenza

```
              A (resto)                          B (packages/ui)
 ──────────────────────────────────────────────────────────────────────────
 onda 0   A0 artefatti di CI                  B0 contratto dei token grafici
          A1 impalcatura di pdf (fatta)       B1 jest ×3
 ──────────────────────────────────────────────────────────────────────────
 onda 1   A2 PDF                              B2 2B-c completo
          A3 core del pivot                   B3 chiude 3B
 ──────────────────────────────────────────────────────────────────────────
 onda 2   A4 grafici   (ha il contratto B0)   B4 3C
          A5 consumer nativo, guida 1.0       B5 Fase 1: DataGrid, web
 ──────────────────────────────────────────────────────────────────────────
 onda 3   A6 renderer del pivot (serve B5)    B6 parti native (servono i risultati di A7)
          A7 verifica nativa / dispositivo    B7 composite-ui (grafici, PDF, pivot come slot)
 ──────────────────────────────────────────────────────────────────────────
 poi      A8 schermate pilota, con B in supporto (B9).   A9 rilascio.   Fase 9 resta ferma.
```

Perché A parte dal PDF e non dai grafici: il PDF è il pacchetto più piccolo, ha lo spike chiuso e porta con sé tutto
l'impianto di un pacchetto nuovo (build, export map, peer opzionali, playground). I grafici aspettano i token di B0/B2.

### Cosa si aspettano a vicenda

| Chi aspetta             | Cosa                                                                                   | Chi lo fornisce / come                           |
| ----------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| A4 (grafici)            | Nomi e tipo dei token della palette dei grafici                                        | B0, in un commit piccolo                         |
| A6 (renderer del pivot) | `DataGrid` con intestazione e corpo allineati e virtualizzazione corretta (1.4)        | B5                                               |
| B1 (jest ×3)            | Niente da A. I test su android/web che falliscono per un componente li corregge B      | —                                                |
| B6 (parti native)       | Prova a schermo su emulatore o dispositivo                                             | A7, con `/native-check` esteso su richiesta di B |
| B7 (`composite-ui`)     | `PdfViewer`, grafici e pivot **solo come slot**: non servono per scrivere il composito | niente: B usa un segnaposto                      |
| B7 (`composite-ui`)     | Mapping nel `tsconfig` del playground e pagina d'esempio nel catalogo                  | A per il mapping; B per la voce di catalogo (§2) |
| A8 (schermate pilota)   | Lotto 3A, `DataGrid` 1.4, almeno parte dei compositi                                   | B                                                |
| Entrambi, `native.yml`  | Un solo push alla volta su `dev`                                                       | vedi sotto                                       |

### File condivisi e come si trattano

| File                                                         | Regola                                                                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `package-lock.json`                                          | Mai a mano. Dopo un merge: `npm install` e commit del lockfile                                                 |
| `props.generated.json`, `component-inventory.md`, `variants` | Mai a mano. Dopo un merge: `npm run docgen -w @its/glowup-playground`, `npm run inventory`, `npm run variants` |
| `.changeset/*.md`                                            | Un file per modifica, con nomi diversi: non confliggono                                                        |
| Registry, `categories.ts`, `CATALOGUE` del playground        | Solo aggiunte (B per `ui`, A per i pacchetti nuovi). In caso di conflitto si tengono tutte e due le voci       |
| `docs/solaris-native.md`                                     | Ognuno aggiorna solo la sezione delle proprie fasi e la propria riga nella tabella                             |
| `eslint.config.js`, `package.json` di root, `CLAUDE.md`      | Solo A. B chiede                                                                                               |

### Rami e CI

- **Tutti e due lavorano direttamente su `dev`**, senza rami di lavoro e senza PR. `master` non entra (decisione del
  2026-10-16). **Aggiornamento 2026-10-19:** per ora B lavora su un altro ramo, non su `dev`: le regole sotto su push
  incrociati e CI nativa valgono quando B torna su `dev`; fino ad allora `dev` ha un solo autore, e il lavoro di B in `ui`
  arriva con un merge o un cherry-pick deciso insieme, non con un push diretto.
- **Prima di ogni push**: `git pull --rebase origin dev`, poi si rilanciano in locale `type-check`, `lint` e i test dei
  workspace toccati. Su `dev` **non gira nessun controllo automatico a parte la CI nativa**: `ci.yml` parte solo sulle push a
  `master` e sulle PR, quindi un errore di lint o di tipi su `dev` lo trova solo chi lo prova in locale.
- **Dopo un pull che porta file generati** (`props.generated.json`, `component-inventory.md`, `variants`): si rigenerano, non
  si risolvono a mano (vedi la tabella sopra). Lo stesso per `package-lock.json`.
- **Commit piccoli e per cartella**: un commit non mescola `packages/ui` e il resto, così un rebase che confligge tocca una
  persona sola. Un lotto di B che richiede file del playground (§2) li mette in un commit a parte, subito dopo.
- `native.yml` parte a ogni push su `dev` che tocchi `packages/**` o `apps/playground/**`, e ha
  `cancel-in-progress: true`: **un secondo push cancella il run in corso**, e un run dura circa 15 minuti per piattaforma.
  Con due persone che fanno push sullo stesso ramo succede facilmente: **si avvisa prima di pushare**, si raggruppano i push e
  chi aspetta gli artefatti di un run (A0, A7) lo dice. Il push resta della persona, non di Claude.

---

## 6. Quando un pezzo è finito (vale per tutti)

Dal §2 del piano, applicato anche ai pacchetti nuovi:

- esportato dall'`index.ts` del pacchetto (o dal suo sottopercorso), prop documentate, nome e categoria stabili;
- voce di registry, nome in `categories.ts`, voce in `CATALOGUE` del test, anteprima in `.design-sync/previews`;
- test **su ios, android e web**;
- changeset, e `npm run docgen` / `variants` / `templates` senza diff;
- `type-check`, `lint`, `test`, `build`, `validate-package` verdi;
- **dichiarato cosa è provato su web, iOS e Android e cosa no.** "Funziona sul web" non si scrive come "funziona su React Native";
- niente colori a mano (solo token), area di tocco minima 44 px, ruolo e nome accessibile su ogni controllo, nessuna
  interazione solo-hover;
- prop nuove solo con un uso concreto citato (file del CRM) e un nome che non parla di dominio (D4);
- una dipendenza nuova si giustifica contro la regola dei peer e il peso del bundle; un peer solo-nativo è sempre opzionale.

Regole di processo che valgono anche per le sessioni con Claude di entrambi:

- **prima di creare un componente nuovo, controllare e dichiarare se basta una prop su uno esistente**;
- a ogni lotto che tocca componenti: `npm run docgen -w @its/glowup-playground && npm run inventory -w @its/glowup-playground`, poi
  commit di `docs/component-inventory.md`;
- niente `git push` fatto da Claude, niente PR aperte da Claude;
- commit alla fine di un lotto completo (una prop o un gruppo di prop, un pacchetto, uno spike), non a ogni modifica;
- **un solo handoff per giornata** in `docs/handoff/AAAA-MM-GG.md`: se esiste già lo si aggiorna, con una sezione per persona
  (A e B), e non se ne crea un altro per lo stesso giorno. Dato che lavorate entrambi su `dev`, prima di scriverlo si fa
  `git pull --rebase` per vedere se l'altro l'ha già creato.

---

## 7. Fuori dalla divisione

Non appartengono a nessuno dei due, per ora: Fase 9 (template builder e MCP, ferma finché non ci sono almeno 6 compositi
stabili), `GrantMatrix`, Kanban, `TimelineChart`, `/dnd`, `ScatterChart`, esportazione Excel nativa, il rename a Solaris UI,
il rifacimento del CRM (progetto a parte, D1), il merge di `master` in `dev` (deciso di non farlo).

---

## 8. Da decidere prima di partire

1. **Le modifiche di `ui` che stanno solo su `master`.** L'audit (ui 0.12.0) ha cambiato proprio `DataGrid`
   (`onColumnReorder`), `ListItem` (`itemHoveredStyle`, `itemPressedStyle`, `itemSecondaryTextStyle`), `Input` (alias `readonly`,
   prop di `TextInput` passate avanti) e `useToast` (`queue`). B lavora solo in `ui` partendo da `dev`, dove queste non ci sono.
   Va deciso se B le riporta in `dev` (a mano, non con un merge) o se restano fuori. Se B è anche l'autore di quell'audit, conosce
   le differenze; ma la regola attuale è non copiare codice da `master` senza chiederlo, quindi serve una risposta esplicita.
2. **L'eccezione del §2.** B tocca le voci di catalogo, le anteprime, i changeset e le sezioni del piano che la DoD richiede
   per i componenti di `ui`? Se no, ogni prop passa da A e A diventa il collo di bottiglia; se sì, "esclusivamente `packages/ui`"
   vale per il codice, non per questi file.
3. **B ha un Mac o un telefono?** Se sì, la verifica su dispositivo (A7) può passare a B, che vede subito l'effetto delle
   correzioni di `ui`; se no, iOS e Android restano "non verificati" e si lavora solo con la CI, come oggi.
4. **Accesso ad AuraPivot per A.** Il core sta in `C:\Users\a.rossi\Documents\Dev\AuraPivot-master` (repo
   `itsolutions-dev/AuraPivot`, versione 2.6.0), fuori da questa repo. A3 parte da lì: serve la stessa versione e il suo commit.
5. **Dove sta `useInfiniteList`** (libreria o CRM) e se `useActiveFilters` si crea (B8), prima della Fase 5.
6. **`docgen` per i pacchetti nuovi**: estenderlo o documentare a mano (A1).
7. **Come ci si avvisa dei push su `dev`** (§5): un canale o un messaggio fisso prima di ogni push, perché un secondo push
   cancella il run di CI nativa in corso e nessun controllo automatico copre `dev`.
