# Piano di `@its/glowup-pdf`: il visualizzatore PDF, senza librerie di terzi

Riguarda la Fase 6 di `docs/solaris-native.md`. **Sostituisce la decisione D9** di quel piano (che prevedeva `pdfjs-dist`,
`react-native-pdf` e `react-native-blob-util`): vedi §2. Esito dello spike su cui poggiava D9: `docs/spike-0.3-pdf.md`.
A chi lavora a questo pacchetto: leggere anche `packages/pdf/CLAUDE.md`.

Stato: **piano, nessun codice scritto** (esiste solo l'impalcatura vuota di `packages/pdf`, commit `b9e2ad3`). Aggiornato il
2026-10-19 con i requisiti funzionali (§1) e la decisione sulla ricerca su Android (§5).

---

## 1. Obiettivo, requisiti e vincolo

Mostrare un PDF **dentro l'app** (non in un'altra app) su web, iOS e Android, con il file che può stare dietro un login, **come lo
si vedrebbe su un sito web**. Requisiti funzionali, uguali su tutte le piattaforme dove il sistema lo permette:

| Funzione                                                      | Web                             | iOS                       | Android                                                     |
| ------------------------------------------------------------- | ------------------------------- | ------------------------- | ----------------------------------------------------------- |
| Numero di pagine, pagina x di y, vai a pagina                 | sì (visualizzatore del browser) | sì                        | sì                                                          |
| Scorrere le pagine                                            | sì                              | sì                        | sì                                                          |
| Zoom                                                          | sì                              | sì                        | sì                                                          |
| **Cercare parole**, con numero di risultati e avanti/indietro | sì (browser)                    | sì (PDFKit)               | **sì, su ogni versione supportata (§5)**                    |
| **Stampa**                                                    | sì (browser)                    | sì (`expo-print`)         | sì (`expo-print`)                                           |
| **Download / salvataggio**                                    | sì (browser)                    | sì (menu "Salva su File") | sì (cartella Download; da verificare l'interfaccia di Expo) |

**Vincolo deciso il 2026-10-19: nessuna libreria di terzi come dipendenza.** Sono ammessi:

- il codice nostro, in questa repo;
- **React Native ed Expo** (la base di ogni app che usa la libreria): `expo-modules-core` per il modulo nativo, `expo-file-system`
  per scaricare il file con le intestazioni, `expo-print` per stampare, `expo-sharing` per il salvataggio su iOS;
- **le funzioni dei sistemi operativi**: PDFKit (Apple), `PdfRenderer` (Android), il visualizzatore integrato del browser;
- **codice open source con licenza permissiva copiato nella repo e diventato nostro**, con licenza e nome dell'autore conservati
  (vedi §10): si può usare "ciò che è utilizzabile" per non partire da zero.

Non sono ammessi come dipendenza `pdfjs-dist`, `react-native-pdf`, `react-native-blob-util`, `react-native-webview` e simili, né file
compilati di altri. Il perché: una libreria di volontari che sparisce lascia l'app senza PDF, e un motore PDF compilato (Pdfium)
è un binario di altri che dovremmo tenere aggiornato a mano: legge file arrivati da fuori, le sue correzioni di sicurezza contano.
Nota: `react-native-pdf`, in ogni caso, non ha ricerca né stampa, quindi non avrebbe coperto i requisiti.

## 2. Cosa cambia rispetto al piano precedente (D9)

|                          | D9 (spike 0.3)                           | Ora                                                                        |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| Web                      | `pdfjs-dist`                             | visualizzatore integrato del browser (`iframe`/`object` su un URL `blob:`) |
| iOS                      | `react-native-pdf` (usa PDFKit)          | **modulo nostro**, usa PDFKit                                              |
| Android                  | `react-native-pdf` (usa Pdfium di terzi) | **modulo nostro**, usa `PdfRenderer`                                       |
| Download con chiave      | `react-native-blob-util`                 | `expo-file-system`                                                         |
| Dipendenze del pacchetto | 3 librerie di terzi                      | nessuna (solo Expo)                                                        |

Da fare a fine lavoro: riscrivere D9 e la Fase 6 in `docs/solaris-native.md`. `docs/spike-0.3-pdf.md` resta come storia (ciò che
ha provato rimane vero: i file si scaricano con le intestazioni e poi si aprono).

**Limiti che restano** (da scrivere nel README):

- **Web sui telefoni.** Il visualizzatore del browser funziona bene su computer, con ricerca, stampa e download. Su iPhone
  (Safari) mostra solo la prima pagina; su Android (Chrome) non apre il PDF dentro la pagina. Per questo il componente web
  mostra sempre un pulsante "Apri" che lo apre in una scheda; per i telefoni c'è l'app nativa.
- **Ricerca:** sui PDF che sono scansioni, cioè immagini senza testo, non trova niente (non c'è riconoscimento dei caratteri).
  Su Android usa due vie per coprire tutte le versioni, vedi §5.
- **Selezione del testo e collegamenti nel PDF:** non nella prima versione. Su iPhone si può aggiungere con PDFKit, su Android
  dove il sistema lo offre (§5).
- **Niente PDF con password** nella prima versione (errore chiaro).
- **Zoom con i pulsanti** nella prima versione. Lo zoom con due dita richiede di leggere i tocchi multipli a mano
  (`PanResponder`, senza `react-native-gesture-handler`): si fa dopo.

## 3. Architettura

La parte che decide cosa si vede è una sola, in JavaScript, e vale per iOS e Android.

```
PdfViewer  (src/PdfViewer.tsx, uguale su iOS e Android)
 ├─ barra: pagina x di y e "vai a", zoom + / − / adatta, ricerca (campo, n risultati, avanti/indietro), stampa, salva
 ├─ stati: caricamento, errore (con "Riprova"), vuoto
 ├─ elenco di pagine (FlatList: solo quelle visibili vengono disegnate), ognuna con i suoi risultati di ricerca evidenziati
 └─ PdfNative (interfaccia nostra) ── capabilities() -> { search: boolean }
                                      open(path) -> { pages: [{ width, height }] }
                                      renderPage(path, index, width) -> uri di un'immagine
                                      search(path, query) -> [{ page, rects: [{ x, y, w, h }] }]   (rettangoli normalizzati 0..1)
                                      close(path)

Nativo, un modulo Expo nostro  (packages/pdf/ios, packages/pdf/android)
 ├─ iOS:     PDFKit      (PDFDocument, PDFPage, findString)
 └─ Android: PdfRenderer (android.graphics.pdf), searchText dove esiste (§5)

Web  (src/PdfViewer.web.tsx)
 └─ <iframe src="blob:..."> + pulsante "Apri in una scheda"; ricerca, stampa e download sono quelli del browser
```

**Come arriva il file** (`resolveSource`, JavaScript condiviso):

| `source`            | Nativo                                                                 | Web                                                         |
| ------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| `{ uri, headers? }` | `expo-file-system` scarica in un file nella cache, con le intestazioni | `fetch` con le intestazioni, poi un `Blob` e un URL `blob:` |
| `{ base64 }`        | decodifica e scrive un file nella cache                                | `Blob` dai byte                                             |
| `{ bytes }`         | scrive i byte in un file nella cache                                   | `Blob` dai byte                                             |

Il file temporaneo si cancella quando il componente si smonta. Sul web l'URL `blob:` si libera con `URL.revokeObjectURL`.

**Evidenziare i risultati:** il modulo nativo restituisce i rettangoli in coordinate normalizzate (0..1) della pagina; il
componente li disegna sopra l'immagine della pagina con una `View` semitrasparente. Così l'evidenziazione è codice JavaScript
unico, e il modulo nativo non deve disegnare niente di più.

**Stampa e salvataggio:** niente codice nativo nostro. `expo-print` (`printAsync({ uri })`) per la stampa; `expo-sharing` per il
menu "Salva su File" di iOS; su Android il salvataggio nella cartella Download con `expo-file-system` (**interfaccia da verificare**
sul sorgente della versione 57).

**Interfaccia `PdfNative`** e adattatore: come in `packages/device`, il componente parla solo con l'interfaccia, mai direttamente
con il modulo nativo. L'implementazione Expo è quella di default; `@its/glowup-pdf/testing` offre una versione in memoria per i test.

## 4. Interfaccia pubblica, prima versione

```ts
type PdfSource =
  | { uri: string; headers?: Record<string, string> }
  | { base64: string }
  | { bytes: Uint8Array };

type PdfViewerProps = {
  source: PdfSource;
  fileName?: string; // per il salvataggio e il titolo della stampa
  initialPage?: number; // da 1, default 1
  onLoad?: (info: { pages: number }) => void;
  onError?: (error: PdfError) => void;
  onPageChange?: (page: number, pages: number) => void;
  toolbar?: boolean; // default true
  labels?: Partial<PdfLabels>; // testi: pagina, zoom, cerca, risultati, stampa, salva, apri, riprova, errori (D6)
  style?: StyleProp<ViewStyle>;
};

type PdfError = Error & {
  code: "network" | "format" | "password" | "unsupported" | "native-missing";
};
```

La ricerca e le azioni si possono nascondere: sul nativo il pulsante di ricerca compare solo se `capabilities().search` è vero.
Fuori dalla prima versione, perché nessuna schermata lo chiede (D4): `page` e `zoom` controllati dall'esterno, `usePdfDocument()`,
`blob` come sorgente (l'app lo trasforma in `bytes`).

## 5. La ricerca di parole su Android

**Il problema.** `PdfRenderer` disegna le pagine ma, nelle versioni vecchie, non sa leggerne il testo. iOS no: PDFKit cerca da
solo (`PDFDocument.findString`).

**Cosa dice la documentazione di Android** (ricerca web del 2026-10-19, da riverificare sul codice):

- **Android 15 (API 35)** ha aggiunto a `PdfRenderer.Page` le funzioni `searchText` (restituisce i rettangoli dei risultati) e
  `selectContent` (selezione del testo).
- Per **Android 11–14 (API 30–34)** esiste la classe `PdfRendererPreV`, che porta le stesse funzioni. Non risulta confermato che
  includa anche `searchText` e non solo la selezione, e dipende dall'estensione del sistema (SDK extension 13), che non è su tutti
  i telefoni. **Da verificare sulla pagina di riferimento di `PdfRendererPreV` prima di contarci.**
- La libreria Jetpack `androidx.pdf` di Google è ancora in beta (1.0.0-beta01, agosto 2026): è una libreria, non rientra nel
  vincolo, e non la usiamo.

**Compatibilità.** Il minimo è **Android 7.0 (API 24)**, fissato da React Native 0.86 / Expo 57: sotto, l'app non gira comunque.
`PdfRenderer` esiste da Android 5, quindi il disegno delle pagine è coperto ovunque. Le versioni di Android degli utenti non sono
note. Stime mondiali (StatCounter, luglio 2026, dal traffico web): Android 15–16 circa 43%, 11–14 circa 46%, 10 o più vecchi circa
11%.

**Decisione (2026-10-19): si parte con la sola ricerca del sistema; la via di riserva si fa solo se serve.**

1. **Via del sistema (da costruire):** `searchText` su Android 15+, e `PdfRendererPreV` dove c'è. Zero codice di terzi, veloce, e si
   aggiorna con Android. Dove `capabilities().search` è falso (Android 7–10, ed 11–14 senza l'estensione di sistema o se
   `PdfRendererPreV` non ha la ricerca), **il pulsante di ricerca non compare** e il resto del visualizzatore funziona normalmente.
2. **Via di riserva (condizionale, passo 7):** estrazione del testo nostra, a partire da codice esistente. Si fa solo se i telefoni
   degli utenti del CRM risultano non coperti. Il candidato è **PdfBox-Android** (porta di Apache PDFBox, licenza **Apache 2.0**,
   Java puro, ha `PDFTextStripper` che restituisce testo e posizioni): se ne copia nella repo **solo la parte che legge il testo**
   (struttura del file, flussi compressi, font e codifiche, `PDFTextStripper`), con le intestazioni di licenza e un file `NOTICE`, e
   la si adatta. Non è una dipendenza ma codice nostro, e la manutenzione è nostra. Rischi: la porta è basata su PDFBox 1.8, non
   risulta attivamente mantenuta, è lenta e usa molta memoria con PDF grandi, e i PDF con font senza tabella di conversione
   danno testo incomprensibile. Da misurare su PDF reali del CRM.
3. Non si considerano: OpenPDF (si concentra sulla creazione, licenza MPL/LGPL), PDF Oxide (ha codice nativo), MuPDF (AGPL).

**PDF che sono scansioni** (immagini senza testo): nessuna ricerca li trova, né quella del sistema né una nostra, perché non c'è un
riconoscimento dei caratteri. Da scrivere nel README.

**Come si prova.** La CI nativa gira su due emulatori Android, 14 (API 34) e 15 (API 35): su Android 14 si legge se il telefono ha
l'estensione SDK 13 (senza, la ricerca resta spenta e la riga dice "PENDING" con la versione), su Android 15 si prova la ricerca
di `PdfRenderer` stessa. Il minimo supportato (Android 7) non è in CI.

## 6. Il modulo nativo

Un modulo Expo (`expo-modules-core`, che c'è già in ogni app Expo), chiamato `GlowupPdf`, con **quattro funzioni**.

| Funzione                         | Cosa fa                                                                     | iOS (PDFKit)                                       | Android (`PdfRenderer`)                                                  |
| -------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| `capabilities()`                 | dice cosa sa fare questo telefono                                           | `search: true`                                     | `search` vero se esiste la ricerca del sistema                           |
| `open(path)`                     | apre il file, restituisce pagine e dimensioni                               | `PDFDocument(url:)`, `page.bounds(for: .mediaBox)` | `PdfRenderer(ParcelFileDescriptor)`, `openPage(i)` per le dimensioni     |
| `renderPage(path, index, width)` | disegna la pagina e restituisce l'indirizzo di un file immagine nella cache | `UIGraphicsImageRenderer`, fondo bianco            | `Bitmap` ARGB_8888, **fondo bianco**, `page.render(...)`, salvata in PNG |
| `search(path, query)`            | cerca e restituisce i rettangoli per pagina, normalizzati                   | `findString` + `PDFSelection.bounds(for:)`         | `page.searchText(query)`                                                 |
| `close(path)`                    | libera il documento e le immagini di quel file                              | rilascia il `PDFDocument`                          | `renderer.close()` e chiude il descrittore                               |

Punti da rispettare:

- **Android apre una sola pagina alla volta** (`PdfRenderer`): i disegni si mettono in coda, uno dopo l'altro.
- **Tetto alla larghezza** richiesta: un PDF molto largo o uno zoom alto non devono riempire la memoria. Valore da misurare in CI.
- **Il fondo è bianco** su tutte e due: senza questo le pagine di `PdfRenderer` risultano nere.
- **Coordinate dei risultati:** PDFKit usa l'origine in basso a sinistra, Android in alto a sinistra: il modulo normalizza e rovescia
  l'asse y in modo che JavaScript riceva sempre la stessa cosa (da coprire con un test sul sistema di coordinate).
- **PDF con password:** errore `password`, il componente mostra il messaggio.
- **Errori sempre catturati nel modulo** e restituiti con un codice. Un'eccezione nativa non gestita chiude l'app.
- **Il modulo manca** (app senza build di sviluppo, o pacchetto non elencato nelle dipendenze dell'app): `require` pigro dentro un
  `try`, errore `native-missing` con un testo che dice cosa fare, non un crash all'avvio (insidia dello spike 0.3).
- **Memoria:** `FlatList` con poche pagine visibili e `windowSize` piccolo; le immagini stanno in file nella cache.

File da creare: `expo-module.config.json`, `ios/GlowupPdf.podspec`, `ios/GlowupPdfModule.swift`, `android/build.gradle`,
`android/src/main/java/.../GlowupPdfModule.kt`. **Da verificare sul sorgente di `expo-modules-core` della versione 57 prima di
scriverli** (nomi esatti di `Module`, `AsyncFunction`, configurazione di autolinking), non a memoria.

## 7. Come si installa in un'app

- L'app elenca `@its/glowup-pdf` tra le **sue** dipendenze: l'autolinking nativo legge il `package.json` dell'app (insidia dello
  spike 0.3).
- Serve una **build di sviluppo**, non Expo Go: c'è codice nativo.
- Peer del pacchetto: `@its/glowup-ui`, `expo`, `react`, `react-native`; `expo-file-system`, `expo-print`, `expo-sharing` richiesti
  solo sul nativo (peer opzionali: chi esce solo come sito non li installa).

## 8. Passi di lavoro

Ogni passo si chiude con `type-check`, `lint`, `test` e `build` del pacchetto verdi e un commit (nessun push da parte di Claude).

| #   | Passo                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Verifica                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | **Pulizia:** nel `package.json` del pacchetto tenere `expo`, `expo-file-system`, `expo-print`, `expo-sharing`, `react`, `react-dom`; rigenerare il lockfile                                                                                                                                                                                                                                                                                                                       | `npm install` pulito                                                                                                                              |
| 1   | **Parte comune (fatto 2026-10-19):** tipi, `resolveSource`, `PdfNative` + adattatore in memoria (`/testing`), `PdfViewer` (barra, stati, elenco di pagine, zoom a pulsanti, ricerca con evidenziazione, vai a pagina), stampa e salvataggio                                                                                                                                                                                                                                       | test jest su ios, android e web: stati, cambio pagina, zoom, ricerca (risultati e avanti/indietro), errore con "Riprova", pulizia allo smontaggio |
| 2   | **Web (fatto 2026-10-19):** `PdfViewer.web.tsx` (`iframe` su `blob:`, "Apri"), pagina di prova `/pdf` nel playground con un PDF d'esempio, voce nel catalogo                                                                                                                                                                                                                                                                                                                      | prova in Chrome (computer e finestra stretta); PDF dietro un login finto per provare le intestazioni                                              |
| 3   | **iOS (scritto 2026-10-19, da provare in CI):** modulo Swift con PDFKit (`open`, `renderPage`, `search`, `close`, `capabilities`)                                                                                                                                                                                                                                                                                                                                                 | solo CI (`native.yml`)                                                                                                                            |
| 4   | **Android, disegno (scritto 2026-10-19, da provare in CI):** modulo Kotlin con `PdfRenderer` (`open`, `renderPage`, `close`)                                                                                                                                                                                                                                                                                                                                                      | solo CI                                                                                                                                           |
| 5   | **Verifica nativa in CI (scritta 2026-10-19, nessun run ancora):** estendere `/native-check` con un PDF d'esempio di 3 pagine con parole note (quello dello spike, commit `3076ad8`): scrive pagine, dimensione dell'immagine disegnata, **risultati della ricerca di una parola nota**, più screenshot                                                                                                                                                                           | righe `NATIVECHECK` e screenshot negli artefatti del run                                                                                          |
| 6   | **Android, ricerca di sistema (**fatto e provato su emulatore Android 15 il 2026-10-20**: pagine 1 e 2, primo risultato a y=0,13 dall'alto; su Android 14 senza estensione 13 la ricerca è spenta come previsto; il percorso `PdfRendererPreV` non è ancora stato provato) (§5, via 1):** `PdfRenderer.Page.searchText` (API 35) e `PdfRendererPreV.Page.searchText` (API 30–34 con estensione SDK 13), `capabilities()`; verificato sulla documentazione ufficiale il 2026-10-20 | CI: la riga della ricerca; **verificare prima sulla documentazione** che `PdfRendererPreV` abbia `searchText`                                     |
| 7   | **Solo se serve — Android, ricerca di riserva (§5, via 2):** copiare da PdfBox-Android la sola lettura del testo in `packages/pdf/android`, con licenza e `NOTICE`, adattarla, trasformare le posizioni in rettangoli normalizzati; `docs/pdf-upstream.md`; opzione per forzarla                                                                                                                                                                                                  | CI su più versioni di Android (almeno 14 e una vecchia); misure su PDF reali del CRM: tempo e memoria                                             |
| 8   | **Documentazione:** README con limiti (§2), `docs/solaris-native.md` (D9 e Fase 6), `docs/work-split.md`, `packages/pdf/CLAUDE.md`, changeset quando il pacchetto esce da `private`                                                                                                                                                                                                                                                                                               |                                                                                                                                                   |

**Cosa non si può verificare dal portatile di lavoro:** iOS e Android a runtime (niente amministratore, rete aziendale). Ogni
tentativo dei passi 3–6 costa un push e circa 15 minuti di CI. Quindi il modulo nativo va scritto **piccolo e con errori
espliciti**, e il passo 5 serve per leggere cosa è successo davvero. Non si dichiara "funziona su iOS/Android" finché un run di CI
non lo mostra. **Non verificati in ogni caso:** telefono vero, PDF molto grandi, tempi, memoria, stampa e salvataggio a schermo.

## 9. Rischi

| Rischio                                                                                                               | Mitigazione                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Il codice nativo non compila o chiude l'app, e lo vediamo solo in CI                                                  | Moduli minimi; ogni funzione cattura gli errori; passo 5 prima di costruire altro sopra                                                 |
| `PdfRenderer` su Android: pagine nere, memoria, una pagina alla volta                                                 | Fondo bianco, coda dei disegni, tetto alla larghezza, `close` sempre chiamato                                                           |
| La ricerca di sistema non c'è sui telefoni vecchi e le versioni degli utenti non sono note                            | Il pulsante di ricerca compare solo dove c'è (`capabilities`); via di riserva (§5, passo 7) se i telefoni degli utenti non sono coperti |
| Versioni vecchie di Android (7–9) mai provate                                                                         | Emulatore vecchio in CI almeno una volta (disegno delle pagine); il minimo è Android 7.0 (API 24), fissato da React Native              |
| Le coordinate dei risultati risultano sfalsate (assi diversi, rotazione della pagina, pagine con riquadro ritagliato) | Normalizzazione nel modulo, test sul sistema di coordinate, prova nel passo 5 con una parola in un punto noto                           |
| Le pagine come immagini sono meno nitide con lo zoom alto                                                             | Con lo zoom si ridisegna la pagina a una larghezza maggiore (fino al tetto), non si ingrandisce l'immagine                              |
| Cambio di versione di Expo o React Native rompe il modulo                                                             | La CI nativa gira a ogni aggiornamento di SDK (D16); il modulo usa solo le API pubbliche di `expo-modules-core`                         |
| Il web sui telefoni mostra poco                                                                                       | Dichiarato (§2); pulsante "Apri"; i telefoni usano l'app nativa                                                                         |
| Codice copiato da PdfBox-Android (via di riserva) pesante, lento, non mantenuto                                       | Copiare solo la parte del testo; misurare su PDF reali; se non basta, tornare a decidere (§5)                                           |

## 10. Provenienza e licenze

- **`react-native-pdf`** (MIT, https://github.com/wonday/react-native-pdf): usata solo come riferimento di lettura per PDFKit.
  Se se ne copia del codice, intestazione di licenza MIT e nome dell'autore nel file, e una riga in `docs/pdf-upstream.md`.
- **PdfBox-Android** (Apache 2.0, https://github.com/TomRoush/PdfBox-Android): è la via di riserva della ricerca (§5, passo 7). Copiare la
  licenza, un file `NOTICE`, le intestazioni dei file, e registrare in `docs/pdf-upstream.md` versione e commit di origine e le
  differenze volute (come fa `docs/pivot-upstream.md` per il pivot).
- Niente codice copiato da progetti con licenza AGPL o LGPL.

## 11. Domande aperte

1. **Quali versioni di Android usano gli utenti del CRM?** Decide se serve la via di riserva della ricerca (passo 7) e quali emulatori provare per primi.
2. **`PdfRendererPreV` ha `searchText`?** **Sì** (documentazione ufficiale, 2026-10-20: "Added in API level 35, also in S Extensions 13", restituisce `List<PageMatchBounds>`). Provata su Android 15: **non distingue maiuscole e minuscole** (trova "Hello" cercando "hello") e i rettangoli partono dall'alto a sinistra. Resta da provare su un emulatore con l'estensione 13 (il `PdfRendererPreV`).
3. **Formato delle immagini:** per ora JPEG al 90% su iOS e Android (più leggero e veloce da scrivere); se sul testo piccolo si vede la perdita, passare a PNG (una riga per piattaforma). Da giudicare sugli screenshot.
4. **Tetto alla larghezza e numero di pagine in memoria:** valori da misurare, non fissati.
5. **Zoom con due dita e selezione del testo:** dopo la prima versione, solo se una schermata li chiede.
6. **Interfaccia di salvataggio su Android** (`expo-file-system` nella 57): da verificare.
7. **Dove sta il PDF d'esempio** per il playground e per `/native-check` (una copia sola, nel playground).
