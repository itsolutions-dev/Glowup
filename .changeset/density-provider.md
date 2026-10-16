---
"@its/glowup-ui": minor
---

`ThemeProvider` takes a `density` (`"normal"` | `"dense"`) that becomes the default of `Input`, `Select`, `Button` and `DataGrid`, so a desktop app sets it once instead of on every control. A control's own `density` still wins, and a nested provider without one inherits. Also exported: the `Density` type and `useDensity` for components of your own.
