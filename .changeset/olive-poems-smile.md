---
"@its/glowup-ui": minor
---

`Modal`'s `visible` prop is required.

It was the only overlay in the kit where it was optional — `Snackbar`, `Banner`,
`ConfirmDialog`, `Popover`, `BottomSheet` and `Menu` all require it — and it had
no default, so `visible` was `undefined` and the dialog never appeared. `<Modal>`
type-checked and rendered nothing.

This is a type-level tightening, so it can fail a build that previously
compiled. Nothing that worked stops working: any call site it flags is one
whose modal was permanently invisible, and the fix is to pass the state that
should have been driving it.
