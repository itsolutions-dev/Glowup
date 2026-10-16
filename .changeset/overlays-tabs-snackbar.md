---
"@its/glowup-ui": minor
---

- `Modal` takes `size` (`"xs"` 360, `"sm"` 480, `"md"` 560, `"lg"` 800, the maximum width on a wide window); the default is `"md"`, the width it always had.
- `BottomSheet` takes `actions` (a row fixed at the bottom, below a divider) and `showCloseButton`, and its content now scrolls on its own, so a tall sheet keeps its actions in view.
- `Tabs` tabs can be objects with a `key` and `disabled`, selected with `activeKey`; `onChange` gets the position and, when there is one, the key as a second argument. `activeTab` is now optional and still works. `TabItem` is exported.
- `Snackbar` and `useToast()` gain `"warning"` and `"info"` (with `toast.warning()` and `toast.info()`), and `"success"` now uses the theme's success colours instead of the secondary container.
