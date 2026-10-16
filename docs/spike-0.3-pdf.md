# Spike 0.3 — PDF su web, iOS e Android

Fase 0 di `docs/solaris-native.md`. Domanda: **D9 regge? Si apre un PDF servito da un'API con bearer token e uno
passato come base64, su web, iOS e Android, con `pdfjs-dist` (web) e `react-native-pdf` + `react-native-blob-util`
(nativo)?**

**Stato: fatto.** Web verificato in locale (Chrome); iOS (simulatore) e Android (emulatore) verificati in CI su
GitHub, con RN 0.86.3 e Expo SDK 57. **Non verificato**: un telefono vero, https, gesti (scorrere, zoom), PDF grandi.

## Come è stato fatto

Una pagina di prova nel playground e un server locale (`server.mjs`) che consegna un PDF di 3 pagine **solo** con
l'header `Authorization: Bearer spike-token` (401 senza). Sul nativo la pagina provava quattro sorgenti:

| Caso     | Cosa fa                                                                                       |
| -------- | --------------------------------------------------------------------------------------------- |
| `base64` | `react-native-pdf` con un `data:application/pdf;base64,…`                                     |
| `auth`   | `react-native-pdf` con `source={{ uri, headers }}` (la libreria scarica da sola)              |
| `noauth` | lo stesso senza header: deve **fallire**                                                      |
| `file`   | `react-native-blob-util` scarica in un file con l'header, poi `react-native-pdf` apre il file |

Il codice di prova è stato tolto. Si recupera da git: commit `3076ad8` (pagina e server) e `616c45d` (workflow).

## Risultati

| Caso                                   | Web (`pdfjs-dist`)             | iOS                                                                 | Android                                                                                                              |
| -------------------------------------- | ------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| base64                                 | ok                             | **ok**, 3 pagine                                                    | **ok**, 3 pagine                                                                                                     |
| download con header (`blob-util`)      | ok (scarico i byte e li passo) | **ok**, http 200                                                    | **ok**, http 200                                                                                                     |
| apertura del file scaricato            | —                              | **ok**, 3 pagine                                                    | **ok**, 3 pagine (da logcat)                                                                                         |
| `source.headers` di `react-native-pdf` | —                              | **fallisce** (`DownloadFailed`, anche se il server ha risposto 200) | **fallisce** (`IllegalStateException: Use of own trust manager but none defined`; la richiesta non arriva al server) |
| senza token                            | 401                            | fallisce, come atteso                                               | fallisce, ma per l'errore sopra, non per il 401                                                                      |

Il server ha visto le richieste giuste: 200 con token, 401 senza.

## Cosa significa per D9

1. **`react-native-pdf` funziona** con React Native 0.86 e la nuova architettura, su iOS e Android, una volta
   compilato nella build (richiede development build, non Expo Go).
2. **L'autenticazione sul nativo si fa scaricando noi il file**: `react-native-blob-util` con `fileCache` e header,
   poi si passa il percorso locale al viewer. È la strada già prevista dal piano: ora è provata su entrambe le
   piattaforme.
3. **Non usare `source.headers` di `react-native-pdf`**: fallisce su iOS e su Android in modi diversi. L'API di
   `PdfViewer` accetta `headers`, ma sul nativo scarica prima e apre il file.
4. **Sul web** si scaricano i byte con `fetch` (header incluso) e si passano a `pdfjs-dist`. Il worker `.mjs` va servito con
   tipo JavaScript (GitHub Pages lo fa); il `<canvas>` va dimensionato esplicitamente.
5. L'alternativa WebView + pdf.js **non serve** per ora: resta in tasca se il viewer nativo desse problemi di gesti o
   di memoria nella Fase 6.

## Insidie trovate

- **L'autolinking nativo legge il `package.json` dell'app.** Le due librerie installate con `--no-save` non venivano
  compilate e l'app moriva all'avvio con "native module is not available". Nel pacchetto vero sono peer: chi le usa le
  deve avere tra le dipendenze della sua app.
- Una route che importa un modulo nativo mancante **fa cadere tutta l'app all'avvio** (expo-router carica le route
  all'inizio), non solo la pagina. `PdfViewer` deve importare i moduli nativi in modo che la loro assenza dia un
  errore leggibile.
- Android in CI: traffico http in chiaro solo con `usesCleartextTraffic` e host `10.0.2.2`; iOS accetta
  `http://localhost`. Per il PDF vero serve https.
- Il `logcat` va salvato **dopo** l'apertura della pagina, non prima.

## Da fare in Fase 6

`react-native-pdf` come peer opzionale e config plugin documentato; `PdfViewer` con la regola "su nativo
scarica, poi apri"; prova su un telefono vero per gesti, zoom e PDF grandi; test https.
