# @its/glowup-charts

Charts for Expo apps, built on `@its/glowup-ui` and `react-native-svg`, with **no third-party dependency**: scales and shapes are
d3 source copied into the package (`docs/charts-upstream.md`). Not published yet (`"private": true`).

Plan and decisions: `docs/charts-package-plan.md`. A live demo is the `/charts` page of the playground.

## State

- **`BarChart`: grouped or stacked bars, vertical or horizontal, a target line, a tooltip on tap or hover, `onSelect`, loading and empty states.** Checked
  in unit tests and in Chrome; not yet on a phone or in the CI's native check.
- **`LineChart` and `AreaChart`: one or more lines over categories in order, straight or smooth, a gap where a value is missing, a dot per
  point, a guide and a tooltip on tap or hover, a target line.** Same checks as the bars.
- **`DonutChart`, `PieChart`, `StackedBar` and `Sparkline`**: parts of a whole, and a trend with no axes. A gauge is a `DonutChart` with a
  `total`. Same checks as the bars.
- **`ChartLegend`, the `legend` prop and `Chart`**: a key under the chart whose items switch a series (or a part) off, and one entry
  point that picks the component by `type`.
- **Dense mode** for thousands of points: from 400 bars (200 points for lines) a chart draws one path per series and one touch layer instead of
  a node per bar; `dense` forces it on or off. Measured on the web, see the plan (step 7). Past about one point (or one bar) per two pixels
  the points that share a column are folded into their mean, drawn over a faint strip from their lowest to their highest (grouped bars: a
  faint peak); the tooltip still reads the exact point.
- Still to do: the check on the iOS and Android simulators (step 8 of the plan).

## Use

```tsx
import { BarChart } from "@its/glowup-charts";

<BarChart
  data={[
    { label: "Jan", answered: 120, missed: 30 },
    { label: "Feb", answered: 98, missed: 41 },
  ]}
  series={[
    { key: "answered", label: "Answered" },
    { key: "missed", label: "Missed" },
  ]}
  stacked
  target={150}
  locale="it-IT"
/>;
```

| Prop                      | Meaning                                                                                                                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                    | One object per category: `label` and a number per series key (a missing value draws no bar).                                                                                                                                                                                                                        |
| `series`                  | `{ key, label?, color? }` per series.                                                                                                                                                                                                                                                                               |
| `height`                  | Height in pixels, default 240. The width is the box the chart sits in.                                                                                                                                                                                                                                              |
| `stacked`                 | Pile the series up instead of side by side.                                                                                                                                                                                                                                                                         |
| `horizontal`              | One row per category, bars running left to right; long labels are cut with an ellipsis.                                                                                                                                                                                                                             |
| `dense`                   | One path per series and one touch layer instead of a node per bar. Default: on from 400 bars. A band behind the active category replaces the dimming of the other bars. With more bars than about one per two pixels, they are folded into columns (mean, with a faint peak up to the highest; stacked: mean only). |
| `target`                  | A dashed reference line, labelled with its value.                                                                                                                                                                                                                                                                   |
| `colors`                  | One colour per series; a series' own `color` wins. Default: roles of the theme.                                                                                                                                                                                                                                     |
| `title`                   | Starts the text a screen reader gets for the chart.                                                                                                                                                                                                                                                                 |
| `locale`, `numberFormat`  | BCP 47 tag (default `en-US`) and `Intl.NumberFormat` options for every number shown.                                                                                                                                                                                                                                |
| `formatValue`             | Replaces the number formatting altogether.                                                                                                                                                                                                                                                                          |
| `loading`, `emptyLabel`   | A skeleton while loading; the text shown when there is no data.                                                                                                                                                                                                                                                     |
| `onSelect(index \| null)` | A category was tapped, or the same one again.                                                                                                                                                                                                                                                                       |

## Peers

`@its/glowup-ui`, `react`, `react-native` and `react-native-svg`.

## Limits, on purpose

- **Colours are provisional.** The library has no chart palette yet, so series take the theme's `primary`, `tertiary`, `secondary`
  and their containers in turn. Pass `colors` to choose.
- **A screen reader gets one text for the whole chart** (`title`, then each series' values, or its lowest, highest and last when
  there are more than 12 categories). To read exact values and pick a category or part by screen reader (or by eye), pass `table`: the data as a table under the chart, each row one element labelled with the whole row ("Jan, North 10, South 20") and a button that selects that category.
- **No animation** and no zoom or pan.
- The category axis shows every nth label when they do not fit side by side; the width of a label is estimated, not measured.

## Lines and areas

```tsx
import { AreaChart, LineChart } from "@its/glowup-charts";

<LineChart data={data} series={series} curve="monotone" target={150} />
<AreaChart data={data} series={series} />
```

Same `data`, `series`, `colors`, `locale`, `formatValue`, `loading`, `onSelect` and `title` as `BarChart`, plus:

| Prop       | Meaning                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `curve`    | `"linear"` (default), `"monotone"`, `"natural"` or `"step"`.                                                                                                                                                              |
| `area`     | Fill under each line (`AreaChart` is `LineChart` with it set).                                                                                                                                                            |
| `zero`     | Keep 0 on the value axis, default true; a line in a narrow band reads better with `zero={false}`.                                                                                                                         |
| `showDots` | A dot on every point; default up to 24 categories (beyond that only the active one has a dot).                                                                                                                            |
| `dense`    | One touch layer instead of a Pressable per category. Default: on from 200 categories. With more points than about one per two pixels, the line runs through the mean of each column over a faint lowest-to-highest strip. |
| `target`   | A dashed reference line at this value.                                                                                                                                                                                    |

The x axis is the order of the points, evenly spaced, with one `label` per point: it is not a time scale (the CRM's own line charts
work this way). A missing value leaves a gap in the line. Areas of several series overlap, they do not pile up.

## Parts of a whole

```tsx
import { DonutChart, PieChart, Sparkline, StackedBar } from "@its/glowup-charts";

const outcomes = [
  { id: "answered", label: "Answered", value: 120 },
  { id: "missed", label: "Missed", value: 30 },
];

<DonutChart data={outcomes} centerValue="150" centerLabel="calls" />
<PieChart data={outcomes} showPercent />
<StackedBar data={outcomes} />
<DonutChart data={[{ id: "done", value: 72 }]} total={100} centerValue="72%" /> {/* a gauge */}
<Sparkline values={[3, 5, 4, 8, 6]} area />
```

`DonutChart`, `PieChart` and `StackedBar` take `data: { id, value, label?, color? }[]` and the `colors`, number, `title`, `loading` and
`emptyLabel` props of the other charts. `onSelect` gets the **id** of the part, or `null`.

| Prop                         | Meaning                                                                                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `total`                      | The whole the parts are shares of. More than their sum leaves the rest empty: 30 of 100 fills 30% of the ring.                                                                                                                                                      |
| `centerValue`, `centerLabel` | The text in the hole of a donut. While a part is active it shows that part's value and label instead. `centerValue` may be a function of the sum of the parts still shown, for a total that follows the legend. A pie has no hole: its active slice gets a tooltip. |
| `thickness`                  | Width of the ring in pixels (donut).                                                                                                                                                                                                                                |
| `showPercent`                | Each share written on its slice, where the slice is wide enough.                                                                                                                                                                                                    |
| `height`                     | In pixels; the ring is as big as fits. A stacked bar is 32 by default.                                                                                                                                                                                              |

A tap or a pointer over a slice makes it active; a tap on the hole does nothing. Zero and negative values are not drawn. A donut with a `total`
and no part with a value is a gauge at zero: it keeps its ring and its centre.

`Sparkline` takes `values`, `height` (32), `color`, `area`, `curve`, `lastDot` and `accessibilityLabel`. It has no axes and no tooltip: it shows
the shape of a series.

There is no separate gauge component: the library's `CircularProgress` has no centre text and no share, and a donut with a `total` does what a
gauge needs. Colour it by threshold in the app (`colors`, or a part's `color`).

## Legend and `Chart`

```tsx
import { Chart, ChartLegend } from "@its/glowup-charts";

<BarChart data={data} series={series} legend />        {/* the chart keeps its own legend */}
<Chart type="area" data={data} series={series} legend />  {/* the chart that fits, by type */}
<ChartLegend items={[{ key: "a", label: "North", color: "#6750a4" }]} />  {/* a key on its own */}
```

`legend` puts a key under any chart. Tapping an item switches that series (or part) off: its marks go, the value axis is redrawn for the
rest and the other series **keep their colours**. With everything off the chart shows its `emptyLabel` and the legend stays, so a series can
be brought back. To a screen reader each item is a checkbox, checked while the series is shown.

`table` puts the data under any chart as a table (`ChartTable`, also exported on its own: `header`, `rows`, `activeRow`, `onRowPress`, `rowColors`, `limit`). A category chart has a column per series still shown, a donut or stacked bar has "Value" and "Share" and a dot in the part's colour. A row presses like a tap on the chart (`onSelect`) and the active category's row is highlighted. A table past 50 rows ends with how many it left out. Not shown while loading or with no data.

`ChartLegend` on its own takes `items` (`{ key, label, color }`), `hidden` (keys switched off) and `onToggle`; without `onToggle` it is only a
key.

`Chart` takes `type` (`"bar"`, `"line"`, `"area"`, `"donut"`, `"pie"` or `"stacked"`) and then the props of that component, so
`<Chart type="bar" … />` is a `BarChart`. Use the component itself when the type never changes: it is the smaller import.
