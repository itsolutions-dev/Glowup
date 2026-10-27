---
"@its/glowup-ui": minor
---

`GridLayout` places its children on a grid of cells from layout data (`layout: { id, x, y, w, h }[]`, matched to the children by `key`): `columns` (default `12`), `rowHeight` (`48` dp), `gap` (`16` dp), and `stackBelow` (`"medium"`), the window size class below which the children stack full width in reading order at their content's height. Empty cells stay empty; an item is as tall as its rows and taller content scrolls inside it; out-of-range entries are clamped into the grid. Placement uses percentages plus dp margins, so the grid needs no measured width and prerenders. `clampGridItem`, `gridLayoutHeight` and `gridReadingOrder` are exported for code that edits layouts.
