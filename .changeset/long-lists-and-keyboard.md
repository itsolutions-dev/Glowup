---
"@its/glowup-ui": patch
---

Lists, keyboard and names, each reproduced in a failing test first:

- **`Select` and `Menu` draw about a screen of options, not all of them.** They rendered every option the moment they opened (a `ScrollView` with a map); a list of a few hundred customers or cities was slow on a phone. They are virtualized now (`FlatList`). `Autocomplete` already showed at most `maxSuggestions` (8 by default).
- **No more "VirtualizedLists should never be nested inside plain ScrollViews"** from the endless calendar of the date pickers (and from `Select` and `Menu`) inside a page that scrolls. Those lists scroll in a box of their own, so they window correctly; on Android they now also keep the finger (`nestedScrollEnabled`) instead of handing it to the page.
- **`Autocomplete`'s suggestions no longer open behind the on-screen keyboard.** The room below the field is what the keyboard leaves: with too little the list opens above the field, otherwise it opens below and no taller than the room there.
- **A `DataGrid` sort no longer draws the custom cells of every row that moved.** A `renderCell` declaring one or two parameters (`(value)`, `(value, row)`) cannot read the index, so a row that only moved keeps what it drew; one declaring three, or using rest parameters, is called again as before. A changed selection no longer redraws the row's cells either. A row whose `id` is `0` is keyed by its id, not by its position.
- **`FAB` without `label` and an icon-only `Button` without `accessibilityLabel` warn once in development**: icons are not read, so they have no name for screen readers ("plus FAB", "Button"). Production builds say nothing.
