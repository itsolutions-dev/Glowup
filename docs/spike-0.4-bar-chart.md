# Spike 0.4 — BarChart con d3-scale e react-native-svg

Fase 0 di `docs/solaris-native.md`. Domanda: **D7 regge? Un grafico su `react-native-svg` con `d3-scale`, larghezza
da `onLayout` e tooltip al tocco funziona su web, iOS e Android, e a che costo con 500 e 5.000 punti?**

**Stato: fatto per il web e per il bundling nativo. Non verificato su iOS e Android a runtime** (vedi
"Vincolo di ambiente" nel piano): niente tocco, niente tempi nativi.

## Come è stato fatto

Un `BarChart` di prova (barre raggruppate, 2 serie, assi e griglia da `scaleBand`/`scaleLinear`, tooltip al clic di
una barra) in `apps/playground/spikes/bar-chart/` e una pagina che lo renderizza con 12, 500 e 5.000 categorie.
`d3-scale` 4.0.2 e `d3-shape` 3.2.0 installati con `npm install --no-save` (nessuna modifica a manifest né a
lockfile). Il codice di prova è stato cancellato dopo la misura: la Fase 4 scrive quello vero.

## Esito

### Verificato

| Verifica                                                                                             | Risultato                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Metro risolve `d3-scale` (pacchetto solo ESM) sul web                                                | Sì: la pagina si disegna con assi, griglia e barre in tema                                                                                                                                    |
| Metro risolve `d3-scale` per **iOS e Android** e Hermes compila il bundle                            | Sì: `expo export --platform ios --platform android` termina senza errori e produce due bundle `.hbc` (4,7 MB e 5 MB) che contengono la pagina e `scaleBand`. **Compilazione, non esecuzione** |
| Larghezza da `onLayout`                                                                              | Funziona, con un'insidia (sotto)                                                                                                                                                              |
| Tooltip al clic di una barra (web)                                                                   | Funziona: un clic reale (eventi mouse via DevTools) sulla barra mostra "C5 · a: 85" con serie e valore                                                                                        |
| Tempo di aggiornamento su web (Chrome headless, rendering software, layout forzato, **senza paint**) | 500 categorie × 2 serie (1.000 rettangoli): **46–74 ms**. 5.000 categorie × 2 serie (10.000 rettangoli): **343–495 ms** (due misure ciascuno, in ordine alternato)                            |

### L'insidia della larghezza

Se la larghezza misurata con `onLayout` diventa la larghezza dell'`Svg` nel flusso, il contenitore non può più
restringersi: al primo tentativo il grafico usciva a destra dalla pagina. Va disegnato in posizione assoluta dentro
un contenitore che si dimensiona da solo (`StyleSheet.absoluteFill` sull'`Svg`). Con questa correzione la larghezza
del grafico segue gli antenati. Nota: a una finestra di 1200 px gli antenati del playground erano larghi 1104 px, più
dello spazio accanto alla barra laterale; non ho indagato se sia un comportamento della shell del sito.

### Cosa dice sul piano

- **D7 confermata per il web e per il bundling nativo**: `d3-scale` va bene senza Skia né visx. Resta da provare a
  runtime su iOS e Android.
- Per dati densi un `<Rect>` per barra non scala bene: a 10.000 elementi il web impiega circa mezzo secondo. Sul
  nativo ogni elemento SVG è un nodo nativo, quindi **mi aspetto di peggio, ma non l'ho misurato**. Proposta per
  la Fase 4, da verificare: una modalità densa con un solo `<Path>` per serie (con `d3-shape`, **non usato in questo
  spike**) sopra una soglia di punti.
- Il tooltip è provato solo con il clic del mouse. **Non provati**: tocco su dispositivo, hover su web, accessibilità
  per singola barra (il prototipo espone solo un riassunto testuale sul contenitore).
- **Non verificato**: `d3-scale` sotto jest (il pacchetto è solo ESM e `jest-expo` non lo trasforma di default:
  servirà `transformIgnorePatterns`, da sistemare nella Fase 4) e il costo del primo render con pochi punti.
