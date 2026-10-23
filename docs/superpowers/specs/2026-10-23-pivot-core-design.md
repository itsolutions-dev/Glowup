# Pivot, pezzo 1: impalcatura e core — progetto

Stato: **da approvare** (Alice, 2026-10-23). Riferimenti: `docs/solaris-native.md` Fase 7 e D8, `docs/work-split.md` A1 e A3, `docs/spike-0.1-pivot-core.md`.

## Contesto: come si divide `pivot`

`@its/glowup-pivot` è un progetto grosso e si fa a pezzi, ognuno con un progetto suo:

1. **Impalcatura e core** (questo documento).
2. Griglia in sola lettura, **dentro `packages/pivot`** (decisione di Alice, 2026-10-23: non si aspetta né si estende la `DataGrid` di `ui`, che è una `FlatList` di righe piatte, senza intestazioni o colonne fisse).
3. Pannello dei campi e filtri.
4. Campi calcolati, formati condizionali, drill-through.
5. Esportazione (CSV sul nativo, Excel solo sul web).

Il piano dice che A6 aspetta la «1.4» del collega: con la decisione sopra non più. Da correggere nel piano quando si arriva al pezzo 2.

## Scopo

Avere in `packages/pivot` il **motore del pivot** di AuraPivot 2.6.0, funzionante e provato nella nostra CI, senza interfaccia. Serve a tre cose: fissare l'API su cui costruiremo la griglia, far girare i test del motore nella nostra CI e iniziare il registro delle differenze dall'originale.

## Obiettivi

- Il pacchetto `@its/glowup-pivot` esiste nel monorepo, `private`, costruito sul modello di `packages/charts`.
- Il core, `options`, `localization`, gli hook e il contesto di AuraPivot sono copiati con la stessa struttura di file.
- **I test del core girano in jest nella nostra CI.** Lo spike ne ha portati 150 su 150 senza toccare il sorgente.
- `docs/pivot-upstream.md` registra la provenienza e ogni differenza voluta, come `docs/charts-upstream.md`.
- Il core non usa il DOM e non legge `navigator`.

## Non obiettivi

- Nessun componente, nessuna schermata, nessuna pagina nel playground: il pacchetto esporta solo il motore e gli hook.
- Nessuna esportazione Excel (pezzo 5). Il file `ExcelExporter` non si copia ora.
- Nessuna prova su dispositivo: il core è già stato provato su Hermes (Android e iOS) nello spike; basta la CI con jest.
- Nessun changeset e nessuna pubblicazione: il pacchetto resta `private`.

## Contro-obiettivi (sarebbe un fallimento anche se «funziona»)

- Modificare la repo AuraPivot, o far divergere la copia senza registrarlo.
- Far entrare `exceljs`, MUI o il DOM nel bundle nativo.
- Assumere che numeri e date si formattino uguale su iOS e Android (non è così: spike 0.1).

## Vincoli

- Confini di import già in `eslint.config.js` (`ADDON_PACKAGES` comprende `pivot`): il pacchetto importa solo `@its/glowup-ui` e nient'altro di nostro. Il core non ha bisogno di `ui`.
- Nessun push da parte di Claude. `npm ci --ignore-scripts` in CI: nessuno script di installazione. Il lockfile si aggiorna e si committa con il manifesto.
- La copia di AuraPivot sul disco (`C:\Users\a.rossi\Documents\Dev\AuraPivot-master\AuraPivot-master`) **non ha `.git`**: del commit di origine, che il piano chiede, c'è solo la versione 2.6.0.

## Approcci considerati

1. **Copiare il core nel pacchetto (scelto, D8).** Stessa struttura di file, differenze registrate.
2. **Dipendere da `aurapivot` su npm**, come fa il CRM. Scartato: il pacchetto porta MUI e il DOM; il core non ha un punto di ingresso suo (`exports` ha solo `.`, `./theme`, `./locales/*`); l'esportazione Excel è nel mezzo del core e `exceljs` finirebbe nel bundle nativo.
3. **Estrarre un pacchetto di core condiviso con AuraPivot.** Scartato per ora: richiede di modificare AuraPivot, che il piano vieta; si riprende se la copia divergerà spesso (§1.1 del piano).

## Cosa si fa

**Impalcatura (A1).** Copiando `packages/charts` (senza la parte nativa e senza `src/vendor`): `package.json` (nome, descrizione, `private: true`, peer `@its/glowup-ui`, `react`, `react-native`; niente `react-native-svg`), `tsconfig*.json`, `babel.config.js`, `jest.setup.js`, `CLAUDE.md` e `README.md` del pacchetto. Poi: mapping `@its/glowup-pivot` in `apps/playground/tsconfig.json` e dipendenza nel `package.json` del playground; nome nello script `build` della radice e nel `validate-package` di `ci.yml`; riga in `CLAUDE.md` della radice (tabella dei workspace e mapping); lockfile.

**Copia (A3), in `packages/pivot/src/`:**

| Da AuraPivot                    | A                                          | Note                                                                |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| `pivot-core/` (senza `export/`) | `src/core/`                                | Test inclusi, portati a jest.                                       |
| `options/`, `localization/`     | `src/options/`, `src/localization/`        | Invariati, salvo il test `dictionaries.test.ts` (vedi sotto).       |
| `hooks/`, `context/`, `utils/`  | `src/hooks/`, `src/context/`, `src/utils/` | Dipendono solo da React e dal core: già verificato nell'inventario. |

**Differenze volute** (elenco dello spike 0.1, registrate in `docs/pivot-upstream.md`):

1. **Esportazione Excel fuori dal core.** Non si copia `export/ExcelExporter.ts`; si toglie il suo `export` dal barrel del core e il metodo `PivotEngine.exportExcel` (che oggi lo importa). Il pezzo 5 la riporta come entry a parte, solo web.
2. **`locale` esplicito.** `CellFormatter.ts:376` e `DateFormatter.ts:109` leggono `navigator.language`: la lettura va tolta e il locale arriva sempre dall'engine (`setLocale` esiste già). Va verificato che **ogni** punto di chiamata lo passi, con un test che costruisce l'engine senza `navigator` e senza locale.
3. **Separatori senza `formatToParts`** (`CellFormatter.ts:388`: su iOS manca e oggi ricade in silenzio su `,` e `.`): ricavarli da `format(12345.6)`.
4. **Test da vitest a jest:** togliere `import … from 'vitest'`, `vi.` → `jest.`. Non portati: il test dell'esportatore (non copiato), `localization/dictionaries.test.ts` (usa `import.meta.glob` di Vite e legge i componenti, che non copiamo) e il test dell'hook `usePivotMatrix` solo se non gira senza `react-dom`; in quel caso si riscrive con `@testing-library/react-native`.
5. **Provenienza:** nota in testa a `docs/pivot-upstream.md` con versione 2.6.0 e un hash (SHA-256) dei file copiati, finché non c'è il commit vero.

**API pubblica del pacchetto** (`src/index.ts`): `PivotEngine`, i tipi di `report`/`slice`/`options`, gli hook (`usePivotMatrix`, `useEngineVersion`), il contesto e le funzioni pure già nel barrel del core (aggregazioni, albero, filtri, formattazione). Niente di più: ciò che serve alla griglia si aggiunge nel pezzo 2.

## Come si verifica

- `npm test -w @its/glowup-pivot`: i test del core in jest, più i nuovi (engine senza `navigator`; separatori senza `formatToParts`, simulando la sua assenza).
- `npm run lint`, `npm run type-check`, `npm run build` e `validate-package` per `pivot`.
- Nessuna prova nativa in questo pezzo.

## Lasciato a chi costruisce

Il nome esatto dei file di test portati, l'ordine dei commit, il formato dell'hash di provenienza e dove mettere il test sul locale. Scelte mie da controllare: il metodo `exportExcel` si toglie dal motore invece di tenerlo con un'esportazione iniettata; `usePivotMatrix` si copia anche se il suo test va riscritto.

## Rischi

- **Intl su Hermes:** già misurato nello spike; il test dei separatori deve simulare l'assenza di `formatToParts`, non assumerla.
- **Copia e originale divergono:** si governa con `docs/pivot-upstream.md`; nessun lavoro di sincronizzazione automatica.
- **Provenienza incompleta** (niente commit): l'hash dei file permette di riconoscere la stessa versione, non di ritrovare la cronologia.
