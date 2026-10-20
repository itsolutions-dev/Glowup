# Correzioni a `packages/ui` trovate dalla verifica nativa

Scritto il 2026-10-20 da A (Alice, con Claude) per B, che lavora su `packages/ui` su un altro ramo. Le correzioni sono già in `dev`, in commit **separati e solo in `packages/ui`**, così B le può prendere con un cherry-pick o risolvere i conflitti al merge. Le prove vengono da `/native-check` nel playground, eseguito da `native.yml` su simulatore iOS ed emulatori Android 14 e 15 (non su telefoni veri).

## Perché questo documento

Il visualizzatore PDF (`packages/pdf`) usa componenti della libreria. La verifica nativa del PDF ha portato a misurare anche quei componenti, e ha trovato difetti che non erano del PDF ma di `ui`. Per regola (`packages/ui/CLAUDE.md`, `docs/work-split.md`) non si aggirano dal PDF: si correggono in `ui`.

**Quali servono davvero al PDF.** Solo la ricerca (`SearchBar`) e la sua cornice di focus (`getGlowStyles`): se un campo di testo perde la tastiera, non si può cercare. Le altre correzioni non servono al PDF: il visualizzatore non usa `Select`, `Input` né `Collapse` (il numero di pagina è un `TextInput` di React Native). Sono qui perché le ha trovate la stessa verifica.

## Correzioni fatte

| Commit    | Dove                                                                                           | Difetto                                                                                                                                                                                           | Prova                                                                                                           | Servono al PDF?                |
| --------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `d6fbd58` | `Select.tsx`                                                                                   | `height: "100%"` sul campo: su iOS e Android diventava l'altezza di tutta la pagina (3200–4300) e `density` non cambiava nulla (Δ=0, atteso 20). Sul web era giusto.                              | Righe `select dense is 20 shorter` di ogni run: `FAIL (4204 -> 4204)` su iOS, `FAIL (4168 -> 4168)` su Android. | No                             |
| `d6fbd58` | `Input.tsx`                                                                                    | Un `Input` a riga singola riceveva su iOS gli 8 px di padding pensati per il testo su più righe: 66 invece di 56 (nella misura: 106 invece di 96, Δ=34 invece di 24). Android e web erano giusti. | Riga `input dense is 24 shorter` su iPhone: `FAIL (106 -> 72, Δ=34)`; su Android `PASS (96 -> 72)`.             | No                             |
| `39c9c97` | `providers/ThemeProvider.tsx` (`getGlowStyles`) e `.changeset/android-focus-ring-elevation.md` | Su Android la cornice di focus aggiungeva `elevation: 4` al contenitore al momento del focus. **È un'ipotesi, non una causa provata:** vedi sotto. Tolta solo su Android; web e iOS invariati.    | Vedi "Difetto aperto".                                                                                          | Sì, per la ricerca su Android. |

I due primi commit non sono stati verificati su un dispositivo dopo la correzione: il prossimo run di `native.yml` deve mostrare Δ=20 per `Select` e Δ=24 per `Input` su iOS.

## Difetti ancora aperti (non corretti)

### 1. `Input` e `SearchBar` su Android: la tastiera sparisce subito dopo il tocco

- **Cosa si vede.** Toccando il campo il log mostra `showSoftInput` e, **4 ms dopo, una richiesta di nascondere la tastiera fatta dall'app stessa** (`ImeTracker … onRequestHide at ORIGIN_CLIENT_HIDE_SOFT_INPUT`). Il campo non riceve i tasti.
- **Controllo.** Un `TextInput` di React Native messo nello stesso posto, con lo stesso `keyboardType="decimal-pad"`, riceve i tasti sia su Android 14 sia su Android 15. Quindi non è l'emulatore.
- **Ipotesi.** `getGlowStyles(theme, isFocused)` cambia lo stile del contenitore proprio al focus (bordo da 1 a 1,5 e, solo su Android, `elevation: 4`). Il cambio di stile al focus può ricostruire il contenitore mentre si apre la tastiera. La correzione provata è togliere l'`elevation`. **Non è verificata**: se il prossimo run dice ancora che `Name` e `Amount` non ricevono i tasti, l'ipotesi è sbagliata e la causa è altrove (da cercare per bisezione: stessa `TextInput` senza `numberOfLines`, senza `accessibilityValue`, con bordo fisso).
- **Come verificare.** In `/native-check` ci sono quattro campi: `Amount` (`Input` numerico), `Plain field` (controllo), `Name` (`Input` di testo) e `Search the PDF` (`SearchBar`). Lo script `scripts/android-interact.mjs` li prova uno per uno e salva una foto per ciascuno (`android-typed.png`, `android-plain.png`, `android-name.png`, `android-search.png`).

### 2. `Collapse` su Android: i figli non compaiono dopo il tocco

- **Cosa si vede.** Un gruppo del drawer (`DrawerItem` con figli) toccato: la freccia cambia, ma il figlio ("Sales") non si vede e non compare nemmeno nello screenshot. Lo stesso gruppo con `defaultExpanded` ("Archive" → "Old") si vede. Quindi è l'**apertura animata** a non mostrare il contenuto.
- **Sospetto non verificato.** `Collapse.tsx` anima insieme l'altezza e l'opacità con lo stesso valore (`useNativeDriver: false`). Non ho trovato nel codice la causa.
- **Cosa serve.** Un dispositivo o emulatore su cui provare con le animazioni e l'altezza separate. Su iOS non è stato provato.

## Cosa chiedere a B

1. Prendere i commit `d6fbd58` (e il commit della cornice di focus) o risolvere i conflitti in `Input.tsx`, `Select.tsx` e `ThemeProvider.tsx` al merge.
2. Dopo il merge, rilanciare `native.yml` e guardare le righe `select dense` e `input dense` e gli esiti dei quattro campi.
3. Se `Input` o `SearchBar` non ricevono ancora i tasti su Android, cercare la causa con l'elenco di bisezione qui sopra. Se serve, `Collapse` si studia con lo stesso dispositivo.

## Cosa non è stato fatto

- Nessuna di queste correzioni è stata provata su un telefono vero.
- Non ho toccato `Collapse`.
- Il PDF non aspetta nessuna di queste correzioni: funziona con `TextInput` di React Native per il numero di pagina. L'unico legame è la ricerca (`SearchBar`) su Android.
