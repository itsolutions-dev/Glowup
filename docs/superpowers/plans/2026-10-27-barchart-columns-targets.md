# BarChart: colonne, obiettivo per categoria, esito, attenuate — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** il `BarChart` di `@its/glowup-charts` disegna più colonne per categoria (impilate o sovrapposte), un obiettivo
per categoria, un'icona di esito per categoria e categorie attenuate, abbastanza da rifare i quattro grafici a barre del CRM.

**Architecture:** la disposizione delle colonne è una funzione pura nuova in `src/core/columns.ts`; `BarChart.tsx` la usa al
posto del sì/no `stacked` per posizioni, larghezze e modalità densa. Obiettivo, esito e attenuazione sono prop per categoria
di `BarChart`; i loro testi entrano in tabella e riassunto attraverso un parametro nuovo di `useChartBase`.

**Tech Stack:** React Native, `react-native-svg`, d3 copiato in `src/vendor`, jest-expo + Testing Library (asincrona).

**Spec:** `docs/superpowers/specs/2026-10-27-barchart-columns-targets-design.md`

## Global Constraints

- Nessuna dipendenza nuova; il pacchetto importa solo `@its/glowup-ui` per nome (`Icon` viene da lì).
- Colori solo da token del tema o passati dall'app; nessun colore scritto a mano.
- Nessuna rottura: `stacked`, `target` numerico, `dense` e i test esistenti restano come sono.
- `await` su ogni `fireEvent` (Testing Library asincrona).
- Nessun nome di campo del CRM nel codice della libreria (solo nell'esempio del playground).
- **Commit:** uno solo, alla fine (Task 6), su `dev`. Nessun `push` (regola di Alice). Pacchetto privato: nessun changeset.

## Review Focus

1. **Serie spenta dalla legenda dentro una colonna sovrapposta o impilata:** la colonna resta, con le serie rimaste; se le
   spegni tutte, la colonna sparisce e le altre si allargano. Test in Task 2.
2. **Valori negativi in una colonna `"overlap"`:** la barra scende sotto lo zero come nelle barre affiancate di oggi. Test in
   Task 1.
3. **`target` funzione che restituisce `null` per alcune categorie:** niente lineetta lì, nessun «Target» nel tooltip di quella
   categoria, «–» in tabella. Test in Task 3.
4. **Grafico orizzontale con `marker`:** l'icona sta a destra della colonna più lunga, non sopra. Test in Task 4.
5. **`marker`/`dimmed`/obiettivo per categoria con `dense`:** ignorati senza errori. Test in Task 4 e Task 5.

---

### Task 1: disposizione delle colonne (funzione pura)

**Files:**

- Create: `packages/charts/src/core/columns.ts`
- Test: `packages/charts/src/__tests__/core.test.ts` (nuovo `describe("columns")`)

**Interfaces:**

- Produces:
  - `export type ColumnMode = "stack" | "overlap";`
  - `export type BarColumn = { id: string; keys: string[]; mode: ColumnMode };`
  - `barColumns(series: { key: string; column?: string }[], opts: { stacked?: boolean; columnMode?: ColumnMode | Record<string, ColumnMode> }): BarColumn[]`
    — `series` sono solo quelle accese, in ordine. Con `stacked`: una colonna `{ id: "all", keys: tutte, mode: "stack" }`.
    Altrimenti una colonna per `column` distinta (o per `key` se la serie non ne ha), nell'ordine di prima comparsa. `mode`:
    `columnMode` se stringa, `columnMode[id]` se oggetto, altrimenti `"stack"`. Nessuna serie → `[]`.
  - `columnSpans(data: ChartDatum[], column: BarColumn): ([number, number] | null)[][]` — `[k][i]` = estremi `[low, high]`
    della serie `column.keys[k]` nella categoria `i`. `"stack"`: da `stackValues(data, column.keys)`. `"overlap"`:
    `[min(x,0), max(x,0)]`, `null` se il valore manca.
  - `columnTotal(datum: ChartDatum, column: BarColumn): number` — `"stack"`: somma dei valori numerici; `"overlap"`: il
    massimo; nessun valore → 0.

- [ ] **Step 1: test che falliscono**

```ts
describe("columns", () => {
  const s = [
    { key: "a", column: "x" },
    { key: "b", column: "x" },
    { key: "c" },
  ];
  it("groups series by column in order, a series without one alone", () => {
    expect(barColumns(s, {})).toEqual([
      { id: "x", keys: ["a", "b"], mode: "stack" },
      { id: "c", keys: ["c"], mode: "stack" },
    ]);
  });
  it("stacked puts every series in one stacked column", () => {
    expect(barColumns(s, { stacked: true })).toEqual([
      { id: "all", keys: ["a", "b", "c"], mode: "stack" },
    ]);
  });
  it("takes the mode for all columns or per column", () => {
    expect(barColumns(s, { columnMode: "overlap" }).map((c) => c.mode)).toEqual(
      ["overlap", "overlap"],
    );
    expect(
      barColumns(s, { columnMode: { x: "overlap" } }).map((c) => c.mode),
    ).toEqual(["overlap", "stack"]);
  });
  it("overlap spans start at zero, negatives go below, missing is null", () => {
    const col = { id: "x", keys: ["a", "b"], mode: "overlap" as const };
    expect(
      columnSpans(
        [
          { label: "p", a: 3, b: -2 },
          { label: "q", a: null, b: 1 },
        ],
        col,
      ),
    ).toEqual([
      [[0, 3], null],
      [
        [-2, 0],
        [0, 1],
      ],
    ]);
  });
  it("stack spans pile up", () => {
    const col = { id: "x", keys: ["a", "b"], mode: "stack" as const };
    expect(columnSpans([{ label: "p", a: 3, b: 2 }], col)).toEqual([
      [[0, 3]],
      [[3, 5]],
    ]);
  });
  it("a column total is the sum when stacked and the highest when overlapping", () => {
    const d = { label: "p", a: 3, b: 2 };
    expect(columnTotal(d, { id: "x", keys: ["a", "b"], mode: "stack" })).toBe(
      5,
    );
    expect(columnTotal(d, { id: "x", keys: ["a", "b"], mode: "overlap" })).toBe(
      3,
    );
    expect(
      columnTotal({ label: "p" }, { id: "x", keys: ["a"], mode: "stack" }),
    ).toBe(0);
  });
});
```

- [ ] **Step 2:** `npm test -w @its/glowup-charts -- core` → FAIL (`barColumns` non esiste).
- [ ] **Step 3:** implementare `src/core/columns.ts` (usa `stackValues` di `core/paths.ts` e `num` di
      `hooks/useChartBase.ts`, o una sua copia locale se crea un ciclo di import).
- [ ] **Step 4:** `npm test -w @its/glowup-charts -- core` → PASS.

---

### Task 2: `BarChart` disegna per colonne (`column`, `columnMode`)

**Files:**

- Modify: `packages/charts/src/core/types.ts` (`ChartSeries.column?: string`, JSDoc: «letto solo da `BarChart`»)
- Modify: `packages/charts/src/BarChart.tsx` (prop, `barRect`, `spanOf`, ramo denso, tooltip)
- Test: `packages/charts/src/__tests__/barchart.test.tsx`, `packages/charts/src/__tests__/dense.test.tsx`

**Interfaces:**

- Consumes: `barColumns`, `columnSpans` (Task 1).
- Produces: `BarChartProps.columnMode?: ColumnMode | Record<string, ColumnMode>`; `ColumnMode` esportato da `src/index.ts`.
  Gli `testID` delle barre restano `${testID}-bar-${i}-${key}`.

Approccio: `const columns = barColumns(serie accese con la loro column, { stacked, columnMode })`; la larghezza di una barra è
`band.width / columns.length`, lo scostamento quello dell'indice della colonna; `inset` è 0 con una sola colonna. `spanOf(i, s)`
legge da `columnSpans` della colonna della serie. In `"overlap"` le barre di una categoria si disegnano dalla più lunga alla
più corta (la più corta davanti). Nel ramo denso le colonne sostituiscono `stacked ? 1 : keys.length`: ogni colonna
`"stack"` usa `stackValues(folded.mean, colonna.keys)`, il «peak» si disegna solo per le colonne `"overlap"` con una serie
o per serie sole (come oggi per le barre affiancate). Il dominio dei valori prende gli estremi di tutte le `columnSpans`.

- [ ] **Step 1: test che falliscono** (in `barchart.test.tsx`, dati locali al test)

```ts
const crm = [
  { label: "Capriate", rec: 1, uniq: 1, ok: 1, ko: 0 },
  { label: "Corsico", rec: 3, uniq: 2, ok: 0, ko: 2 },
];
const crmSeries = [
  { key: "rec", column: "in" },
  { key: "uniq", column: "in" },
  { key: "ok", column: "out" },
  { key: "ko", column: "out" },
];

it("puts the series of a column in one bar and the columns side by side", async () => {
  await show({ data: crm, series: crmSeries });
  const rec = screen.getByTestId("c-bar-1-rec").props;
  const ko = screen.getByTestId("c-bar-1-ko").props;
  expect(Number(ko.x)).toBeGreaterThan(Number(rec.x) + Number(rec.width) - 1);
  expect(Number(ko.width)).toBeCloseTo(Number(rec.width));
});

it("overlapping series start at zero and the shorter one is drawn in front", async () => {
  await show({ data: crm, series: crmSeries, columnMode: { in: "overlap" } });
  const rec = screen.getByTestId("c-bar-1-rec").props; // 3
  const uniq = screen.getByTestId("c-bar-1-uniq").props; // 2
  expect(Number(rec.y) + Number(rec.height)).toBeCloseTo(
    Number(uniq.y) + Number(uniq.height),
  );
  expect(Number(uniq.height)).toBeCloseTo((2 / 3) * Number(rec.height));
  const order = bars().map((b) => b.props.testID);
  expect(order.indexOf("c-bar-1-uniq")).toBeGreaterThan(
    order.indexOf("c-bar-1-rec"),
  );
});

it("stacks a column by default", async () => {
  await show({ data: crm, series: crmSeries });
  const rec = screen.getByTestId("c-bar-1-rec").props;
  const uniq = screen.getByTestId("c-bar-1-uniq").props;
  expect(Number(uniq.y) + Number(uniq.height)).toBeCloseTo(Number(rec.y));
});

it("a column whose series are all switched off goes and the others widen", async () => {
  await show({ data: crm, series: crmSeries, legend: true });
  const before = Number(screen.getByTestId("c-bar-1-rec").props.width);
  await fireEvent.press(screen.getByTestId("c-legend-ok"));
  expect(screen.getByTestId("c-bar-1-ko")).toBeTruthy(); // the column stays with one series
  await fireEvent.press(screen.getByTestId("c-legend-ko"));
  expect(Number(screen.getByTestId("c-bar-1-rec").props.width)).toBeGreaterThan(
    before,
  );
});

it("lays columns out one below the other in a horizontal chart", async () => {
  await show({
    data: crm,
    series: crmSeries,
    horizontal: true,
    columnMode: "overlap",
  });
  const rec = screen.getByTestId("c-bar-1-rec").props;
  const ko = screen.getByTestId("c-bar-1-ko").props;
  expect(Number(ko.y)).toBeGreaterThan(Number(rec.y));
  expect(Number(ko.x)).toBe(Number(rec.x));
});
```

In `dense.test.tsx`: un test che con `dense` e due colonne (`columnMode: { in: "overlap" }`) disegna un path per serie
(`c-dense-rec`, `c-dense-ko`) senza errori. Controllare il nome reale del `testID` della legenda in `legend.test.tsx`
prima di usare `c-legend-ok`.

- [ ] **Step 2:** `npm test -w @its/glowup-charts -- barchart dense` → i test nuovi FAIL, quelli esistenti PASS.
- [ ] **Step 3:** implementare come descritto sopra.
- [ ] **Step 4:** `npm test -w @its/glowup-charts` → tutto PASS (compresi `stacked`, orizzontale, denso già esistenti).
- [ ] **Step 5:** `npm run type-check` → pulito.

---

### Task 3: obiettivo per categoria (`target` funzione) e testi in tabella e riassunto

**Files:**

- Modify: `packages/charts/src/hooks/useChartBase.ts`, `packages/charts/src/core/summary.ts`, `packages/charts/src/BarChart.tsx`
- Test: `packages/charts/src/__tests__/barchart.test.tsx`, `packages/charts/src/__tests__/core.test.ts`

**Interfaces:**

- Produces:
  - `BarChartProps.target?: number | ((datum: ChartDatum, index: number) => number | null | undefined)`.
  - `useChartBase(props, notes?: ChartNote[])` con `export type ChartNote = { name: string; texts: string[] }` (un testo per
    categoria, `""` = niente). Ogni nota è una colonna in più della tabella (intestazione `name`) e, fino a `maxListed`
    categorie, una frase in più nel riassunto: `${name}: ${label} ${testo}, …` saltando i testi vuoti.
  - `describeChart({ …, notes?: ChartNote[] })`.

Disegno: per ogni categoria con valore, una `Line` tratteggiata come quella di oggi (`tertiary`, `1.5`, `"6 4"`) che attraversa
la banda della categoria (`crossStart(i)` → `crossStart(i) + band.width`), `testID` `${testID}-target-${i}`. Il dominio
include gli obiettivi. Tooltip: riga `{ color: tertiary, name: "Target", value: format(t) }` in fondo, solo se c'è. Nota
`{ name: "Target", texts: format(t) o "–" }` passata a `useChartBase`. Con `dense` la funzione è ignorata.

- [ ] **Step 1: test che falliscono**

```ts
it("draws a short target line per category, inside its band, and none where it is null", async () => {
  await show({ target: (d) => (d.label === "Feb" ? null : 25) });
  expect(screen.getByTestId("c-target-0")).toBeTruthy();
  expect(screen.queryByTestId("c-target-1")).toBeNull();
  const line = screen.getByTestId("c-target-0").props;
  const bar = screen.getByTestId("c-bar-0-a").props;
  expect(Number(line.x1)).toBeLessThanOrEqual(Number(bar.x));
});

it("the value axis reaches a category target above every bar", async () => {
  await show({
    data: [{ label: "x", a: 5 }],
    series: [{ key: "a" }],
    target: () => 50,
  });
  expect(JSON.stringify(screen.toJSON())).toContain(`"content":"50"`);
});

it("shows the category target in the tooltip, the table and the screen reader text", async () => {
  await show({
    target: (d) => (d.label === "Feb" ? null : 25),
    table: true,
    title: "Sales",
  });
  await fireEvent.press(screen.getByTestId("c-category-0"));
  expect(screen.getByText("Target: 25")).toBeTruthy();
  await fireEvent.press(screen.getByTestId("c-category-1"));
  expect(screen.queryByText(/^Target:/)).toBeNull();
  expect(screen.getByTestId("c").props.accessibilityLabel).toContain(
    "Target: Jan 25, Mar 25.",
  );
  expect(
    screen.getByLabelText("Feb, North 30, South 0, Target –"),
  ).toBeTruthy();
});
```

In `core.test.ts`: `describeChart` con `notes: [{ name: "Status", texts: ["ok", "", "no"] }]` aggiunge
`"Status: Jan ok, Mar no."`, e con più di `maxListed` categorie non la aggiunge; `chartTable` resta invariato.

- [ ] **Step 2:** `npm test -w @its/glowup-charts -- barchart core` → i nuovi FAIL.
- [ ] **Step 3:** implementare.
- [ ] **Step 4:** `npm test -w @its/glowup-charts` → PASS; `npm run type-check` pulito.

---

### Task 4: icona di esito (`marker`)

**Files:**

- Modify: `packages/charts/src/BarChart.tsx`
- Test: `packages/charts/src/__tests__/barchart.test.tsx`

**Interfaces:**

- Consumes: `columnTotal` (Task 1), `ChartNote` (Task 3), la funzione `target` risolta per categoria (Task 3).
- Produces:
  - `export type BarMarker = { icon: string; color: string; label: string };` esportato da `src/index.ts`.
  - `BarChartProps.marker?: (datum: ChartDatum, info: { index: number; totals: Record<string, number>; target: number | null }) => BarMarker | null;`
    `totals` ha una voce per colonna accesa (`BarColumn.id`). Con `stacked` l'unica chiave è `"all"`.

Disegno: costante `MARKER = 20` (dp). Quando c'è `marker` il dominio dei valori si allunga perché l'icona stia nel grafico:
il margine superiore del plot (verticale) o destro (orizzontale) cresce di `MARKER + 4`. Ogni icona è
`<Icon source={m.icon} size={MARKER} color={m.color} />` in una `View` assoluta con `pointerEvents="none"`, `testID`
`${testID}-marker-${i}`, centrata sulla categoria e a 4 dp oltre la fine più lontana tra la colonna più lunga e l'obiettivo.
Tooltip: riga `{ color: m.color, value: m.label }` (senza nome). Nota `{ name: "Status", texts: label o "" }`. Con `dense` il
marker è ignorato.

- [ ] **Step 1: test che falliscono**

```ts
const verdict = (
  d: ChartDatum,
  info: { totals: Record<string, number>; target: number | null },
) =>
  info.target == null
    ? null
    : info.totals.out >= info.target
      ? { icon: "check", color: "green", label: "Met" }
      : { icon: "close", color: "red", label: "Missed" };

it("asks the app for a marker per category with the column totals and the target", async () => {
  const marker = jest.fn(verdict);
  await show({
    data: crm,
    series: crmSeries,
    columnMode: { in: "overlap" },
    target: (d) => d.uniq as number,
    marker,
  });
  expect(marker).toHaveBeenCalledWith(crm[1], {
    index: 1,
    totals: { in: 3, out: 2 },
    target: 2,
  });
  expect(screen.getByTestId("c-marker-0")).toBeTruthy();
});

it("puts the marker past the longest column of its category", async () => {
  await show({
    data: crm,
    series: crmSeries,
    marker: () => ({ icon: "check", color: "green", label: "Met" }),
  });
  const top = (screen.getByTestId("c-marker-1").props.style as { top: number })
    .top;
  const uniq = screen.getByTestId("c-bar-1-uniq").props; // stacked on rec: rec+uniq = 5, the longest
  expect(top + 20).toBeLessThanOrEqual(Number(uniq.y) - 3);
});

it("puts the marker to the right in a horizontal chart", async () => {
  await show({
    data: crm,
    series: crmSeries,
    horizontal: true,
    marker: () => ({ icon: "check", color: "green", label: "Met" }),
  });
  const left = (
    screen.getByTestId("c-marker-1").props.style as { left: number }
  ).left;
  const rec = screen.getByTestId("c-bar-1-uniq").props;
  expect(left).toBeGreaterThanOrEqual(Number(rec.x) + Number(rec.width) + 3);
});

it("reads the marker in the tooltip, the table and the screen reader text, and none for null", async () => {
  await show({
    data: crm,
    series: crmSeries,
    table: true,
    marker: (d) =>
      d.label === "Corsico"
        ? { icon: "close", color: "red", label: "Missed" }
        : null,
  });
  expect(screen.queryByTestId("c-marker-0")).toBeNull();
  expect(screen.getByTestId("c").props.accessibilityLabel).toContain(
    "Status: Corsico Missed.",
  );
  await fireEvent.press(screen.getByTestId("c-category-1"));
  expect(screen.getByText("Missed")).toBeTruthy();
});

it("ignores marker, category targets and dimmed when dense", async () => {
  await show({
    dense: true,
    marker: () => ({ icon: "check", color: "green", label: "Met" }),
    target: () => 5,
    dimmed: () => true,
  });
  expect(screen.queryByTestId("c-marker-0")).toBeNull();
  expect(screen.queryByTestId("c-target-0")).toBeNull();
});
```

(L'ultimo test usa `dimmed`, che arriva nel Task 5: scriverlo qui con `marker` e `target`, e aggiungere `dimmed` nel Task 5.)
Dopo averli scritti, controllare che gli stili usati nei test (`style.top`/`style.left`) siano quelli che il codice produce;
se lo stile è un array, leggere con `StyleSheet.flatten`.

- [ ] **Step 2:** `npm test -w @its/glowup-charts -- barchart` → i nuovi FAIL.
- [ ] **Step 3:** implementare.
- [ ] **Step 4:** `npm test -w @its/glowup-charts` → PASS; `npm run type-check` pulito.

---

### Task 5: categorie attenuate (`dimmed`)

**Files:**

- Modify: `packages/charts/src/BarChart.tsx`
- Test: `packages/charts/src/__tests__/barchart.test.tsx`

**Interfaces:**

- Produces: `BarChartProps.dimmed?: (datum: ChartDatum, index: number) => boolean`.

Disegno: le barre di una categoria attenuata hanno `fill={theme.colors.outline}` e opacità `0.5` (moltiplicata per quella di
categoria non attiva, `0.45`, quando un'altra è attiva). Tooltip, tabella e riassunto restano quelli veri. Ignorato in `dense`.

- [ ] **Step 1: test che falliscono**

```ts
it("draws a dimmed category in the outline colour, faded, and keeps its values", async () => {
  await show({ dimmed: (_, i) => i === 1 });
  const feb = screen.getByTestId("c-bar-1-a").props;
  const jan = screen.getByTestId("c-bar-0-a").props;
  expect(feb.fill).not.toBe(jan.fill);
  expect(Number(feb.opacity)).toBeLessThan(1);
  await fireEvent.press(screen.getByTestId("c-category-1"));
  expect(screen.getByText("North: 30")).toBeTruthy();
});
```

E `dimmed: () => true` aggiunto al test «ignores … when dense» del Task 4, con l'attesa che i path densi abbiano il
colore della serie. Il colore atteso di `fill` si legge da `defaultTheme` della libreria se il confronto con
`jan.fill` non basta.

- [ ] **Step 2:** `npm test -w @its/glowup-charts -- barchart` → FAIL.
- [ ] **Step 3:** implementare.
- [ ] **Step 4:** `npm test -w @its/glowup-charts` → PASS; `npm run type-check` pulito.

---

### Task 6: documentazione, esempio nel playground, verifica e commit

**Files:**

- Modify: `packages/charts/README.md` (tabella delle prop: `series` con `column`, `columnMode`, `target` numero o funzione,
  `marker`, `dimmed`; riga sulla modalità densa: «ignora `marker`, `dimmed` e l'obiettivo per categoria»)
- Modify: `apps/playground/app/charts.tsx` (nuova `Section` «Columns, targets and outcomes» con un `BarChart` che riproduce lo
  screenshot del CRM: 10 filiali, colonna `received` sovrapposta e colonna `handled` impilata, `marker` con ✓ verde, ✓
  `tertiary` e ✗ `error`, una filiale `dimmed`; colori dal tema, nessun nome di campo del CRM)
- Test: `apps/playground/__tests__/charts-page.test.tsx` (la sezione nuova disegna le barre e un marker)
- Modify: `docs/handoff/2026-10-27.md` (nuovo file: è il primo handoff di oggi)

- [ ] **Step 1:** test della pagina: `it("draws columns, targets and outcome marks", …)` che trova almeno una barra e un
      `…-marker-` con il `testID` della sezione. `npm test -w @its/glowup-playground -- charts-page` → FAIL.
- [ ] **Step 2:** scrivere la sezione e il README. `npm test -w @its/glowup-playground -- charts-page` → PASS.
- [ ] **Step 3:** `npm run type-check && npm run lint && npm test` → tutto verde (lint: 0 errori).
- [ ] **Step 4:** nel browser (`npx expo start --web` nel playground), pagina Charts a 1440 e 360 px: le due colonne per
      filiale, la sovrapposta con la barra più corta davanti, le icone sopra, la filiale attenuata, tooltip con «Target» e
      lo stato. Tema scuro. Annotare cosa si è visto nell'handoff.
- [ ] **Step 5:** scrivere `docs/handoff/2026-10-27.md` (cosa fatto, scelte, verificato web; iOS/Android non verificati).
- [ ] **Step 6: Commit** (uno solo, su `dev`, niente push)

```bash
git add packages/charts apps/playground/app/charts.tsx apps/playground/__tests__/charts-page.test.tsx \
  docs/superpowers/specs/2026-10-27-barchart-columns-targets-design.md \
  docs/superpowers/plans/2026-10-27-barchart-columns-targets.md docs/handoff/2026-10-27.md
git commit -m "feat(charts): bar columns that stack or overlap, a target and an outcome mark per category, dimmed categories"
```
