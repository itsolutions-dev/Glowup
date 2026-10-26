---
"@its/glowup-ui": minor
---

Split the multi-line field out of `Input`. New `InputArea` (and `InputAreaProps`): `Input`'s box, label, variants, helper and error, form-field contract and accessibility, for text that wraps. `rows` gives a fixed height of exactly that many lines (text scrolls inside) and wins over the rest; `minRows` and `maxRows` make it start at `minRows` and grow with its text up to `maxRows`, then scroll (`minRows` alone: unbounded; `maxRows` alone: starts at one line; `maxRows` below `minRows` is raised to it); with none of the three it stays 4 lines.

Breaking (pre-1.0): `Input` is single-line only. `multiline` and `rows` are removed from `Input` and `PasswordField`, with no alias. Migrate `<Input multiline rows={n} />` to `<InputArea rows={n} />`. `Editable type="textarea"` now draws an `InputArea`.
