---
"@its/glowup-ui": minor
---

**Breaking:** `Typography` without a `variant` is now `body1` (`bodyLarge`), not `h1` (`displayLarge`, 57 px). A bare `<Typography>` used to draw display-sized text with no heading semantics; pass `variant="h1"` where that size was meant.
