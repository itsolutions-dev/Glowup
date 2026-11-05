---
"@its/glowup-ui": minor
---

Accessibility and keyboard fixes, each reproduced in a failing test first:

- **Text fields say which field they are on Android.** TalkBack reads a filled edit box as its text and drops its description, so a filled `Input` was "mario@rossi.it, Edit box" with no "Email"; an empty one was "Username, , Edit box". `Input`, `InputArea`, `PasswordField` and `NumberField` now tie the field to its label (`accessibilityLabelledBy`) on Android: "mario@rossi.it, Edit box for Email". The value is no longer copied into `accessibilityValue` on any platform: the edit box exposes its own text.
- **The keyboard's return key submits a `Form` on iOS and Android**, as Enter does on the web: in an `Input` inside a `Form`, unless the form or every submit button in it is disabled. An app that passes its own `inputProps.onSubmitEditing` (to move to the next field, say) keeps it, and the form is left alone.
- **Escape closes a popover, not the dialog under it.** A date picker, an `Autocomplete` list, a `Tooltip` or a `HoverCard` inside a `Dialog` closed on the Escape keydown and the dialog closed on the keyup of the same press. One Escape now closes one thing.
- **`FormField`'s function child is typed.** `FormFieldChildProps` was `any`, which switched off prop checking for the whole element (`<Input lable="Email" {...field} />` compiled). It now follows `valuePropName`, `trigger` and `control`. Code that read a prop the field does not hand over now fails to compile.
- **`Pagination`**: the current page is no longer disabled (it was announced as unavailable and skipped by Tab); pressing it does nothing, and on the web it is `aria-current="page"`. The pager is a `navigation` landmark named "Pagination", not a `menubar`.
- **`SpeedDial`**: the trigger is "Open actions" / "Close actions" and each action is named by its label (they were "plus FAB", "pencil FAB"); the label card beside an action is not read a second time; closed actions are hidden from screen readers and out of the web tab order.
- **`Snackbar` and `Banner` are announced on iOS**, which has no live regions (VoiceOver never heard them). A `Banner` is announced when it appears or its message changes, not when the screen opens with it. On the web `Banner` is `role="status"`, not an alert that interrupts.
