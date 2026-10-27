# BarChart: colonne, obiettivo per categoria, esito, categorie attenuate

Data: 2026-10-27. Pacchetto: `packages/charts` (privato, nessun changeset finché non è pubblicato).

## Perché

Il `BarChart` deve saper disegnare i quattro grafici a barre del CRM (`DBE-CRM-qa`, `Components/Charts/BarChart.jsx`,
visx) a partire dai suoi dati, restando generale: nessun nome o regola del CRM nella libreria. Il primo caso è
«Total calls received by branch» (`Pages/PivotReport/Inbound/Components/BranchCountersWidget.jsx`).

Cosa fa il CRM oggi, e manca a noi:

| Schermata del CRM | Cosa usa                                                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inbound           | due colonne per filiale: la prima **sovrapposta** (barre da zero, la più alta dietro), la seconda impilata; icona ✓/✗ sopra la filiale, decisa dalla schermata con campi del dato |
| Outbound          | colonne affiancate; **lineetta obiettivo per filiale** (`target` nel dato); ✓ se il totale della colonna ≥ obiettivo                                                              |
| Redemption        | una linea obiettivo su tutto il grafico (= il nostro `target`); filiali sotto il minimo **grigie** (`minimumReached`)                                                             |
| Appointments      | barre affiancate normali (già coperto)                                                                                                                                            |

## Obiettivi e non obiettivi

- **Sì:** più colonne per categoria, ciascuna impilata o sovrapposta; obiettivo per categoria; un esito (icona) per
  categoria deciso dall'app; categorie attenuate. Verticale e orizzontale. Nessuna rottura delle prop attuali.
- **No:** la forma dati a liste multiple del CRM (`dataToShow` a matrice); un render prop che restituisce SVG; scorrimento
  orizzontale (`minTickWidth` del CRM: altro lavoro, se servirà).
- **Anti-obiettivo:** regole del CRM in libreria (nomi di campi come `uniqueUnmanagedUnansweredNumbersCount`, soglie, colori
  scritti a mano).

## Approcci

- **A. Estendere `BarChart` (scelto da Alice).** Dati come oggi, un oggetto per categoria; prop nuove generali. Legenda,
  tabella, tooltip e testo per il lettore di schermo restano per serie.
- **B. Copiare l'API del CRM** (`dataToShow` a matrice, `keys`/`colors`/`stacked` per colonna, `renderTargetIcon`). Porting
  immediato, ma rompe la forma dati condivisa con `LineChart`, `DonutChart`, `Chart`, legenda e tabella, e lascia SVG e
  accessibilità all'app. Scartato.
- **Componente nuovo** (`ComboBarChart`): duplicherebbe quasi tutto `BarChart`. Scartato (estendere prima di creare).

## Il design

### Colonne

- `ChartSeries` riceve `column?: string` (letto solo da `BarChart`). Le serie con la stessa `column` formano una barra; le
  colonne si affiancano nella categoria, nell'ordine in cui compaiono in `series`. Una serie senza `column` è una colonna
  da sola (oggi: barre affiancate, invariato).
- `BarChart` riceve `columnMode?: "stack" | "overlap" | Record<string, "stack" | "overlap">`, predefinito `"stack"`.
  `"stack"`: le serie si impilano (`stackValues` sulle sole chiavi della colonna, quindi i negativi scendono come oggi).
  `"overlap"`: ogni serie parte da zero, disegnate dalla più lunga alla più corta, così la più corta resta davanti.
- `stacked` resta: vale «tutte le serie in una colonna, impilate» e vince su `column`.
- Una colonna con tutte le serie spente dalla legenda sparisce e le altre si allargano.

### Obiettivo per categoria

- `target?: number | ((datum: ChartDatum, index: number) => number | null | undefined)`. Il numero: linea su tutto il
  grafico, come oggi. La funzione: una lineetta tratteggiata larga quanto la categoria, al valore restituito; `null` o
  `undefined`, niente lineetta. Stesso colore della linea di oggi (`tertiary`). L'asse dei valori include gli obiettivi.
- Il tooltip aggiunge una riga «Target»; la tabella una colonna «Target» quando almeno una categoria ne ha uno.

### Esito sopra la categoria

- `marker?: (datum: ChartDatum, info: { index: number; totals: Record<string, number>; target: number | null }) =>
{ icon: string; color: string; label: string } | null`.
- `totals`: per ogni colonna (chiave = `column`, o la `key` della serie se non ne ha), la somma se impilata, il massimo se
  sovrapposta; contano solo le serie accese. `target`: quello della categoria.
- Disegno: `Icon` di `@its/glowup-ui` (nomi MaterialCommunityIcons), in una vista sopra l'SVG, oltre la fine della colonna
  più lunga della categoria (o dell'obiettivo, se più lontano). Quando c'è `marker` il grafico tiene spazio per l'icona
  oltre l'ultimo valore.
- `label` è obbligatorio: va nel tooltip, nella tabella (colonna senza intestazione visibile) e nel testo per il lettore di
  schermo. Il colore lo passa l'app (tipicamente un ruolo del tema).

### Categorie attenuate

- `dimmed?: (datum: ChartDatum, index: number) => boolean`. Le barre di quella categoria sono disegnate col colore
  `outline` del tema a opacità ridotta; tooltip, tabella e valori restano quelli veri.

### Modalità densa (`dense`)

- Le colonne valgono anche lì (una striscia per colonna nella categoria). Obiettivo per categoria, `marker` e `dimmed` sono
  **ignorati** in modalità densa (migliaia di categorie; scritto nel JSDoc). Il numero singolo di `target` continua a valere.

## Come lo usa il CRM (esempio, non codice della libreria)

```tsx
<BarChart
  data={branches.map((b) => ({ label: b.name, ...b }))}
  series={[
    { key: "unansweredCallCount", column: "received", color: c.green },
    { key: "uniqueUnansweredNumbersCount", column: "received", color: c.blue },
    { key: "uniqueCallAgainAnsweredNumbersCount", column: "handled" },
    // …
  ]}
  columnMode={{ received: "overlap", handled: "stack" }}
  marker={(d) =>
    !d.uniqueUnansweredNumbersCount
      ? null
      : d.uniqueUnmanagedUnansweredNumbersCount
        ? { icon: "close", color: theme.colors.error, label: "Not handled" }
        : d.uniqueRecalledNumbersNotAnsweredCount
          ? { icon: "check", color: warning, label: "Recalled, no answer" }
          : { icon: "check", color: success, label: "Handled" }
  }
/>
```

## Verifica

- Test jest in `packages/charts/src/__tests__/barchart.test.tsx`, scritti prima: posizione e larghezza delle colonne,
  impilata contro sovrapposta (ordine e altezze), obiettivo per categoria (lineetta e asse), `marker` (icona, posizione,
  `totals`, testo nel riassunto), `dimmed`, `stacked` invariato, legenda che spegne una colonna, orizzontale.
- README del pacchetto (prop documentate a mano) e un esempio nella pagina dei grafici del playground che riproduce lo
  screenshot del CRM. Nel browser a 1440 e 360 px; sul telefono con la CI (riga in `native-check` se serve).

## Lasciato a chi costruisce

- Dimensione dell'icona (proposta: 20 dp) e distanza dalla barra.
- Ordine di disegno lineetta/icona/barre, spaziatura tra colonne della stessa categoria (oggi 1 px di margine per barra).
