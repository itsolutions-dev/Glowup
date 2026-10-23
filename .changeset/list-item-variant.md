---
"@its/glowup-ui": minor
---

`ListItem` takes `variant`: `"standard"` (transparent, no border, like a sidebar's rows), `"outlined"` or `"contained"`. `"contained"` is the default and is the fill the row always had.
The row now has a constant 1px border (transparent unless outlined) in every variant and state: hover and press recolour it instead of widening it from none to 1.5, so the layout no longer shifts, and the row is 2px taller than before.
