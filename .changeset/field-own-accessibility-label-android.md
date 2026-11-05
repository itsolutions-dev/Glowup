---
"@its/glowup-ui": patch
---

**A field's own `accessibilityLabel` names it on Android again.** `inputProps.accessibilityLabel` on `Input`, `InputArea` and `PasswordField` replaces the name drawn from `label`, but on Android the field was also tied to its label view (`accessibilityLabelledBy`), which TalkBack reads first: a field labelled "Email" with `accessibilityLabel: "Customer email"` was announced as "Email". With an `accessibilityLabel` of its own the field is no longer tied to the label. Found by running the library's tests as Android, which they now do on every run, beside iOS and a new set of web tests.
