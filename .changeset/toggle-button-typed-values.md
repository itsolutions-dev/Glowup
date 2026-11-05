---
"@its/glowup-ui": minor
---

**`ToggleButtonGroup`** options take a value of any type, compared with `===`: `null` / `true` / `false` make an all / yes / no filter (the CRM's tri-state filter). Each option also takes a **`tooltip`**, shown on hover and keyboard focus on the web, which on every platform names an icon-only segment for screen readers (before, it was read as "close toggle button"). **`Tooltip`** takes a `style` for its wrapper. Nothing changes for existing callers.
