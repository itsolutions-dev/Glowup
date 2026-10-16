---
"@its/glowup-ui": minor
---

`Input` takes `decimalSeparator` (`"."` or `","`) for `type="number"`: a user can type and see `12,50` while `value` and `onChangeText` stay in the plain form (`"12.50"`). Before, a comma was silently dropped (`12,50` became `1250`); with the default `"."` that is unchanged. Also `allUpperCase` (capitals as typed, and the keyboard asked for them) and `reserveHelperText`, which keeps the line under the field so a message appearing does not move the next field.
