---
"@its/glowup-ui": patch
---

Autocomplete: the browser focus ring no longer draws inside the field on web. `outlineWidth: 0` does not suppress Chrome's `outline-style: auto` ring; it now uses `outlineStyle: "none"`, as Input and SearchBar already did.
