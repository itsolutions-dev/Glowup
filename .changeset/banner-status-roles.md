---
"@its/glowup-ui": patch
---

`Banner` draws its `warning` and `info` types from the new `warning` and `info` colour roles instead of borrowing the palette's tertiary and secondary containers, so a warning is amber in every palette (it was green in the brand ones).
