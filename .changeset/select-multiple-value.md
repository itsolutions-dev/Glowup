---
"@its/glowup-ui": minor
---

**Breaking:** `Select multiple` uses the same shape as every other value control. `value` is the array of selected option values (default `[]`) and `onChange(values)` fires with the new array on every toggle, add or remove. `selectedValues` and `toggleOptions` are removed, with no alias.

Migration: `selectedValues={x} toggleOptions={setX}` becomes `value={x} onChange={setX}`. Single select is unchanged; `showAsChips`, `nullable`, `disabledOptions`, `emptyMessage` and `fullWidth` keep working. `value` and `onChange` are now optional in the types.
