---
"@its/glowup-ui": patch
---

`ThemeProvider` and `Grid` hydrate cleanly over server-rendered HTML. The OS colour
scheme and the window width are read with `useSyncExternalStore` and a server snapshot
("no preference" and 0, what a prerender sees), so a reader on a dark OS or a wide window
no longer gets React's hydration error #418 on a statically exported page; the real values
apply right after hydration. Native is unaffected.
