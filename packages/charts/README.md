# @its/glowup-charts

Charts for Expo apps, built on `@its/glowup-ui` and `react-native-svg`, with **no third-party dependency**: scales and shapes are
d3 source copied into the package (`docs/charts-upstream.md`). Not published yet (`"private": true`).

Plan and decisions: `docs/charts-package-plan.md`. A live demo is the `/charts` page of the playground.

## State

- **`BarChart`: grouped or stacked bars, vertical or horizontal, a target line, a tooltip on tap or hover, `onSelect`, loading and empty states.** Checked
  in unit tests; not yet on a phone or in the CI's native check.
- The rest of the first wave (`LineChart`, `AreaChart`, `DonutChart`, `StackedBar`, `Sparkline`, `ChartLegend`, `Chart`) is not
  written: see the steps in the plan.

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

| Prop                      | Meaning                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `data`                    | One object per category: `label` and a number per series key (a missing value draws no bar). |
| `series`                  | `{ key, label?, color? }` per series.                                                        |
| `height`                  | Height in pixels, default 240. The width is the box the chart sits in.                       |
| `stacked`                 | Pile the series up instead of side by side.                                                  |
| `horizontal`              | One row per category, bars running left to right; long labels are cut with an ellipsis.      |
| `target`                  | A dashed reference line, labelled with its value.                                            |
| `colors`                  | One colour per series; a series' own `color` wins. Default: roles of the theme.              |
| `title`                   | Starts the text a screen reader gets for the chart.                                          |
| `locale`, `numberFormat`  | BCP 47 tag (default `en-US`) and `Intl.NumberFormat` options for every number shown.         |
| `formatValue`             | Replaces the number formatting altogether.                                                   |
| `loading`, `emptyLabel`   | A skeleton while loading; the text shown when there is no data.                              |
| `onSelect(index \| null)` | A category was tapped, or the same one again.                                                |

## Peers

`@its/glowup-ui`, `react`, `react-native` and `react-native-svg`.

## Limits, on purpose

- **Colours are provisional.** The library has no chart palette yet, so series take the theme's `primary`, `tertiary`, `secondary`
  and their containers in turn. Pass `colors` to choose.
- **A screen reader gets one text for the whole chart** (`title`, then each series' values, or its lowest, highest and last when
  there are more than 12 categories). Picking a category by screen reader is not possible yet; the plan has a table mode for it.
- **No animation** and no zoom or pan.
- The category axis shows every nth label when they do not fit side by side; the width of a label is estimated, not measured.
