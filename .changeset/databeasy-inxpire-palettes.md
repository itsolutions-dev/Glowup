---
"@its/glowup-ui": minor
---

New `databeasy` and `inxpire` palettes: hand-authored brand colour sets, listed in `palettes` right after `baseline`. They also bring the brand's type scale (Roboto for Databeasy, Geist for inXpire) and icon set (Material for Databeasy, Eva for inXpire). To support that, `ThemePalette` gains two optional fields: `typography` (per-variant style overrides merged over the default scale) and `iconSet` (`"material"` or `"eva"`). The library only names the fonts; load `Roboto_*` / `Geist_*` in your app with `expo-font`.
