---
"@its/glowup-ui": patch
---

`DataGrid` (and `Table` header) fixes found by building a contacts list with the library:

- **A row grows to fit a taller cell.** Rows had a fixed height (56, or 40 when dense), so a cell of two lines (a name with a chip under it) spilled out of its row. The height is now a minimum: one-line rows are as before.
- **The columns span the grid.** A column without a `width` was a fixed 150 px, so a grid narrower than its box left an empty band on the right. Columns without a `width` now share the free width, never narrower than 150, as `Table`'s columns do; the grid still scrolls sideways when its columns don't fit. Grids whose columns all have a `width` are unchanged.
- **The header lines up with the rows.** On the web the list's vertical scrollbar took width from the rows and not from the header above them, so the column borders drifted apart. The grid's inner scrollbar is now hidden, as `Table`'s already was.
- **A sortable column shows it before it is sorted** (in `DataGrid` and `Table`): an up-and-down icon in the text colour, instead of a faint half-transparent arrow.
