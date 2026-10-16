---
"@its/glowup-ui": minor
---

`DataGrid` columns take `renderCell(value, row, index)` to draw a cell (a badge, an amount, a button) and `align` (`"left" | "center" | "right"`) for the header and the cells; `rowStyle` may be a function of the row; `emptyState` draws any node when there is no data, ahead of `emptyMessage`. `TableCell` and `TableHeaderCell` take `align` too, and `TableAlign` is exported.
