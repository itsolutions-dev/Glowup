---
"@its/glowup-ui": minor
---

`ThemeProvider` draws the browser's own scrollbars from the theme on the web: a thin thumb in the `outline` colour on a transparent track, no arrows, and `color-scheme` set to the theme's mode. A textarea (`InputArea`), a `Select` or `Menu` list, a `DataGrid`'s horizontal bar no longer show a white default scrollbar in a dark page. One `<style>` in the document head, rewritten when the theme changes; `ScrollArea` is unaffected. New prop `themeScrollbars` (default `true`): pass `false` to keep the browser's scrollbars. No effect on iOS and Android.
