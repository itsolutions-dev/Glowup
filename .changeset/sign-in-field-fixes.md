---
"@its/glowup-ui": patch
---

Fixes found by building a sign-in with 2FA screen with the library:

- **`PasswordField` with `showStrength` no longer crashes inside a `Form`**: a `FormField` hands `undefined` to a field its form's `initialValues` leave out, and the strength meter read its `length`. It now counts as empty.
- **No browser focus ring inside the fields on the web**: `Input`, `PasswordField` and the other fields built on the same frame, and `PinInput`, meant to hide the browser's outline (they draw their own focus ring) but used `outlineWidth: 0`, which Chrome ignores for keyboard focus: a Tab into a field drew a black frame inside the field's own. They now use `outlineStyle: "none"`, like `SearchBar` and `NumberField`.
- **`PinInput` fits a narrow row**: six 48 px cells need 328 px, more than a phone leaves inside a padded card, so the row overflowed and pushed the page sideways. The cells now narrow to fit (never wider than `cellSize`); where they fit, nothing changes.
