---
"@its/glowup-ui": minor
---

`ConfirmDialog` is removed, with its `ConfirmDialogProps` type and no alias: `AlertDialog` now does its job.
Migrate: `confirmText` -> `actionText` (default `OK`, was `Confirm`), `onConfirm` -> `onAction`, and `cancelText`
has no default any more (pass it to keep the Cancel button). `title`, `message`, `destructive`, `icon` and
`slotStyles` keep their names. `dismissable` (default `true`) becomes `disableBackdropClick={false}` plus
`disableEscapeKeyDown={false}`: an `AlertDialog` ignores the backdrop and Escape unless you turn that on.
`AlertDialog` gained `icon`, a hero glyph above the title that replaces the `severity` icon.
