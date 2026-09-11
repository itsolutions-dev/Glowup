---
"@its/glowup-ui": minor
---

Colour sets: `ThemeProvider` now resolves its tokens from a palette rather than
from `theme.json` directly. Six Material 3 schemes ship as `palettes`, an
`initialPalette` prop picks the one an app starts on, and `useTheme()` exposes
`palette`/`setPalette` to swap it at runtime. `createPalette(seed)` derives a
complete light/dark token set from one source colour the way Material 3 does —
tonal palettes for primary, secondary, tertiary and the neutrals, with error
left on the fixed Material red. Nothing changes for an app that does not pass
`initialPalette`: the default is the baseline scheme the library already had.
