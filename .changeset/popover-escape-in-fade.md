---
"@its/glowup-ui": patch
---

`Popover` (and so `Select` and `Menu`) closes on Escape on the web from the keydown and swallows the
keyup: an Escape pressed while it was still fading in no longer closes the `Dialog` or `Drawer` under it.
