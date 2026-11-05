---
"@its/glowup-ui": minor
---

Fixes for bugs that broke an app:

- **Escape on the web closes only the top dialog, once.** `Dialog` and the swipeable `Drawer` listened for Escape themselves on top of react-native-web's `Modal`, which already handles it for the topmost modal: one press called `onClose` twice and closed every dialog of a stack.
- **A date or time picker seeded open (`defaultOpen`) no longer throws in a statically exported page.** Its docked popover was portalled during the server render, where there is no `document`; it now appears once the page runs in the browser.
- **`Alert()`**: on iOS and Android it calls the system alert directly, so one raised before the `AlertProvider` mounts is no longer lost (on the web it waits and shows when the provider mounts). On the web a second alert waits behind the first instead of replacing it, and Escape answers with the `cancel` button's `onPress`.
- **Enter on the web** no longer submits a `Form` that is `disabled`, or whose submit buttons are all `disabled`.
- **`ProgressButton`** takes `type="submit"`, so it can submit a `Form`.
- **`NumberField`** has no hidden range: without `min` and `max` it used to clamp to 0..100 in silence (a price of 250 came back as 100, and no negative number could be typed). It takes decimals typed with a point or a comma, and a fractional `step` adds up without floating-point noise (0.1 + 0.2 is 0.3). Set `min={0}` and `max={100}` to keep the old limits.
- **`Table`** keys a row by its `id` when it has one, so a row's local state (a field being typed in, a toggle) follows the record through a sort or a filter instead of staying at the position.
- **`Select`** ticks the selected option when its value is `0`, `""` or `false`.
- **`PinInput`** fires `onComplete` only when every cell holds a character: typing a later cell first no longer completes the code with blanks.
