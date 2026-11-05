---
"@its/glowup-ui": minor
---

The theme carries a palette for data: `theme.charts` (type `ThemeChartTokens`), apart from the UI roles and the same under every brand palette.

- `categorical`: eight series colours, to use in order and never cycled; the order keeps neighbours apart for colour-blind readers.
- `sequential`: one hue (blue), light to dark, for a magnitude.
- `diverging`: `negative` (red), `neutral` (grey) and `positive` (blue).

Light and dark are each their own steps, validated for colour-blind separation and contrast against the light and dark surfaces of every built-in palette. On light surfaces aqua, yellow and magenta (and orange on a container) sit below 3:1, so a chart that uses them should also show labels or a table view.

A `Theme` built by hand needs the new `charts` field.
