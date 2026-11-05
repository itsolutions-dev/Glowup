---
"@its/glowup-ui": minor
---

**`Dialog`** takes **`overline`**, a small line above the title (what the dialog is about: a record, a step); **`leadingActions`**, actions on the start of the actions row apart from `actions` at its end ("Delete" on the left, "Cancel" and "Save" on the right); and **`dividers`**, a line above and below the body. A full-screen dialog ignores all three. The actions row gets the testID `${testID}-actions`. Nothing changes for existing dialogs.
