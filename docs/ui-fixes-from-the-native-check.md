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

**Verificato il 2026-10-20** (run su simulatore iOS e emulatori Android 14 e 15, non su telefoni veri): `Select` denso è 20 più basso (72 → 52) su iPhone e su Android; `Input` denso è 24 più basso (96 → 72) anche su iPhone, dove prima era 34.

## Difetti ancora aperti (non corretti)

### 1. `Input` e `SearchBar` su Android: la tastiera sparisce subito dopo il tocco

- **Cosa si vede.** Toccando il campo il log mostra `showSoftInput` e, **4 ms dopo, una richiesta di nascondere la tastiera fatta dall'app stessa** (`ImeTracker … onRequestHide at ORIGIN_CLIENT_HIDE_SOFT_INPUT`). Il campo non riceve i tasti.
- **Controllo.** Un `TextInput` di React Native messo nello stesso posto, con lo stesso `keyboardType="decimal-pad"`, riceve i tasti sia su Android 14 sia su Android 15. Quindi non è l'emulatore.
- **Ipotesi.** `getGlowStyles(theme, isFocused)` cambia lo stile del contenitore proprio al focus (bordo da 1 a 1,5 e, solo su Android, `elevation: 4`). Il cambio di stile al focus può ricostruire il contenitore mentre si apre la tastiera. La correzione provata è togliere l'`elevation`.
- **Esito del 2026-10-20, con una riserva.** Nell'ultimo run la tastiera a schermo dell'emulatore era spenta (i tasti arrivano come eventi di tastiera hardware). Così `Name` (`Input` di testo) e `Amount` (numerico) ricevono i tasti su Android 14 e 15, e la `SearchBar` del PDF su Android 14 (su Android 15 il passo della ricerca non ha trovato il campo a causa dello scorrimento dello script, non per il campo). **Non prova che il difetto sia risolto per un utente**: senza tastiera a schermo la richiesta di nasconderla non ha effetto, e il run non distingue l'effetto della correzione da quello della tastiera spenta. Resta da provare con la tastiera accesa, su un telefono vero o su un emulatore senza tastiera fisica.
- **Come verificare.** In `/native-check` ci sono quattro campi: `Amount` (`Input` numerico), `Plain field` (controllo), `Name` (`Input` di testo) e `Search the PDF` (`SearchBar`). Lo script `scripts/android-interact.mjs` li prova uno per uno e salva una foto per ciascuno (`android-typed.png`, `android-plain.png`, `android-name.png`, `android-search.png`).

### 2. `Collapse` su Android: i figli non compaiono dopo il tocco

- **Cosa si vede.** Un gruppo del drawer (`DrawerItem` con figli) toccato: la freccia cambia, ma il figlio ("Sales") non si vede e non compare nemmeno nello screenshot. Lo stesso gruppo con `defaultExpanded` ("Archive" → "Old") si vede. Quindi è l'**apertura animata** a non mostrare il contenuto.
- **Sospetto non verificato.** `Collapse.tsx` anima insieme l'altezza e l'opacità con lo stesso valore (`useNativeDriver: false`). Non ho trovato nel codice la causa.
- **Esito del 2026-10-20.** Confermato su Android 14 e 15 anche dopo le altre correzioni: "Sales" non compare dopo il tocco (7 passi su 8 passano su Android 14, resta solo questo).
- **Cosa serve.** Un dispositivo o emulatore su cui provare con le animazioni e l'altezza separate. Su iOS non è stato provato.

## Cosa chiedere a B

1. Prendere i commit `d6fbd58` (e il commit della cornice di focus) o risolvere i conflitti in `Input.tsx`, `Select.tsx` e `ThemeProvider.tsx` al merge.
2. Dopo il merge, rilanciare `native.yml`: le righe `select dense` e `input dense` devono dare Δ=20 e Δ=24 su iPhone e Android (lo fanno già in `dev`).
3. Se `Input` o `SearchBar` non ricevono ancora i tasti su Android, cercare la causa con l'elenco di bisezione qui sopra. Se serve, `Collapse` si studia con lo stesso dispositivo.

## Cosa non è stato fatto

- Nessuna di queste correzioni è stata provata su un telefono vero.
- Non ho toccato `Collapse`.
- Il PDF non aspetta nessuna di queste correzioni: funziona con `TextInput` di React Native per il numero di pagina. L'unico legame è la ricerca (`SearchBar`) su Android.
