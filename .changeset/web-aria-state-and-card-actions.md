---
"@its/glowup-ui": minor
---

Web screen readers hear the state of every control, and a pressable `Card` no longer swallows its actions:

- **State reaches the page on the web.** react-native-web reads `aria-*` props and ignores the `accessibilityState` and `accessibilityValue` objects, so a web screen reader never heard that a checkbox was checked, a tab selected, a select open or a rating at 3 of 5. Every control now also sets the aria attribute its role takes: `aria-checked` (checkbox, radio, switch), `aria-selected` (tab, option, row), `aria-pressed` (a toggle button, an `IconButton` with `selected`), `aria-current="page"` (the selected link, the last breadcrumb), `aria-expanded`, `aria-disabled`, `aria-busy`, and `aria-valuemin/max/now/text` on a range. iOS and Android are unchanged.
- **`Select`'s trigger is a `combobox` on the web** (it was a `listbox`, which is the list it opens).
- **`Menu` with `selected` is a group of `menuitemradio`s on the web**, which is what can carry a checked state.
- **`Breadcrumbs`** is a `navigation` landmark named "Breadcrumbs" (it was a `menubar`), and its last item is `aria-current="page"`.
- **A pressable `Card` with `Card.Actions`** is an action area plus an actions row, as in Material 3: the action buttons are no longer nested inside the card's button (invalid on the web; on iOS the card was one element and VoiceOver could not reach them). Pressing an action runs that action only; the rest of the card still opens it, with the same hover and press look. A card without actions is unchanged.
