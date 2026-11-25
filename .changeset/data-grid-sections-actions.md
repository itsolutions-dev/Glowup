---
"@its/glowup-ui": minor
---

`DataGrid`: `sections` draws the rows in groups under header rows that fold and unfold them; `rowActions` draws each row's actions as icon buttons in a last column, shown always or, with `revealRowActions="hover"`, on hover and focus (web); `renderRow` draws a whole row instead of its cells; a column's `width` may be a percentage of the grid (`"30%"`), and `minWidth` sets the narrowest a flexible or percentage column gets. `TableCell` and `TableHeaderCell` take a percentage `width` and `minWidth`, `TableRow` an `onHoverChange`; `gridMinWidth` is exported. Once its box is measured the grid is laid out at the box's width (never under its columns' minimum), so a long header or cell text no longer widens it into a sideways scroll; a text header is drawn on one line with an ellipsis, a node header outside the header's `Text`.
