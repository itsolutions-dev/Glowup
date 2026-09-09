---
"@glowup/ui": minor
---

Close the coverage gaps found by auditing the kit against NativeBase, and rewrite the date/time
picker family.

**New components.** Layout primitives `Box`, `Stack`/`HStack`/`VStack`, `Center`, `Spacer`, `Grid`
and `AspectRatio`, all taking spacing/shape/color as theme token names. `FormControl` (with
`useFormControl`), `PinInput`, `Autocomplete`, `IconButton`, `Link`, `Image`, `Stat`, `Collapse`,
and `ToastProvider` + `useToast` for imperative, queued toasts.

**Date/time pickers.** `Calendar`, `TimeSelect`, `DatePicker` and `TimePicker` are now exported,
and `DateTimePicker` was rebuilt on top of them. Month and weekday names, week start, 12h/24h and
AM/PM labels are derived from `Intl` instead of the hardcoded Italian arrays the web picker
shipped; `mode="time"` and `mode="datetime"` get a real styled surface instead of an invisible
native input; the web popover flips and clamps to the viewport and follows scroll/resize. New
props: `minimumDate`, `maximumDate`, `isDateDisabled`, `error`, `helperText`, `required`,
`clearable`/`onClear`, `placeholder`, `minuteInterval`, `locale`, `firstDayOfWeek`, `variant`,
`labels`, `style`, `testID`. Full keyboard navigation on web (arrows, PageUp/PageDown, Home/End,
Enter, Escape).

`value` widens to `Date | null` so a picker can render empty; `onChange` keeps its
`(date: Date) => void` signature, and clearing goes through `onClear`.

**Fixes.** `Input`'s focus ring and error border were dead code — a leftover `BISECT-TEST` stub
replaced the glow styles with a plain grey border, so a field with an `error` message looked
normal. `Snackbar`'s `icon` is now typed as an icon name instead of `string` cast to `any`.
`PressableState` gained the `focused` flag react-native-web provides.
