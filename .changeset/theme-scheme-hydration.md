---
"@its/glowup-ui": patch
---

`ThemeProvider` hydrates cleanly over server-rendered HTML for a reader on a dark OS. The
colour scheme is read with `useSyncExternalStore` and a server snapshot ("no preference",
what a prerender sees) instead of `useColorScheme`, so the first client render matches the
light prerender instead of React discarding the page (minified error #418); the dark scheme
applies right after hydration. Native is unaffected.
