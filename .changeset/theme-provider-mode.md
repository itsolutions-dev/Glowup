---
"@its/glowup-ui": minor
---

`ThemeProvider` takes `initialMode` (`"light"`, `"dark"` or `"system"`, the default): an app starts on the reader's
stored scheme from the first render, with no frame of the other one. `mode` + `onModeChange` make it controlled.
`useTheme()` adds `mode` (the scheme chosen, `"system"` included) and `setMode`; `toggleTheme` is unchanged.
