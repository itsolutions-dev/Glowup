---
"@its/glowup-ui": patch
---

`DataGrid` mounted with no rows (a fetch in flight) starts a new list when the rows arrive. It kept the render
window of its empty first render: about ten rows were drawn and `onEndReached` was never called.
