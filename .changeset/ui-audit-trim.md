---
"@its/glowup-ui": minor
---

Trim unused API surface and duplicated internals.

Breaking (no caller in the repo used these):

- `DataGrid` drops `onColumnReorder` and its reorder buttons; `TableHeaderCell` drops `onMoveLeft` / `onMoveRight`. Reorder `columns` yourself and pass them in.
- `ListItem` drops `itemHoveredStyle`, `itemPressedStyle` and `itemSecondaryTextStyle`; `itemContainerStyle` and `itemTextStyle` stay.
- `TouchableRipple` drops `activeStyle`.
- `Input` drops the lowercase `readonly` alias: pass React Native's `readOnly`. `Input` now accepts every other `TextInput` prop and passes it through, and `onFocus` / `onBlur` receive the event.
- `useToast()` no longer returns `queue`, so the toast API object is stable and stops re-rendering every consumer on each toast.

Internal: `Checkbox` and `RadioButton` share one control shell, `Button` / `IconButton` / `Chip` / `TouchableRipple` use `useStateLayer`, `Popover` measures its anchor once per open (plus one frame later), and `Box` no longer memoizes a plain style object.
