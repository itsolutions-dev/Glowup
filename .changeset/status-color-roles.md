---
"@its/glowup-ui": minor
---

Add the status colour roles `success`, `warning`, `info` and `neutral` (colour, on-colour, container, on-container) to `theme.colors`, in light and dark. They are fixed hues, the same in every palette. `Button`'s `tone="success"` and `StatusBadge` read them from the theme. A hand-written `ThemePalette` must now include them (spread them from `palettes.baseline`, or build it with `createPalette`).
