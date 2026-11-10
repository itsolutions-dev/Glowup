---
"@its/glowup-ui": patch
---

`BottomSheet` and `Snackbar` reopened while closing stay mounted (the interrupted close no
longer unmounts them for a frame), and the web `DateTimePicker` no longer re-renders on every
scroll event while open.
