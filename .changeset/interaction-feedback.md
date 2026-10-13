---
"@its/glowup-ui": minor
---

`ThemeProvider` takes `onInteractionFeedback(kind)`, called when the user presses, toggles or
selects through a library control, so an app can answer with a haptic
(`@its/glowup-device/haptics`'s `hapticFeedback` plugs in as it is; the library itself plays
nothing and depends on no haptics module).

- `Button`, `IconButton`, `FAB` and action `Chip`s report `press`; `Toggle`, `Checkbox`, a
  `selected` `IconButton`, a `"checkbox"` `Chip` and a multi-select `ToggleButtonGroup` report
  `toggle`; `RadioButton` / `RadioGroup`, a `"radio"` `Chip`, a single-choice
  `ToggleButtonGroup` and a `Slider` crossing a step (with `step` only) report `selection`.
- It runs before the control's own handler and only when the press does something; a handler
  that throws never cancels the press. Each of these controls takes `feedback={false}` to opt
  out, and a nested `ThemeProvider` without the prop inherits the outer handler.
- `useInteractionFeedback()` gives the same function to an app's own components.
