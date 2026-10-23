---
"@its/glowup-ui": minor
---

`DataGrid` takes the props `Table` has, and stays a separate component: `tableTitle`, `width`, `height` (fixed header, the virtualised rows scroll), `rowsPerPage` (a `Pagination` under the grid, back to page 1 when `rowsPerPage` or the row count changes), `hover`, `selected` (a row index or indexes in `data`) and `onClick(row, index)` (pressable rows with the button role). Columns also accept `alignment` and `fallback`, and `label` and `emptyMessage` accept any node.

Fixed: a column reorder is no longer lost when `columns` is a new array with the same ids (an inline array); the order is kept by id, and cells draw from the latest column definitions. The odd-row stripe is drawn on the cells, so a hovered or selected row shows its own colour.
