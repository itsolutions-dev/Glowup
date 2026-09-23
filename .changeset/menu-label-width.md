---
"@its/glowup-ui": patch
---

Menu: item labels no longer truncate when the menu is wider than its minimum. The label's `flex: 1` gave it a zero basis, so the menu sized itself as if the labels were empty.
