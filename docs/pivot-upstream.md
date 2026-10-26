# Provenienza del codice copiato in `@its/glowup-pivot`

Riguarda `packages/pivot/src/` (`core`, `options`, `localization`, `hooks`, `context`, `utils`). Progetto: `docs/superpowers/specs/2026-10-23-pivot-core-design.md`.
Regole di lavoro: `packages/pivot/CLAUDE.md`.

Il motore del pivot è il sorgente di **AuraPivot** (repo `itsolutions-dev/AuraPivot`), copiato nel pacchetto, non una dipendenza. Licenza **MIT**,
© 2026 IT Solutions S.r.l. La repo AuraPivot non si modifica mai.

## Origine

- **Versione:** AuraPivot **2.6.0**.
- **Dove:** `C:\Users\a.rossi\Documents\Dev\AuraPivot-master\AuraPivot-master`, copiata il 2026-10-23.
- **Commit:** non noto. Quella cartella è un'esportazione senza `.git`. Finché non c'è il commit vero, l'identità della copia è l'hash
  sotto. Se si ritrova la repo con la cronologia, scrivere qui il commit.
- **Hash dei sorgenti** (SHA-256 dell'elenco ordinato degli hash SHA-256 dei 39 file, calcolato **prima** di ogni modifica):

  `c8a85a018979714352e171026e381acd4de891ea00bd1fd6ae38c8af6041c990`

  Si rifà dalla cartella di AuraPivot con:
  `find pivot-core options localization hooks context utils -type f ! -path 'pivot-core/export/*' | sort | xargs sha256sum | sha256sum`.
  L'elenco comprende anche `localization/dictionaries.test.ts`, che non è stato copiato (vedi sotto).

## Cosa si è copiato

| In AuraPivot                                   | In `packages/pivot/src/`       | Note                                             |
| ---------------------------------------------- | ------------------------------ | ------------------------------------------------ |
| `pivot-core/` (senza `export/`)                | `core/`                        | Test compresi.                                   |
| `options/`                                     | `options/`                     | Test compreso.                                   |
| `localization/` (senza `dictionaries.test.ts`) | `localization/`                | `en.json`, `it.json`, `merge.ts`, `types.ts`.    |
| `hooks/`, `context/`, `utils/`                 | `hooks/`, `context/`, `utils/` | Test dell'hook compreso (riscritto, vedi sotto). |

**Non copiati:** `components/` (338 KB: MUI, `react-virtuoso`, DOM; l'interfaccia si riscrive), `AuraPivot.tsx`, `theme/`,
`pivot-core/export/` (esportazione Excel: tornerà nel pezzo 5, solo web), `localization/dictionaries.test.ts`.

## Differenze volute

Tutto il resto è identico all'originale, salvo lo stile (Prettier: doppi apici, virgola finale; nessun cambio di logica).

1. **Niente esportazione Excel nel core.** Non si copia `export/ExcelExporter.ts`; tolti da `core/PivotEngine.ts` l'import e il metodo
   `exportExcel`, da `core/index.ts` l'esportazione di `exportMatrixToExcel`. Motivo: usa `document`, `Blob` e `import("exceljs")`, che
   non devono arrivare nel bundle nativo. Tornerà come entry separata, solo web.
2. **Il locale si passa sempre, `navigator` non si legge.** `formatNumberWithFormat(value, section, locale = "en-US")` ha il terzo
   parametro (l'originale leggeva `navigator.language` per separatori e valuta «System»: su Hermes è sempre `en-US`, quindi un report
   in italiano usciva all'americana). `getSystemSeparators(locale)` e `getSystemCurrency(locale)` ricevono il locale.
   `DateFormatter.resolveLocale` ricade su `en-US` senza guardare `navigator`. Chi chiama passa il locale dell'engine (`PivotEngine.setLocale`). Le intestazioni delle dimensioni di tipo data passano ora `locale: this._locale` (l'originale non lo passava e ripiegava sul browser: `core/PivotEngine.ts`, test `PivotEngine.locale.test.ts`). **Restano al locale del runtime quando `setLocale` non è stato chiamato**, come nell'originale: `formatMeasureValue` (`aggregation/Aggregator.ts`) e gli ordinamenti (`slice/TreeBuilder.ts`, `slice/FilterEngine.ts`); il renderer deve sempre chiamare `setLocale` e passare `engine.getLocale()` a `formatNumberWithFormat`.
3. **Separatori senza `Intl.NumberFormat.formatToParts`** (manca su Hermes per iOS, dove l'originale ricadeva in silenzio su `,` e `.`):
   si ricavano da un campione formattato, `format(12345.6)` con `numberingSystem: "latn"`; il gruppo è il primo segno non cifra, il
   decimale l'ultimo. Se il campione ha un solo segno, il gruppo ripiega su `.` quando il decimale è `,` (l'originale ripiegava sempre su `,`).
4. **Test portati a jest.** `import … from 'vitest'` tolto, `vi.` → `jest.`. `hooks/usePivotMatrix.test.tsx` riscritto con
   `@testing-library/react-native` (`await renderHook`, `await act`) invece di `@testing-library/react` con happy-dom; il test del caricamento differito usa i timer finti di jest (con quelli veri falliva a intermittenza sotto carico).
   `intlCaching.test.ts`: il test dei separatori ora passa `"it-IT"` (leggeva `navigator.language`). Non portati:
   `localization/dictionaries.test.ts` (usa `import.meta.glob` di Vite e legge i componenti, che non copiamo) e
   `export/ExcelExporter.test.ts` (non copiato l'esportatore).
5. **Import:** `../pivot-core` → `../core`.
6. **Dizionari tipizzati.** `localization/dictionaries.ts` (nuovo) esporta `localizationEn` e `localizationIt` come
   `LocalizationDictionary`: tsc non emette i `.json`, e riesportarli da `index.ts` rompeva le dichiarazioni (`attw`).
7. **Tre file nostri:** `src/index.ts` (l'API pubblica del pacchetto), `src/__tests__/` (`exports`, `no-web-apis`) e
   `core/format/locale.test.ts`.

Una prova (`src/__tests__/no-web-apis.test.ts`) fallisce se `exceljs`, `document.` o `navigator` rientrano nel core.

## Come si aggiorna

A mano e di rado: prendere la versione nuova di AuraPivot in una cartella a parte, rifare la copia degli stessi file, riapplicare le
differenze sopra, far girare i test e aggiornare versione, commit e hash di questa pagina. Le differenze dal punto 2 in poi sono quelle
che si rompono in silenzio se si dimentica una riga: i test `locale.test.ts` e `no-web-apis.test.ts` le coprono.
