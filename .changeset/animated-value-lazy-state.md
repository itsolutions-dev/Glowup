---
"@glowup/ui": patch
---

Hold each component's `Animated.Value` in lazy state (`useState(() => new Animated.Value(…))`)
instead of `useRef(new Animated.Value(…)).current`, in `Toggle`, `Snackbar`, `Tabs`, `SpeedDial`,
`CircularProgress` and `LinearProgress`.

Behaviour is unchanged — the instance is still created once and stays stable — but the value is
read during render to build the interpolations, which is not what refs are for; the ref form also
re-ran `new Animated.Value(…)` on every render and threw the result away. This clears
`react-hooks/refs`, letting `npm run lint` gate CI.
