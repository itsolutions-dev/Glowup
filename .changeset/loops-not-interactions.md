---
"@its/glowup-ui": patch
---

Blink, Skeleton, CircularProgress and LinearProgress loop without holding an interaction handle, so a FlatList on screen with one of them keeps rendering past its first batch.
