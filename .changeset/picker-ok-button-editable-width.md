---
"@its/glowup-ui": minor
---

`DatePicker`, `TimePicker` and `DateTimePicker` take `showOkButton` (default `true`). Set to `false`, a time closes and
sets after its minute (a date-time after the day, the hour and the minute) and a range after its second end. A set of days
and typed entry keep their OK, and a `static` picker has none. The web popover is also planned a few pixels taller than its
content, so a hovered OK no longer makes it scroll. `Editable` takes `fullWidth`: off (the default), the open field now has
exactly the width of the text it replaced, so opening it no longer moves the layout.
