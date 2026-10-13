---
"@its/glowup-ui": patch
---

`Grid` with `minChildWidth` no longer breaks the hydration of a statically exported web page.
Before its first layout pass it falls back to the window width, which is 0 in the Node
prerender; it now reads that width through a server snapshot, so the prerendered rows and
the first client render agree instead of React discarding the page (minified error #418).
The README gains a "Static web export" section: register the icon font with `useFonts` in the
root layout, and keep the window size and the current time out of the first render.
