---
"@its/glowup-ui": patch
---

A `Card` without `onClick` is a plain frame. It was a disabled pressable, so on the web it carried `aria-disabled="true"`, which the buttons inside it inherited: screen readers read them as unavailable and test runners refused to click them.
