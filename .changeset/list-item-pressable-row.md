---
"@its/glowup-ui": minor
---

`ListItem` with `onClick` is now one pressable row: hover and press are drawn over the whole row, and the `action` zone (the gap around it included) presses it. The `action` is a sibling of the row's button, never inside it (no button in a button on the web). A bare icon, chip or text in `action` presses the row; a control in it (an `IconButton`, a `Switch`) runs its own handler and never `onClick`. The row's accessible name is its texts, not the action's. Without `onClick` nothing changes.
