---
"@its/glowup-ui": patch
---

**`DataGrid` no longer redraws every row when the screen around it re-renders.** Each row is drawn again only when something it shows changes (its data, index, stripe, selection, the columns, `onClick`, `rowStyle`): a keystroke in a search box before its debounce, or a counter elsewhere on the screen, redrew every row the grid had drawn (0.14 s a keystroke with 2,000 contacts in the production web build). For this, keep `columns` stable with `useMemo` and `onClick` with `useCallback`. A sort still redraws the rows that moved. The `onClick` doc now says what a pressable row is on each platform.
