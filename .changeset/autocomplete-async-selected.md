---
"@its/glowup-ui": minor
---

`Autocomplete` gains a server search and a chosen option kept apart from the text. `onSearch(text)` is called after the user stops typing for `debounceMs` (default 300) once `minChars` is reached, and with `""` on clear; with it the options are no longer filtered again by label. `selected` / `onSelectedChange` carry the chosen option (and `null` when the text moves away from it or the field is cleared). `allowCustomValue={false}` makes leaving the field put back the chosen label, or empty it. Defaults are unchanged.
