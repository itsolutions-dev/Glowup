---
"@its/glowup-ui": patch
---

`ListItem` without `onPress` no longer marks its row as disabled. It rendered a disabled
`Pressable`, which screen readers announce as disabled (`aria-disabled` on the web), and that
state reached the controls in its slots too: a `Toggle` in `trailing` read as disabled although
it worked. The row is now a plain view; with `onPress` it stays a button, with the same hover and
press styles.
