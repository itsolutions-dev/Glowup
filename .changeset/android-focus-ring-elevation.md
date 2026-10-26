---
"@its/glowup-ui": patch
---

On Android, the focus ring of `Input` and `SearchBar` no longer adds `elevation: 4` to the field's container. In the native check the app asked to hide the keyboard 4 ms after it had shown it, and a plain `TextInput` in the same place kept it. Web and iOS are unchanged.
