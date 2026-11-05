---
"@its/glowup-ui": minor
---

Second-tier fixes, each reproduced in a failing test first:

- **No `SafeAreaProvider` needed.** `AppBar`, `Toolbar`, `FAB`, `SpeedDial` and a swipeable `Drawer` threw "No safe area value available" in an app without one. Without a provider the insets are now zero.
- **Outside a `ThemeProvider` a component is light**, the theme a provider gives with no OS preference. It was dark, so the same screen looked different with and without a provider.
- **Elevation 5 is `surfaceContainerHighest`** (with the deepest shadow). It was `surfaceDim`, darker than the page in dark mode, so the highest level looked like the lowest.
- **Light `surfaceContainerHighest` is `#E6E0E9`**, the Material 3 baseline value. It was `#EDE7F0`, lighter than `surfaceContainerHigh`, so the container scale went backwards at its top. Only the baseline palette changes.
- **`Table` / `DataGrid`**: a sortable column header carries `aria-sort` (ascending, descending or none); its sort button is "Sort by <column>" and the reorder arrows are "Move <column> left/right" (they had no role or name). On the web a clickable row stays a `row`, so buttons in its cells are no longer nested in a button; Enter still presses it.
- **`Pagination` keeps the same width on every page** (`2 × siblingCount + 5` slots), so the arrows no longer move out from under the pointer.
- **`Snackbar` with `duration={0}` and no `onClose` or action** shows a close button that calls `onDismiss`. Nothing could dismiss it before (a toast with `duration: 0` stayed up for good).
- **`Carousel` snaps back onto its page** after a rotation or a resize, instead of resting between two pages.
- **A closed `Collapse` with `collapsedHeight`** leaves its visible teaser readable by screen readers; only a fully closed one is hidden.
- **`Image` with neither `height` nor `ratio`** takes the picture's own proportions (a 4:3 placeholder until it loads). It drew nothing.
- **`Grid`** leaves the container's padding and border out of the row its items share; items overflowed a padded container.
- **A group `DrawerItem` in a collapsed `Drawer`** is a plain item: it no longer flips and announces a hidden open state.
- **`Link`** draws the external-link icon for `http` and `https` addresses only, not for `mailto:` and `tel:`.
- **`StatusBadge`** is read as its label: "error: Non pagato" is now "Non pagato".
- **A disabled `FormControl`** no longer lets its control be pressed (it only dimmed it).
- **`Avatar`'s status dots** use the theme's `success`, `warning`, `error` and `outline` roles instead of fixed hexes; `Popover` and `BottomSheet` take their shadow and scrim from the theme.
