---
"@its/glowup-ui": minor
---

Screen-reader fixes from a TalkBack pass on Android, each heard on the emulator before and after:

- **Icons are no longer read.** An icon is a character of the icon font, and a pressable row is named by the text inside it, so TalkBack read a box or a stray character before the words ("□, Roadmap 2027.pdf, Edited yesterday"): in `ListItem`, `Card`, `DataGrid` and `Table` rows, `Breadcrumbs`, `StatusBadge` and every other component that draws one. Icons are now hidden from screen readers on every platform; the control around them carries the name. An icon-only `Button` must therefore be given `accessibilityLabel` (it used to be "named" by the icon's character, which was no name either).
- **`Switch` takes `accessibilityLabel`** (new, optional): the name for a switch drawn without `label`, as in a `ListItem`'s `action` beside the words that describe it. Without it such a switch was only "on, Switch". It replaces `label` when both are given.
- **An `Avatar` without `onClick` is an image, not a disabled control**: TalkBack said "Marta Rossi Avatar. Image. disabled".
- **A `StatusBadge` says its label once**: inside a pressable row its text repeated the badge's name ("Due, Due").
